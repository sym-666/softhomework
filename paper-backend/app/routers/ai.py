import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import Field
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Paper, PaperChatMessage, PaperChunk, PaperGuide, User
from app.routers.study import StudyCardOut, to_card_out
from app.schemas import CamelModel, UtcDatetime
from app.services import llm
from app.services.paper_chat import ChatTurn, chat_events, save_exchange
from app.services.paper_guide import guide_events
from app.services.retrieval import Passage
from app.services.study_cards import generate_cards, save_cards

router = APIRouter(prefix="/api/ai", tags=["ai"])

MAX_HISTORY_TURNS = 12
# 只影响页面恢复多少条，发给模型的历史由 MAX_HISTORY_TURNS 限制
MAX_RESTORED_MESSAGES = 200
SSE_HEADERS = {
    # 关闭缓存和反向代理缓冲，否则回答会等到最后才一次性显示
    "Cache-Control": "no-cache, no-store",
    "X-Accel-Buffering": "no",
}
GuideLanguage = Literal["zh-CN", "en"]


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    # 助手回答可能较长，这里只防止异常请求，发给模型前会再截断
    content: str = Field(max_length=20_000)


class PaperChatRequest(CamelModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=MAX_HISTORY_TURNS)


class Citation(CamelModel):
    page: int
    snippet: str


class ChatHistoryItem(CamelModel):
    id: int
    role: str
    content: str
    citations: list[Citation]
    created_at: UtcDatetime


class GuideOut(CamelModel):
    content: str
    model: str
    created_at: UtcDatetime


def load_passages(db: Session, paper_id: int) -> list[Passage]:
    rows = db.execute(
        select(PaperChunk.page, PaperChunk.text)
        .where(PaperChunk.paper_id == paper_id)
        .order_by(PaperChunk.chunk_index)
    ).all()
    return [Passage(page=page, text=text) for page, text in rows]


@router.get("/status")
def status(_user: User = Depends(get_current_user)) -> dict[str, bool]:
    return {"enabled": llm.is_configured()}


def load_ai_source(db: Session, paper_id: int) -> tuple[Paper, list[Passage]]:
    """校验放在流式开始之前，出错时才能返回普通 JSON，前端可以读取 message。"""
    if not llm.is_configured():
        raise HTTPException(status_code=503, detail="AI 功能未配置，请联系管理员")
    paper = db.get(Paper, paper_id)
    if paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    if paper.ingest_status in ("pending", "processing"):
        raise HTTPException(status_code=409, detail="论文还在解析中，请稍后再试")

    passages = load_passages(db, paper_id)
    if not passages and not paper.abstract.strip():
        raise HTTPException(status_code=400, detail="这篇论文没有可供 AI 阅读的内容")
    return paper, passages


@router.post("/paperchat")
def paper_chat(
    body: PaperChatRequest,
    paper_id: int = Query(alias="id"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    question = body.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="消息不能为空")
    paper, passages = load_ai_source(db, paper_id)
    history = [ChatTurn(turn.role, turn.content) for turn in body.history]
    # 响应开始后请求作用域的 ORM 对象不再可靠，这里先取出主键
    user_id = user.id

    def save(answer: str, citations: list[dict[str, object]]) -> None:
        save_exchange(user_id, paper_id, question, answer, citations)

    return StreamingResponse(
        chat_events(paper, passages, question, history, on_complete=save),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.get("/paperchat/history", response_model=list[ChatHistoryItem])
def get_chat_history(
    paper_id: int = Query(alias="id"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ChatHistoryItem]:
    # 先按新到旧取最近的记录，再翻转成阅读顺序
    rows = db.scalars(
        select(PaperChatMessage)
        .where(PaperChatMessage.user_id == user.id, PaperChatMessage.paper_id == paper_id)
        .order_by(PaperChatMessage.id.desc())
        .limit(MAX_RESTORED_MESSAGES)
    ).all()
    return [
        ChatHistoryItem(
            id=row.id,
            role=row.role,
            content=row.content,
            citations=json.loads(row.citations),
            created_at=row.created_at,
        )
        for row in reversed(rows)
    ]


@router.delete("/paperchat/history", status_code=204)
def clear_chat_history(
    paper_id: int = Query(alias="id"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.execute(
        delete(PaperChatMessage).where(
            PaperChatMessage.user_id == user.id, PaperChatMessage.paper_id == paper_id
        )
    )
    db.commit()


@router.get("/paperguide", response_model=GuideOut | None)
def get_paper_guide(
    paper_id: int = Query(alias="id"),
    language: GuideLanguage = Query(alias="lang"),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaperGuide | None:
    return db.scalar(
        select(PaperGuide).where(
            PaperGuide.paper_id == paper_id, PaperGuide.language == language
        )
    )


@router.post("/paperguide")
def generate_paper_guide(
    paper_id: int = Query(alias="id"),
    language: GuideLanguage = Query(alias="lang"),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    paper, passages = load_ai_source(db, paper_id)
    return StreamingResponse(
        guide_events(paper, passages, language),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.post("/studycards", response_model=list[StudyCardOut], status_code=201)
def generate_study_cards(
    paper_id: int = Query(alias="id"),
    language: GuideLanguage = Query(alias="lang"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StudyCardOut]:
    paper, passages = load_ai_source(db, paper_id)
    try:
        drafts = generate_cards(paper, passages, language)
    except llm.LlmError as exc:
        raise HTTPException(status_code=502, detail="AI 服务暂时不可用，请稍后再试") from exc
    try:
        cards = save_cards(db, user.id, paper_id, drafts)
    except IntegrityError as exc:
        # 同一用户同时点了两次生成，先到的已经写入
        db.rollback()
        raise HTTPException(status_code=409, detail="题目正在生成，请稍后刷新") from exc
    return [to_card_out(card) for card in cards]

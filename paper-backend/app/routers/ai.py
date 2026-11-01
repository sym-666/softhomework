from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Paper, PaperChunk, User
from app.schemas import CamelModel
from app.services import llm
from app.services.paper_chat import ChatTurn, chat_events
from app.services.retrieval import Passage

router = APIRouter(prefix="/api/ai", tags=["ai"])

MAX_HISTORY_TURNS = 12


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    # 助手回答可能较长，这里只防止异常请求，发给模型前会再截断
    content: str = Field(max_length=20_000)


class PaperChatRequest(CamelModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=MAX_HISTORY_TURNS)


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


@router.post("/paperchat")
def paper_chat(
    body: PaperChatRequest,
    paper_id: int = Query(alias="id"),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    question = body.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="消息不能为空")
    if not llm.is_configured():
        raise HTTPException(status_code=503, detail="AI 功能未配置，请联系管理员")
    paper = db.get(Paper, paper_id)
    if paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    if paper.ingest_status in ("pending", "processing"):
        raise HTTPException(status_code=409, detail="论文还在解析中，请稍后再问")

    passages = load_passages(db, paper_id)
    if not passages and not paper.abstract.strip():
        raise HTTPException(status_code=400, detail="这篇论文没有可供 AI 阅读的内容")

    history = [ChatTurn(turn.role, turn.content) for turn in body.history]
    return StreamingResponse(
        chat_events(paper, passages, question, history),
        media_type="text/event-stream",
        # 关闭缓存和反向代理缓冲，否则回答会等到最后才一次性显示
        headers={"Cache-Control": "no-cache, no-store", "X-Accel-Buffering": "no"},
    )

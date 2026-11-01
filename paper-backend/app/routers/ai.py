from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models import User
from app.services import llm

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/status")
def status(_user: User = Depends(get_current_user)) -> dict[str, bool]:
    return {"enabled": llm.is_configured()}

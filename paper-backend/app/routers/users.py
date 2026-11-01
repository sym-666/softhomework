from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models import User
from app.routers.auth import UserOut

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/getuser", response_model=UserOut)
def get_user(user: User = Depends(get_current_user)) -> User:
    return user

from sqlalchemy import select

from app.db import SessionLocal
from app.models import PaperChatMessage
from tests.conftest import login_as
from tests.test_papers import upload


def test_deleting_paper_removes_its_messages(client) -> None:
    user = login_as(client, "alice")
    paper_id = upload(client)
    with SessionLocal() as db:
        db.add(PaperChatMessage(user_id=user["id"], paper_id=paper_id, role="user", content="hi"))
        db.commit()

    assert client.delete(f"/api/Papers/{paper_id}").status_code == 204

    with SessionLocal() as db:
        assert db.scalars(select(PaperChatMessage)).all() == []

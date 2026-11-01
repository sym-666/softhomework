from datetime import UTC, date, datetime, timedelta

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.models import StudyCard
from app.routers.dashboard import build_activity
from tests.conftest import login_as
from tests.test_notes import add_note
from tests.test_papers import upload
from tests.test_reading import state_url

NOW = datetime(2026, 11, 1, 20, 0, tzinfo=UTC)


def test_activity_covers_fixed_number_of_days_in_order() -> None:
    activity = build_activity([], [], NOW, 0, days=3)

    assert [item.date for item in activity] == [
        date(2026, 10, 30),
        date(2026, 10, 31),
        date(2026, 11, 1),
    ]
    assert all(item.papers == 0 and item.notes == 0 for item in activity)


def test_activity_counts_each_day() -> None:
    activity = build_activity(
        [NOW, NOW - timedelta(hours=1), NOW - timedelta(days=1)],
        [NOW - timedelta(days=1)],
        NOW,
        0,
        days=2,
    )

    assert [(item.papers, item.notes) for item in activity] == [(1, 1), (2, 0)]


def test_activity_uses_user_timezone() -> None:
    # UTC 20:00 在北京时间已经是第二天
    activity = build_activity([NOW], [], NOW, -480, days=2)

    assert activity[-1].date == date(2026, 11, 2)
    assert activity[-1].papers == 1


def test_activity_ignores_events_outside_window() -> None:
    activity = build_activity([NOW - timedelta(days=30)], [], NOW, 0, days=3)

    assert sum(item.papers for item in activity) == 0


def test_activity_accepts_naive_database_times() -> None:
    activity = build_activity([NOW.replace(tzinfo=None)], [], NOW, 0, days=1)

    assert activity[0].papers == 1


def test_empty_dashboard(user_client: TestClient) -> None:
    body = user_client.get("/api/Dashboard").json()

    assert body["totalPapers"] == 0
    assert body["reading"] == 0
    assert body["done"] == 0
    assert body["notes"] == 0
    assert len(body["activity"]) == 14
    assert body["continueReading"] == []


def test_dashboard_reflects_activity(user_client: TestClient) -> None:
    reading = upload(user_client)
    finished = upload(user_client)
    user_client.put(state_url(reading), json={"lastPage": 4})
    user_client.put(state_url(finished), json={"status": "done"})
    add_note(user_client, reading)

    body = user_client.get("/api/Dashboard").json()

    assert body["totalPapers"] == 2
    assert body["reading"] == 1
    assert body["done"] == 1
    assert body["notes"] == 1
    assert body["activity"][-1]["papers"] == 2
    assert body["activity"][-1]["notes"] == 1
    assert body["continueReading"] == [
        {"paperId": reading, "title": "Paper", "authors": "A. Author", "lastPage": 4}
    ]


def test_dashboard_is_private_to_each_user(
    user_client: TestClient, other_client: TestClient
) -> None:
    paper_id = upload(user_client)
    user_client.put(state_url(paper_id), json={"lastPage": 4})
    add_note(user_client, paper_id)

    body = other_client.get("/api/Dashboard").json()

    assert body["totalPapers"] == 1
    assert body["reading"] == 0
    assert body["notes"] == 0
    assert body["continueReading"] == []


def test_dashboard_requires_login(client: TestClient) -> None:
    assert client.get("/api/Dashboard").status_code == 401


def test_invalid_timezone_is_rejected(user_client: TestClient) -> None:
    assert user_client.get("/api/Dashboard", params={"tzOffset": 9999}).status_code == 422


def test_dashboard_counts_due_cards(client: TestClient) -> None:
    user = login_as(client, "alice")
    paper_id = upload(client)
    now = datetime.now(UTC)
    with SessionLocal() as db:
        db.add_all(
            StudyCard(
                user_id=user["id"],
                paper_id=paper_id,
                kind="flashcard",
                question=question,
                answer="a",
                due_at=due_at,
            )
            for question, due_at in [("due", now), ("later", now + timedelta(days=3))]
        )
        db.commit()

    assert client.get("/api/Dashboard").json()["dueCards"] == 1

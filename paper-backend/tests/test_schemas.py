from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.schemas import CamelModel, UtcDatetime


class Sample(CamelModel):
    page_size: int
    has_local_file: bool


def test_response_uses_camel_case() -> None:
    app = FastAPI()

    @app.get("/sample", response_model=Sample)
    def sample() -> Sample:
        return Sample(page_size=24, has_local_file=True)

    assert TestClient(app).get("/sample").json() == {"pageSize": 24, "hasLocalFile": True}


def test_request_accepts_camel_case() -> None:
    assert Sample.model_validate({"pageSize": 8, "hasLocalFile": False}).page_size == 8


def test_model_reads_from_attributes() -> None:
    class Row:
        page_size = 12
        has_local_file = False

    assert Sample.model_validate(Row()).page_size == 12


def test_naive_datetime_is_marked_utc() -> None:
    class Event(CamelModel):
        created_at: UtcDatetime

    event = Event(created_at=datetime(2026, 11, 1, 8, 0))

    assert event.created_at.tzinfo == UTC
    assert event.model_dump_json(by_alias=True) == '{"createdAt":"2026-11-01T08:00:00Z"}'

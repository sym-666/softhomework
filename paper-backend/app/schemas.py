from datetime import UTC, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


def _assume_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


# SQLite 不保存时区，读回的时间没有偏移量，不标记的话浏览器会当成本地时间
UtcDatetime = Annotated[datetime, AfterValidator(_assume_utc)]


class CamelModel(BaseModel):
    """接口模型基类：Python 侧用 snake_case，JSON 侧用前端约定的 camelCase。"""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

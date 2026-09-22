from pydantic import BaseModel, Field


class PageParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class Page[T](BaseModel):
    data: list[T]
    page: int
    limit: int
    total: int

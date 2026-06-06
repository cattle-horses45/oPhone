"""分页工具函数"""
from math import ceil
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def paginate(
    db: AsyncSession,
    query,
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    """
    对查询进行分页。items 始终为 Row 元组列表。
    多列查询: row[0]=Product, row[1]=min_price, ...
    单列查询: row[0]=User/Order/...
    """
    if page < 1: page = 1
    if page_size < 1: page_size = 20
    if page_size > 100: page_size = 100

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    total_pages = max(1, ceil(total / page_size))
    if page > total_pages: page = total_pages

    offset = (page - 1) * page_size
    paginated_query = query.offset(offset).limit(page_size)
    result = await db.execute(paginated_query)
    items = list(result.all())  # List of Row tuples

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }

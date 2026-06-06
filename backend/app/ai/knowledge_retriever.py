"""知识库检索 - 基于关键词匹配的简易RAG"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.models.knowledge import KnowledgeItem


async def retrieve_knowledge(
    db: AsyncSession, query: str, top_k: int = 3
) -> list[dict]:
    """
    从知识库中检索与用户问题最相关的条目

    策略：
    1. 先尝试精确匹配问题
    2. 再通过关键词模糊匹配
    3. 按优先级排序，返回top_k条
    """
    # 提取查询中的关键词（简单分词）
    keywords = extract_keywords(query)

    if not keywords:
        # 如果没有提取到关键词，返回高优先级条目
        result = await db.execute(
            select(KnowledgeItem)
            .where(KnowledgeItem.is_active == True)
            .order_by(KnowledgeItem.priority.desc())
            .limit(top_k)
        )
        items = result.scalars().all()
        return [
            {"question": item.question, "answer": item.answer, "category": item.category}
            for item in items
        ]

    # 构建模糊匹配条件
    conditions = []
    for kw in keywords:
        conditions.append(KnowledgeItem.question.contains(kw))
        conditions.append(KnowledgeItem.keywords.contains(kw))

    result = await db.execute(
        select(KnowledgeItem)
        .where(
            KnowledgeItem.is_active == True,
            or_(*conditions),
        )
        .order_by(KnowledgeItem.priority.desc())
        .limit(top_k)
    )
    items = result.scalars().all()

    # 如果匹配不够，补充高优先级条目
    if len(items) < top_k:
        existing_ids = {item.id for item in items}
        result2 = await db.execute(
            select(KnowledgeItem)
            .where(
                KnowledgeItem.is_active == True,
                ~KnowledgeItem.id.in_(existing_ids) if existing_ids else True,
            )
            .order_by(KnowledgeItem.priority.desc())
            .limit(top_k - len(items))
        )
        items = list(items) + list(result2.scalars().all())

    return [
        {"question": item.question, "answer": item.answer, "category": item.category}
        for item in items
    ]


def extract_keywords(query: str) -> list[str]:
    """从查询中提取关键词"""
    # 去除常见停用词和标点
    stopwords = {
        "请问", "一下", "怎么", "如何", "什么", "为什么", "哪里",
        "可以", "吗", "呢", "吧", "啊", "的", "了", "是", "我",
        "你", "他", "她", "它", "们", "这", "那", "有", "不",
        "在", "和", "与", "对", "就", "都", "也", "还", "要",
        "会", "能", "想", "让", "给", "被", "把", "从", "到",
        "说", "去", "来", "看", "做", "知道", "告诉",
    }

    # 简单分词：按空格、标点分割，去除停用词
    import re
    words = re.split(r'[\s,，。！？、：；""''【】《》（）\(\)\[\]]+', query)
    keywords = [
        w for w in words
        if len(w) >= 2 and w not in stopwords
    ]
    return keywords[:5]  # 最多5个关键词

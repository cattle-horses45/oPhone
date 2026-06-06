"""转人工意图检测器"""

# 触发转人工的关键词
TRANSFER_KEYWORDS = [
    "转人工", "人工客服", "真人", "打电话", "投诉",
    "找客服", "人工", "换人", "找个人", "不是机器人",
]

# AI表示无法回答的短语
UNABLE_PHRASES = [
    "建议您转接人工", "建议转人工", "我无法", "我不确定",
    "转人工客服", "转接人工", "联系人工", "咨询人工",
]

# 敏感操作关键词 - 强制转人工
SENSITIVE_KEYWORDS = [
    "退款", "投诉", "举报", "诈骗", "账号被盗",
    "法律", "律师", "法院", "12315", "消费者协会",
]


def should_transfer_to_human(user_message: str, ai_reply: str = "") -> tuple[bool, str]:
    """
    判断是否需要转人工

    Returns:
        (should_transfer: bool, reason: str)
    """
    message_lower = user_message.lower()

    # 1. 检查转人工关键词
    for kw in TRANSFER_KEYWORDS:
        if kw in message_lower:
            return True, f"用户主动请求转人工（关键词: {kw}）"

    # 2. 检查敏感操作
    for kw in SENSITIVE_KEYWORDS:
        if kw in message_lower:
            return True, f"涉及敏感操作（关键词: {kw}）"

    # 3. 检查AI回复是否表示无法处理
    if ai_reply:
        for phrase in UNABLE_PHRASES:
            if phrase in ai_reply:
                return True, f"AI无法回答，建议转人工"

    return False, ""

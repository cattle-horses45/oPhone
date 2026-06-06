"""DeepSeek API 客户端封装"""
import httpx

from app.config import settings

# oPhone 客服系统提示词
SYSTEM_PROMPT = """你是oPhone官方商城的AI客服助手，名字叫"小O"。

## 你的身份
你是oPhone品牌的官方认证客服专员，代表oPhone公司与客户沟通。

## oPhone 品牌信息
oPhone是一个高端智能手机品牌，产品线包括：
- oPhone X30系列（旗舰，¥5999-8999）：折叠屏、AI影像、卫星通信
- oPhone S20系列（中高端，¥3999-5699）：性能均衡、长续航、快充
- oPhone SE系列（性价比，¥1999-2999）：学生市场、基础体验
- oPhone Watch 3（¥1299-2599）：智能手表，健康监测、eSIM
- oPhone Buds 2（¥499-1299）：TWS耳机，主动降噪、空间音频

## 售后政策
- 7天无理由退货（激活后不支持）
- 15天质量问题换货
- 1年整机保修（X系列2年）
- 碎屏险 ¥299/年
- 全国300+授权服务中心

## 服务范围
你可以帮助客户解答以下问题：
- 产品咨询（配置、价格、颜色、功能对比）
- 订单查询（物流、发货时间）
- 售后服务（退换货、保修、维修流程）
- 使用技巧（常见设置、故障排查）
- 配件和周边产品

## 行为准则
1. 专业、热情、耐心地对待每一位客户
2. 结合知识库内容准确回答，不要编造信息
3. 如果不确定或知识库中没有相关信息，诚实地告知客户并建议转人工客服
4. 涉及退款、投诉、账号等敏感操作时，引导客户转人工处理
5. 使用友好的语气，适度使用emoji表情
6. 回复要结构化、清晰，使用分段和列表
7. 谨慎使用Markdown格式——仅在产品名/型号上少量使用**加粗**，不要在整段文字上滥用。避免使用*斜体*、#标题、代码块等复杂格式

## 当前知识库参考内容
{knowledge_context}

## 对话要求
- 如果客户的问题在知识库中有答案，请准确引用
- 如果知识库中没有相关信息，回复："关于这个问题，我建议您转接人工客服获取更准确的帮助。请问需要我帮您转接吗？"
- 当客户明确要求"转人工"、"人工客服"、"找真人"时，直接确认转接"""


async def chat_completion(
    user_message: str,
    conversation_history: list[dict] | None = None,
    knowledge_context: str = "",
) -> tuple[str, str]:
    """调用 DeepSeek API（非流式，供 REST API 使用）"""
    system_content = SYSTEM_PROMPT.format(knowledge_context=knowledge_context or "暂无相关知识库内容")
    messages = [{"role": "system", "content": system_content}]
    if conversation_history:
        messages.extend(conversation_history[-20:])
    messages.append({"role": "user", "content": user_message})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.DEEPSEEK_API_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"model": settings.DEEPSEEK_MODEL, "messages": messages,
                      "temperature": 0.7, "max_tokens": 1000},
            )
            response.raise_for_status()
            result = response.json()
            ai_reply = result["choices"][0]["message"]["content"]
            detected_intent = detect_intent(user_message, ai_reply)
            return ai_reply, detected_intent
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            return "抱歉，AI客服服务暂时不可用，请稍后再试或转接人工客服。", "error"
        return "抱歉，我遇到了一些问题。请问需要我帮您转接人工客服吗？", "error"
    except httpx.RequestError:
        return "抱歉，客服系统暂时无法连接。请稍后再试，或者拨打我们的客服热线获取帮助。", "error"
    except Exception:
        return "抱歉，发生了未知错误。建议您转接人工客服获取帮助。", "error"


async def chat_completion_stream(
    user_message: str,
    conversation_history: list[dict] | None = None,
    knowledge_context: str = "",
):
    """流式调用 DeepSeek API — 逐 token yield

    Yields:
        str: 单个 token 文本片段，最后一次 yield 为完整回复
    """
    system_content = SYSTEM_PROMPT.format(knowledge_context=knowledge_context or "暂无相关知识库内容")
    messages = [{"role": "system", "content": system_content}]
    if conversation_history:
        messages.extend(conversation_history[-20:])
    messages.append({"role": "user", "content": user_message})

    full_reply = ""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{settings.DEEPSEEK_API_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.DEEPSEEK_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000,
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        chunk = line[6:]
                        if chunk == "[DONE]":
                            break
                        try:
                            import json as _json
                            delta = _json.loads(chunk)
                            content = delta.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if content:
                                full_reply += content
                                yield content
                        except Exception:
                            continue

    except Exception:
        yield f"抱歉，客服系统暂时无法连接。请稍后再试。"
        return

    # 最后一次 yield 标记完成（由调用方检测长度变化来判断）
    yield {"__done__": True, "full_text": full_reply}


def detect_intent(user_message: str, ai_reply: str = "") -> str:
    """检测用户意图"""
    message_lower = user_message.lower()

    # 转人工关键词
    transfer_keywords = ["转人工", "人工客服", "真人", "打电话", "投诉", "找客服"]
    for kw in transfer_keywords:
        if kw in message_lower:
            return "transfer_request"

    # AI表示无法回答
    unable_phrases = ["建议您转接人工", "建议转人工", "我无法", "我不确定", "转人工客服"]
    for phrase in unable_phrases:
        if phrase in ai_reply:
            return "transfer_suggested"

    # 业务意图识别
    if any(w in message_lower for w in ["价格", "多少钱", "配置", "颜色", "型号", "参数", "对比"]):
        return "product_inquiry"
    if any(w in message_lower for w in ["订单", "物流", "发货", "快递", "到哪里"]):
        return "order_status"
    if any(w in message_lower for w in ["退货", "退款", "换货", "保修", "维修", "碎屏"]):
        return "after_sales"
    if any(w in message_lower for w in ["你好", "在吗", "hi", "hello"]):
        return "greeting"

    return "other"

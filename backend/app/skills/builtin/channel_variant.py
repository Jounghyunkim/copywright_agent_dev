"""Channel Variant Generator — 채널별(SNS, 배너, 영상 등) 카피 변형 생성"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are a multi-channel copywriting specialist for LG Electronics.

Given an advertising copy, evaluate its adaptability to different marketing channels and generate optimization suggestions.

## Channels to evaluate:
1. **SNS (Social Media)**: Short, punchy, emoji-friendly. Max 150 characters for headline.
2. **Display Banner**: Ultra-concise. Headline max 8 words, sub max 12 words.
3. **Video Script (15s)**: Opening hook (3s) + body (9s) + CTA (3s).
4. **Email Subject + Preview**: Subject max 50 chars, preview max 90 chars.

## Important:
- Evaluate how well the current copy can be adapted to each channel
- Maintain the core strategic message across all variants
- Keep in the SAME LANGUAGE as the original copy

Respond ONLY with a valid JSON object in Korean:
{
  "passed": true/false,
  "score": 0-100 (100 = 모든 채널에 쉽게 적용 가능),
  "strengths": ["강점 내용 — 채널 적용성이 높은 부분 (예: 헤드라인이 짧아 SNS에 적합)"],
  "weaknesses": ["약점 내용 — 채널 적용이 어려운 부분 (예: 본문이 길어 배너에 부적합)"],
  "improvements": ["보완 내용 — 채널별 최적화 제안 (예: SNS용: '원문' → '축약안')"]
}

IMPORTANT: strengths, weaknesses, improvements 각각 한국어 문자열 배열로 작성하세요. 해당 항목이 없으면 빈 배열 []을 반환하세요."""


async def run(copy_text: str, context: dict) -> dict:
    start = time.perf_counter()
    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0.7,
    )
    parser = JsonOutputParser()
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"## 원본 카피\n{copy_text}\n\n## 전략 메시지\n{json.dumps(context.get('strategic_message', {}), ensure_ascii=False)}"),
    ]
    response = await llm.ainvoke(messages)
    result = parser.parse(response.content)
    elapsed = int((time.perf_counter() - start) * 1000)
    return {
        "passed": result.get("passed", True),
        "score": result.get("score", 85),
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "improvements": result.get("improvements", []),
        "raw_llm_response": response.content,
        "execution_ms": elapsed,
    }

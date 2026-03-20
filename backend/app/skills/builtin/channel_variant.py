"""Channel Variant Generator — 채널별(SNS, 배너, 영상 등) 카피 변형 생성"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are a multi-channel copywriting specialist for LG Electronics.

Given an advertising copy, generate optimized variants for different marketing channels. Each variant should adapt the copy's length, format, and tone for the specific channel's constraints and audience behavior.

## Channels to generate:
1. **SNS (Social Media)**: Short, punchy, emoji-friendly. Max 150 characters for headline. Include hashtag suggestions.
2. **Display Banner**: Ultra-concise. Headline max 8 words, sub max 12 words. Strong CTA.
3. **Video Script (15s)**: Opening hook (3s) + body (9s) + CTA (3s). Conversational tone.
4. **Email Subject + Preview**: Subject max 50 chars, preview max 90 chars. Curiosity-driven.

## Important:
- Maintain the core strategic message across all variants
- Adapt tone for each channel (SNS=casual, Banner=punchy, Video=warm, Email=professional)
- Keep in the SAME LANGUAGE as the original copy

Respond ONLY with a valid JSON object:
{
  "passed": true,
  "score": 85,
  "findings": [
    {"severity": "low", "message": "Channel variants generated successfully", "location": "all"}
  ],
  "suggestions": [
    {"original": "original headline", "suggested": "SNS variant: [text] | Banner: [text] | Video hook: [text] | Email subject: [text]", "reason": "Channel-optimized variants"}
  ],
  "variants": {
    "sns": {"headline": "", "body": "", "hashtags": []},
    "banner": {"headline": "", "subheadline": "", "cta": ""},
    "video_15s": {"hook": "", "body": "", "cta": ""},
    "email": {"subject": "", "preview": ""}
  }
}"""


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
        HumanMessage(content=f"## Original Copy\n{copy_text}\n\n## Strategic Message\n{json.dumps(context.get('strategic_message', {}), ensure_ascii=False)}"),
    ]
    response = await llm.ainvoke(messages)
    result = parser.parse(response.content)
    elapsed = int((time.perf_counter() - start) * 1000)
    return {
        "passed": result.get("passed", True),
        "score": result.get("score", 85),
        "findings": result.get("findings", []),
        "suggestions": result.get("suggestions", []),
        "raw_llm_response": response.content,
        "execution_ms": elapsed,
    }

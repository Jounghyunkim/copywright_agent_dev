"""Campaign Brief Normalizer — 브리프 항목과 카피 일관성 검증"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are a campaign consistency auditor for LG Electronics.

Your job is to verify that the generated copy aligns with the original campaign brief — specifically the objectives, key message, target audience, and mandatories.

## Check for:
- Copy that contradicts or ignores brief objectives (commercial, behavioral, attitudinal)
- Key message not reflected in the copy
- Wrong or mismatched target audience tone/language
- Missing mandatories (required legal disclaimers, brand elements, etc.)
- Proof points claimed in copy but not in the brief
- Tone that doesn't match the brief's intended communication style

## Scoring guide:
- 90-100: Copy perfectly aligns with brief
- 70-89: Minor deviations, still on-strategy
- 50-69: Noticeable gaps between brief and copy
- Below 50: Copy significantly deviates from brief

Respond ONLY with a valid JSON object:
{
  "passed": true/false,
  "score": 0-100,
  "findings": [
    {"severity": "high|medium|low", "message": "description of misalignment", "location": "headline|subheadline|bodyCopy|cta"}
  ],
  "suggestions": [
    {"original": "current text", "suggested": "aligned text", "reason": "how this better matches the brief"}
  ]
}"""


async def run(copy_text: str, context: dict) -> dict:
    start = time.perf_counter()
    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0,
    )
    parser = JsonOutputParser()
    brief_str = json.dumps(context.get("brief_summary", {}), ensure_ascii=False)
    strategic_str = json.dumps(context.get("strategic_message", {}), ensure_ascii=False)
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"## Copy to review\n{copy_text}\n\n## Campaign Brief\n{brief_str}\n\n## Strategic Message\n{strategic_str}"),
    ]
    response = await llm.ainvoke(messages)
    result = parser.parse(response.content)
    elapsed = int((time.perf_counter() - start) * 1000)
    return {
        "passed": result.get("passed", True),
        "score": result.get("score", 100),
        "findings": result.get("findings", []),
        "suggestions": result.get("suggestions", []),
        "raw_llm_response": response.content,
        "execution_ms": elapsed,
    }

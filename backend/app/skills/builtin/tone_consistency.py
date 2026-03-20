"""Tone Consistency Guard — 톤 앤 매너 일관성 유지 검증"""
import os
import json
import time
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

SYSTEM_PROMPT = """You are a tone and voice consistency reviewer for LG Electronics campaigns.

Your job is to verify that the advertising copy maintains a consistent tone across all elements (headline, subheadline, body, CTA) and aligns with the strategic tone direction.

## Check for:
- Tone shifts between headline and body copy (e.g., playful headline → formal body)
- CTA tone mismatch (e.g., warm body → aggressive CTA)
- Deviation from the strategic tone direction (primary tone, avoid list, voice character)
- Inconsistent formality level within the same copy
- Emotional register jumps (e.g., aspirational → fear-based within same copy)
- Brand voice deviation from LG's "confident but not arrogant, warm but not casual" guideline

## Scoring guide:
- 90-100: Perfect tone consistency throughout
- 70-89: Minor tone variations, still cohesive
- 50-69: Noticeable tone shifts that affect readability
- Below 50: Severe tone inconsistency

Respond ONLY with a valid JSON object:
{
  "passed": true/false,
  "score": 0-100,
  "findings": [
    {"severity": "high|medium|low", "message": "description of tone issue", "location": "headline|subheadline|bodyCopy|cta"}
  ],
  "suggestions": [
    {"original": "text with tone issue", "suggested": "tone-corrected text", "reason": "how this improves consistency"}
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
    strategic_str = json.dumps(context.get("strategic_message", {}), ensure_ascii=False)
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"## Copy to review\n{copy_text}\n\n## Strategic Tone Direction\n{strategic_str}"),
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

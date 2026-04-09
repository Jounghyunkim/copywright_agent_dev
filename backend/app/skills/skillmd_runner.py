"""SKILL.md 기반 스킬 실행 엔진 — SKILL.md body를 LLM 프롬프트로 주입하여 평가 실행"""
import json
import os
import time

from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

from .loader import SkillLoader

_loader = SkillLoader()


async def run_skillmd_review(skill_name: str, copy_text: str, context: dict) -> dict:
    """SKILL.md 스킬로 카피 리뷰 실행

    SKILL.md의 body(실행 단계, 입출력 계약 등)를 시스템 프롬프트에 주입하고
    LLM이 해당 스킬의 관점에서 카피를 평가하도록 함.
    """
    start = time.perf_counter()

    skill_body = _loader.get_skill_body(skill_name, max_chars=4000)
    if not skill_body:
        return {
            "passed": True,
            "score": 100,
            "strengths": [],
            "weaknesses": [f"SKILL.md not found: {skill_name}"],
            "improvements": [],
            "raw_llm_response": "",
            "execution_ms": 0,
        }

    # 컨텍스트 정보 구성
    context_info = ""
    if context.get("brief_summary"):
        context_info += f"\n## Campaign Brief\n{json.dumps(context['brief_summary'], ensure_ascii=False, indent=2)}"
    if context.get("analysis_context"):
        context_info += f"\n## Analysis Report\n{json.dumps(context['analysis_context'], ensure_ascii=False, indent=2)}"
    if context.get("strategic_message"):
        context_info += f"\n## Strategic Message\n{json.dumps(context['strategic_message'], ensure_ascii=False, indent=2)}"
    if context.get("country_code"):
        context_info += f"\n## Target Market: {context['country_code']}"
    if context.get("language"):
        context_info += f" ({context['language']})"

    system_prompt = f"""당신은 LG Electronics 광고 카피 품질 검토 전문가입니다.
아래 스킬 지침에 따라 주어진 카피를 평가하세요.

## Skill: {skill_name}
{skill_body}
{context_info}

## 평가 결과 형식
반드시 아래 JSON 형식으로만 응답하세요:
{{
  "passed": true/false,
  "score": 0-100,
  "strengths": ["강점 설명 (한국어)"],
  "weaknesses": ["약점 설명 (한국어)"],
  "improvements": ["구체적 수정 제안 (한국어)"]
}}
strengths, weaknesses, improvements는 한국어 문자열 배열입니다. 해당 항목이 없으면 빈 배열 []."""

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0,
    )
    parser = JsonOutputParser()

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"## 평가 대상 카피\n{copy_text}"),
    ]

    response = await llm.ainvoke(messages)
    result = parser.parse(response.content)
    elapsed = int((time.perf_counter() - start) * 1000)

    return {
        "passed": result.get("passed", True),
        "score": result.get("score", 100),
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "improvements": result.get("improvements", []),
        "raw_llm_response": response.content,
        "execution_ms": elapsed,
    }

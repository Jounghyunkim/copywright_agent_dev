"""SKILL.md 기반 스킬 실행 엔진 — SKILL.md body를 LLM 프롬프트로 주입하여 평가 실행"""
import json
import os
import time

from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

from .loader import SkillLoader
from .rate_limit import invoke_llm

_loader = SkillLoader()


# 로케일 코드 → LLM에 전달할 언어 이름 (자연어). 사용자가 설정한 UI 언어로
# strengths/weaknesses/improvements 를 출력하도록 강제한다.
_LOCALE_LANGUAGE_NAME = {
    "ko": "Korean (한국어)",
    "en": "English",
    "de": "German (Deutsch)",
    "fr": "French (Français)",
    "es": "Spanish (Español)",
    "zh-CN": "Simplified Chinese (简体中文)",
    "zh": "Simplified Chinese (简体中文)",
    "ar": "Arabic (العربية)",
    "th": "Thai (ไทย)",
}


def _language_name(locale: str) -> str:
    if not locale:
        return _LOCALE_LANGUAGE_NAME["ko"]
    if locale in _LOCALE_LANGUAGE_NAME:
        return _LOCALE_LANGUAGE_NAME[locale]
    base = locale.split("-")[0]
    return _LOCALE_LANGUAGE_NAME.get(base, _LOCALE_LANGUAGE_NAME["en"])


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

    output_lang = _language_name(context.get("output_locale") or "ko")

    system_prompt = f"""You are an LG Electronics advertising copy quality reviewer.
Evaluate the provided copy according to the skill instructions below.

## Skill: {skill_name}
{skill_body}
{context_info}

## Output Format (strict)
Respond ONLY with a single JSON object of this shape:
{{
  "passed": true/false,
  "score": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."]
}}

## Output Language (MANDATORY)
- Write every element of `strengths`, `weaknesses`, `improvements`
  in **{output_lang}** only.
- Do NOT mix other languages. If the value would otherwise be in Korean
  or English, translate it to {output_lang}.
- Keep brand names (LG, ThinQ, Life's Good, OLED, gram) and technical
  identifiers untranslated.
- If an array has no content, return []."""

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

    response = await invoke_llm(llm, messages, skill_id=skill_name)
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

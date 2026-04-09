"""DeepAgent 실행기 — SKILL.md 기반 스킬 자동 선택 + 컨텍스트 주입 카피 생성"""
from __future__ import annotations

import json
import logging
import os
import time

from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser

from .loader import SkillLoader
from .routing_policy import select_generation_skills
from .creative_personas import select_personas_for_campaign

logger = logging.getLogger(__name__)


def _get_llm(temperature: float = 0.7) -> AzureChatOpenAI:
    return AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=temperature,
    )


class DeepAgentExecutor:
    """SKILL.md 기반 DeepAgent — 스킬을 자동 선택하고 LLM 컨텍스트에 주입하여 카피 생성"""

    def __init__(self) -> None:
        self.loader = SkillLoader()

    def _plan_skills(
        self,
        objective: str,
        market: str,
        tone: str,
        constraints: list[str],
    ) -> list[str]:
        """LLM이 캠페인 컨텍스트에 맞는 스킬 자동 선택"""
        catalog = [
            {
                "name": s["name"],
                "description": s["description"],
                "skill_type": s.get("frontmatter", {}).get("skill_type", "unknown"),
            }
            for s in self.loader.list_skills()
            if not s["name"].startswith("culture-")
            and not s["name"].startswith("writer-")
            and s["name"] != "workflow-adcopy-production"
        ]

        llm = _get_llm(temperature=0.1)
        messages = [
            SystemMessage(content=(
                "You are a skill planner for ad-copy workflow. "
                "Select ALL skill names from the catalog that are relevant to "
                "ad copy generation, review, compliance, and quality scoring. "
                "Exclude skills for translation, orchestration, or approval packaging. "
                'Return strict json: {"selected_skills":[...]}'
            )),
            HumanMessage(content=json.dumps({
                "objective": objective,
                "market": market,
                "tone": tone,
                "constraints": constraints,
                "catalog": catalog,
            }, ensure_ascii=False)),
        ]

        try:
            response = llm.invoke(messages)
            parsed = json.loads(response.content)
            skills = parsed.get("selected_skills", [])
            if isinstance(skills, list):
                return [str(x) for x in skills]
        except Exception:
            logger.warning("LLM skill planning failed, using defaults", exc_info=True)

        # 폴백: 기본 생성 스킬
        return select_generation_skills(
            objective=objective, market=market, tone=tone, constraints=constraints,
        )

    def _build_skill_context(self, skill_names: list[str], max_chars: int = 3500) -> str:
        """선택된 스킬의 SKILL.md body를 LLM 컨텍스트 블록으로 조합"""
        blocks = []
        for name in skill_names:
            body = self.loader.get_skill_body(name, max_chars=max_chars)
            if body:
                blocks.append(f"## SKILL: {name}\n{body}")
        return "\n\n".join(blocks)

    async def generate_copy_with_personas(
        self,
        *,
        brief: dict,
        analysis_report: dict,
        strategic_message: dict,
        config: dict,
    ) -> dict:
        """페르소나 기반 다중 후보 생성 → 최적 선택

        1) 캠페인에 맞는 2~3명 페르소나 자동 선택
        2) 각 페르소나별로 카피 후보 생성 (병렬)
        3) 결과를 candidates 배열로 반환 (프론트에서 선택 가능)
        """
        import asyncio
        start_time = time.time()

        objective = brief.get("objectiveCommercial", "") or brief.get("objectives", "")
        constraints = config.get("skillsets", [])

        # 페르소나 선택
        personas = select_personas_for_campaign(
            objective=str(objective),
            constraints=constraints,
            count=3,
        )

        if not personas:
            # 페르소나가 없으면 기본 생성
            return await self.generate_copy(
                brief=brief,
                analysis_report=analysis_report,
                strategic_message=strategic_message,
                config=config,
            )

        # 국가별 문화 프로필 매핑
        countries = config.get("countries", [])
        market = countries[0] if countries else "KR"
        culture_skill = self._get_culture_skill(market)

        # 페르소나별 병렬 생성
        tasks = []
        for persona in personas:
            tasks.append(self.generate_copy(
                brief=brief,
                analysis_report=analysis_report,
                strategic_message=strategic_message,
                config=config,
                persona_skill=persona["id"],
                culture_skill=culture_skill,
            ))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 성공한 결과만 수집
        candidates = []
        for persona, result in zip(personas, results):
            if isinstance(result, Exception):
                logger.warning("Persona %s generation failed: %s", persona["id"], result)
                continue
            candidates.append({
                "persona_id": persona["id"],
                "persona_name": persona["name"],
                "persona_avatar": persona.get("avatar", ""),
                "copies": result["copies"],
                "selected_skills": result["selected_skills"],
                "skill_reviews": result.get("skill_reviews", {}),
            })

        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            "candidates": candidates,
            "selected_personas": [
                {"id": p["id"], "name": p["name"], "avatar": p.get("avatar", "")}
                for p in personas
            ],
            "elapsed_ms": elapsed_ms,
        }

    def _get_culture_skill(self, market: str) -> str | None:
        """시장 코드에 해당하는 문화 프로필 스킬명 반환"""
        market_to_culture = {
            "US": "culture-usa", "UK": "culture-uk", "GB": "culture-uk",
            "JP": "culture-japan", "CN": "culture-china", "DE": "culture-germany",
            "FR": "culture-france", "ES": "culture-spain", "IT": "culture-italy",
            "NL": "culture-netherlands", "PL": "culture-poland", "SE": "culture-sweden",
            "IN": "culture-india", "ID": "culture-indonesia", "TH": "culture-thailand",
            "CA": "culture-canada", "BR": "culture-brazil", "MX": "culture-mexico",
            "AR": "culture-argentina", "AE": "culture-uae", "ZA": "culture-south-africa",
        }
        return market_to_culture.get(market)

    async def generate_copy(
        self,
        *,
        brief: dict,
        analysis_report: dict,
        strategic_message: dict,
        config: dict,
        persona_skill: str | None = None,
        culture_skill: str | None = None,
    ) -> dict:
        """DeepAgent 기반 카피 생성

        Args:
            brief: 캠페인 브리프
            analysis_report: 분석 리포트
            strategic_message: 전략 메시지
            config: 생성 설정 (countries, ageGroups, personas, skillsets, copyCount)
            persona_skill: 사용할 AI Writer 페르소나 스킬명 (optional)
            culture_skill: 사용할 문화 프로필 스킬명 (optional)

        Returns:
            dict with keys: copies (list), selected_skills (list), skill_reviews (dict)
        """
        start_time = time.time()

        countries = config.get("countries", [])
        age_groups = config.get("ageGroups", [])
        personas = config.get("personas", [])
        copy_count = min(max(config.get("copyCount", 3), 1), 10)
        objective = brief.get("objectiveCommercial", "") or brief.get("objectives", "")
        market = countries[0] if countries else "KR"
        tone = brief.get("tone", "")

        # 1) 스킬 선택
        selected_skills = self._plan_skills(
            objective=str(objective),
            market=market,
            tone=str(tone),
            constraints=config.get("skillsets", []),
        )

        # 페르소나/문화 프로필 추가
        if persona_skill:
            selected_skills.append(persona_skill)
        if culture_skill and culture_skill not in selected_skills:
            selected_skills.append(culture_skill)

        # 2) 스킬 컨텍스트 빌드
        skill_context = self._build_skill_context(selected_skills)

        # 3) 국가명 매핑
        country_names = {
            "US": "USA (English)", "DE": "Germany (Deutsch)", "GB": "UK (English)",
            "FR": "France (Français)", "IT": "Italy (Italiano)", "ES": "Spain (Español)",
            "IN": "India (English/Hindi)", "BR": "Brazil (Português)", "KR": "Korea (한국어)",
            "AU": "Australia (English)", "ID": "Indonesia (Bahasa Indonesia)", "SA": "Saudi Arabia (العربية)",
            "JP": "Japan (日本語)", "CN": "China (中文)", "NL": "Netherlands (Nederlands)",
            "PL": "Poland (Polski)", "SE": "Sweden (Svenska)", "TH": "Thailand (ไทย)",
            "CA": "Canada (English/Français)", "MX": "Mexico (Español)", "AR": "Argentina (Español)",
            "AE": "UAE (العربية)", "ZA": "South Africa (English)",
        }

        # 4) 페르소나 시스템 프롬프트 부분
        persona_instruction = ""
        if persona_skill:
            persona_body = self.loader.get_skill_body(persona_skill, max_chars=2000)
            if persona_body:
                persona_instruction = f"\n\n## AI Writer Persona\n{persona_body}"

        # 5) 시스템 프롬프트 구성
        system_prompt = f"""You are a DeepAgent for enterprise ad-copy automation at LG Electronics.
You follow skill-based instructions to generate safe, high-quality, culturally adapted copy.

## Generation Config
- Target Countries: {', '.join(country_names.get(c, c) for c in countries)}
- Target Age Groups: {', '.join(age_groups)}
- Personas: {', '.join(personas)}
- Number of Copy Variants per Country: {copy_count}

## Selected Skill Instructions
Follow these skill guidelines when generating copy:

{skill_context}
{persona_instruction}

CRITICAL RULES:
- Never include demographic descriptors (age ranges, income levels, social class) in customer-facing copy
- Use target segment info only to guide tone, appeal points, and creative strategy
- Each country MUST have exactly {copy_count} copy variants
- headline, subheadline, bodyCopy, cta MUST be in the LOCAL LANGUAGE
- methodology, culturalNotes, toneAnalysis are always in Korean

## Output Format
Return a JSON array:
[
  {{
    "countryCode": "XX",
    "copies": [
      {{
        "headline": "LOCAL LANGUAGE headline",
        "subheadline": "LOCAL LANGUAGE subheadline",
        "bodyCopy": "LOCAL LANGUAGE body (2-3 sentences)",
        "cta": "LOCAL LANGUAGE CTA",
        "methodology": "Korean: creative approach explanation",
        "culturalNotes": "Korean: cultural adaptation notes",
        "toneAnalysis": "Korean: tone description"
      }}
    ]
  }}
]"""

        # 6) LLM 호출
        llm = _get_llm(temperature=0.7)
        parser = JsonOutputParser()

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"""## Campaign Brief
```json
{json.dumps(brief, ensure_ascii=False, indent=2)}
```

## Market Analyst Report
```json
{json.dumps(analysis_report, ensure_ascii=False, indent=2)}
```

## Strategic Message
```json
{json.dumps(strategic_message, ensure_ascii=False, indent=2)}
```

Generate culturally adapted copy for each target country, following ALL skill instructions above."""),
        ]

        response = await llm.ainvoke(messages)
        data = parser.parse(response.content)

        # 7) 스킬 리뷰 요약 생성
        elapsed_ms = int((time.time() - start_time) * 1000)
        skill_reviews = await self._generate_skill_reviews(
            selected_skills=selected_skills,
            copy_data=data,
            objective=str(objective),
            market=market,
        )

        return {
            "copies": data,
            "selected_skills": selected_skills,
            "skill_reviews": skill_reviews,
            "elapsed_ms": elapsed_ms,
        }

    async def _generate_skill_reviews(
        self,
        selected_skills: list[str],
        copy_data: list,
        objective: str,
        market: str,
    ) -> dict[str, str]:
        """각 스킬 관점에서 생성된 카피에 대한 한국어 검토 요약"""
        if not selected_skills:
            return {}

        # 페르소나/문화 프로필은 리뷰 대상에서 제외
        review_skills = [
            s for s in selected_skills
            if not s.startswith("writer-") and not s.startswith("culture-")
        ]
        if not review_skills:
            return {}

        llm = _get_llm(temperature=0.2)
        messages = [
            SystemMessage(content=(
                "당신은 광고 카피 품질 검토자입니다. "
                "각 skill에 대해 이번 결과물 관점의 한국어 검토 요약을 작성하세요. "
                "응답은 json 객체 하나만 반환하세요."
            )),
            HumanMessage(content=json.dumps({
                "objective": objective,
                "market": market,
                "selected_skills": review_skills,
                "generated_copies_sample": json.dumps(copy_data[:2], ensure_ascii=False)[:2000],
                "format": {
                    "skill_reviews_ko": {
                        "<skill_name>": "해당 스킬 기준 검토 결과를 한국어 한 문장으로 요약(20~60자)",
                    },
                },
            }, ensure_ascii=False)),
        ]

        try:
            response = await llm.ainvoke(messages)
            parsed = json.loads(response.content)
            raw = parsed.get("skill_reviews_ko", {})
            if not isinstance(raw, dict):
                return {}
            return {
                skill: val.strip()
                for skill, val in raw.items()
                if isinstance(val, str) and val.strip() and skill in review_skills
            }
        except Exception:
            logger.warning("Skill review generation failed", exc_info=True)
            return {}

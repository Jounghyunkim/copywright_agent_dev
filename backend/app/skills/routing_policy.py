"""스킬 라우팅 정책 — 캠페인 컨텍스트 기반 스킬 자동 선택"""
from __future__ import annotations

import json
import logging
import re

from .loader import SkillLoader

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 조건부 트리거: 카피 텍스트 내 키워드 매칭 시 자동 추가
# ---------------------------------------------------------------------------
CONDITIONAL_TRIGGERS: dict[str, list[str]] = {
    "ai-washing-risk-check": [r"\bai\b", r"인공지능", r"자동화", r"모델"],
    "environmental-claim-risk-check": [r"친환경", r"환경", r"esg", r"sustain", r"탄소"],
    "comparative-ad-risk-check": [r"비교", r"경쟁", r"보다", r"vs", r"versus", r"best", r"1위"],
}

# ---------------------------------------------------------------------------
# 필수 평가 스킬 (항상 포함)
# ---------------------------------------------------------------------------
MUST_HAVE_EVAL = [
    "regulatory-copy-validation",
    "brand-lexicon-check",
    "copy-scorecard-generator",
    "compliance-redflag-detector",
    "lg-brand-fit-check",
]

# 평가 라우팅에서 제외할 스킬 (오케스트레이션/현지화 전용)
EXCLUDED_FROM_EVAL = frozenset([
    "language-transcreation",
    "regional-copy-adaptation",
    "local-approval-pack-preparation",
    "final-copy-signoff",
    "workflow-adcopy-production",
    "localization-base",
])

DEFAULT_MAX_EVAL_SKILLS = 10


def check_conditional_triggers(text: str) -> list[str]:
    """텍스트에서 조건부 트리거 키워드를 검사하여 추가할 스킬 목록 반환"""
    triggered = []
    lower_text = text.lower()
    for skill_id, patterns in CONDITIONAL_TRIGGERS.items():
        for pattern in patterns:
            if re.search(pattern, lower_text, re.IGNORECASE):
                triggered.append(skill_id)
                break
    return triggered


def get_eval_candidates() -> list[dict]:
    """평가 대상 스킬 후보 목록 반환 (페르소나/문화 프로필 제외)"""
    loader = SkillLoader()
    candidates = []
    for skill in loader.list_skills():
        name = skill["name"]
        if name in EXCLUDED_FROM_EVAL:
            continue
        if name.startswith("writer-") or name.startswith("culture-"):
            continue
        fm = skill.get("frontmatter", {})
        action_tags = fm.get("action_tags", [])
        # evaluation 태그가 있거나 필수 스킬인 경우만 포함
        if "evaluation" not in action_tags and name not in MUST_HAVE_EVAL:
            continue
        candidates.append({
            "name": name,
            "description": skill.get("description", ""),
            "role_tags": fm.get("role_tags", []),
        })
    return candidates


def select_eval_skills(
    *,
    objective: str = "",
    constraints: list[str] | None = None,
    copy_text: str = "",
    max_skills: int = DEFAULT_MAX_EVAL_SKILLS,
) -> list[str]:
    """캠페인 컨텍스트 기반 평가 스킬 선택

    1) MUST_HAVE_EVAL 스킬은 항상 포함
    2) 조건부 트리거 스킬 추가
    3) 나머지 평가 후보에서 budget 내 선택
    """
    if max_skills <= 0:
        max_skills = DEFAULT_MAX_EVAL_SKILLS

    selected = list(MUST_HAVE_EVAL)

    # 조건부 트리거 추가
    combined_text = f"{objective} {copy_text} {' '.join(constraints or [])}"
    triggered = check_conditional_triggers(combined_text)
    for skill_id in triggered:
        if skill_id not in selected:
            selected.append(skill_id)

    remaining_budget = max_skills - len(selected)
    if remaining_budget <= 0:
        return selected[:max_skills]

    # 나머지 평가 후보 추가
    all_candidates = get_eval_candidates()
    for candidate in all_candidates:
        if candidate["name"] not in selected and remaining_budget > 0:
            selected.append(candidate["name"])
            remaining_budget -= 1

    return selected


def select_generation_skills(
    *,
    objective: str = "",
    market: str = "KR",
    tone: str = "",
    constraints: list[str] | None = None,
) -> list[str]:
    """카피 생성 시 사용할 스킬 목록 반환"""
    base_skills = [
        "global-core-copy-generation",
        "tone-and-voice-enforcer",
        "headline-body-cta-composer",
    ]

    # 시장에 맞는 문화 프로필 추가
    market_to_culture = {
        "KR": None,  # 한국은 기본
        "US": "culture-usa",
        "UK": "culture-uk",
        "JP": "culture-japan",
        "CN": "culture-china",
        "DE": "culture-germany",
        "FR": "culture-france",
        "ES": "culture-spain",
        "IT": "culture-italy",
        "NL": "culture-netherlands",
        "PL": "culture-poland",
        "SE": "culture-sweden",
        "IN": "culture-india",
        "ID": "culture-indonesia",
        "TH": "culture-thailand",
        "CA": "culture-canada",
        "BR": "culture-brazil",
        "MX": "culture-mexico",
        "AR": "culture-argentina",
        "AE": "culture-uae",
        "ZA": "culture-south-africa",
    }

    culture = market_to_culture.get(market)
    if culture:
        base_skills.append(culture)

    # LG 브랜드 보이스 항상 참조
    base_skills.append("lg-brand-voice")

    return base_skills

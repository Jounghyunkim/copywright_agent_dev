"""AI Writer 페르소나 시스템 — SKILL.md 기반 페르소나 로딩 + 캠페인 매칭"""
from __future__ import annotations

import re
from pathlib import Path

from .loader import SkillLoader
from .parser import SkillParser


def _parse_persona_config(body: str) -> dict:
    """SKILL.md body에서 '## Persona Config' 섹션 파싱"""
    config: dict = {}
    in_section = False
    for line in body.split("\n"):
        if line.strip().startswith("## Persona Config"):
            in_section = True
            continue
        if line.strip().startswith("## ") and in_section:
            break
        if in_section and line.strip().startswith("- "):
            parts = line.strip()[2:].split(":", 1)
            if len(parts) == 2:
                config[parts[0].strip()] = parts[1].strip()
    return config


def _parse_system_prompt(body: str) -> str:
    """SKILL.md body에서 '## System Prompt' 섹션 파싱"""
    lines: list[str] = []
    in_section = False
    for line in body.split("\n"):
        if line.strip().startswith("## System Prompt"):
            in_section = True
            continue
        if line.strip().startswith("## ") and in_section:
            break
        if in_section:
            lines.append(line)
    return "\n".join(lines).strip()


def _parse_when_to_use(body: str) -> str:
    """SKILL.md body에서 '## When To Use' 섹션을 AI 어시스트 소개문으로 사용."""
    lines: list[str] = []
    in_section = False
    for line in body.split("\n"):
        stripped = line.strip()
        if stripped.lower().startswith("## when to use"):
            in_section = True
            continue
        if stripped.startswith("## ") and in_section:
            break
        if in_section:
            lines.append(line)
    return "\n".join(lines).strip()


def _parse_style_highlights(body: str) -> list[str]:
    """System Prompt 섹션에서 '### 문체 규칙' 의 각 볼드 헤드라인만 추출.

    예: "**의미 치환 은유**: ..." → "의미 치환 은유"
    없으면 빈 리스트 반환.
    """
    import re as _re

    sys_prompt = _parse_system_prompt(body)
    if not sys_prompt:
        return []

    # '### 문체 규칙' 혹은 이와 유사한 스타일 섹션만 추출
    section_lines: list[str] = []
    in_section = False
    for line in sys_prompt.split("\n"):
        stripped = line.strip()
        if stripped.startswith("### ") and (
            "문체" in stripped or "스타일" in stripped or "style" in stripped.lower()
        ):
            in_section = True
            continue
        if stripped.startswith("### ") and in_section:
            break
        if in_section:
            section_lines.append(line)

    if not section_lines:
        return []

    highlights: list[str] = []
    for line in section_lines:
        m = _re.match(r"^\s*\d+\.\s*\*\*(.+?)\*\*", line)
        if m:
            highlights.append(m.group(1).strip())
    return highlights[:6]


def _load_personas_from_skills() -> list[dict]:
    """writer-* SKILL.md 파일에서 페르소나 정보 로딩"""
    loader = SkillLoader()
    personas = []
    for skill in loader.list_personas():
        try:
            body = SkillParser.parse_body(Path(skill["path"]))
        except Exception:
            continue

        config = _parse_persona_config(body)
        system_prompt = _parse_system_prompt(body)
        if not system_prompt:
            continue

        persona_tags_str = config.get("persona_tags", "")
        persona_tags = [t.strip() for t in persona_tags_str.split(",") if t.strip()]

        try:
            temperature = float(config.get("temperature", "0.9"))
        except ValueError:
            temperature = 0.9

        personas.append({
            "id": skill["name"],
            "name": skill["description"],
            "system_prompt_suffix": system_prompt,
            "temperature": temperature,
            "tags": persona_tags,
            "avatar": config.get("avatar", ""),
            "color": config.get("color", "#9ca3af"),
            "description": _parse_when_to_use(body),
            "style_highlights": _parse_style_highlights(body),
        })
    return personas


# Lazy-initialized cache
_personas_cache: list[dict] | None = None


def get_creative_personas() -> list[dict]:
    global _personas_cache
    if _personas_cache is None:
        _personas_cache = _load_personas_from_skills()
    return _personas_cache


def invalidate_personas_cache() -> None:
    global _personas_cache
    _personas_cache = None


# ---------------------------------------------------------------------------
# 캠페인 목표 → 페르소나 태그 매칭 규칙
# ---------------------------------------------------------------------------
_CAMPAIGN_TAG_RULES: list[tuple[list[str], list[str]]] = [
    ([r"프로모션", r"할인", r"세일", r"이벤트", r"쿠폰"], ["promotion", "ecommerce"]),
    ([r"브랜딩", r"브랜드", r"인지도", r"리브랜딩"], ["branding"]),
    ([r"SNS", r"소셜", r"인스타", r"틱톡", r"릴스"], ["sns", "digital"]),
    ([r"프리미엄", r"럭셔리", r"하이엔드", r"고급"], ["premium", "luxury"]),
    ([r"B2B", r"기업", r"솔루션", r"엔터프라이즈"], ["b2b"]),
    ([r"신제품", r"출시", r"론칭", r"launch"], ["branding", "disruptive"]),
    ([r"전환", r"퍼포먼스", r"CPA", r"ROAS", r"전환율"], ["performance", "ecommerce"]),
    ([r"MZ", r"2030", r"젊은", r"영타겟"], ["young", "sns"]),
    ([r"감성", r"감동", r"공감", r"따뜻"], ["emotion", "lifestyle"]),
    ([r"기술", r"테크", r"AI", r"스마트", r"혁신"], ["tech"]),
]


def select_personas_for_campaign(
    objective: str,
    constraints: list[str] | None = None,
    count: int = 3,
) -> list[dict]:
    """캠페인 목표/제약조건에 맞는 최적 페르소나 선택

    1) 캠페인 키워드 → 태그 매칭으로 점수 부여
    2) 점수 높은 순서로 선택, 부족하면 와일드카드로 채움
    """
    personas = get_creative_personas()
    if not personas:
        return []

    text = f"{objective} {' '.join(constraints or [])}".lower()

    # 캠페인에 매칭되는 태그 수집
    matched_tags: set[str] = set()
    for patterns, tags in _CAMPAIGN_TAG_RULES:
        if any(re.search(p, text, re.I) for p in patterns):
            matched_tags.update(tags)

    # 각 페르소나에 점수 부여
    scores: dict[str, float] = {}
    for p in personas:
        persona_tags = set(p.get("tags", []))
        scores[p["id"]] = len(persona_tags & matched_tags)

    ranked = sorted(personas, key=lambda p: scores[p["id"]], reverse=True)

    # 매칭된 페르소나 우선 선택 + 와일드카드로 채움
    selected: list[dict] = []
    seen_ids: set[str] = set()

    for p in ranked:
        if len(selected) >= count:
            break
        if p["id"] not in seen_ids:
            selected.append(p)
            seen_ids.add(p["id"])

    return selected[:count]

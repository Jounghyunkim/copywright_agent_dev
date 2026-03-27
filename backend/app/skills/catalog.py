"""스킬 카탈로그 — 빌트인 메타데이터 + 파일 기반 커스텀 스킬 병합"""
from .custom import list_custom_skills

BUILTIN_SKILLS = [
    {
        "id": "ai-washing-risk-check",
        "label": "AI Washing Risk Check",
        "description": "AI 관련 과장/오해 소지 표현 감지",
        "category": "validation",
        "type": "builtin",
        "editable": False,
    },
    {
        "id": "brand-lexicon-check",
        "label": "Brand Lexicon Check",
        "description": "LG 브랜드 용어 가이드라인 준수 검증",
        "category": "validation",
        "type": "builtin",
        "editable": False,
    },
    {
        "id": "campaign-brief-normalizer",
        "label": "Campaign Brief Normalizer",
        "description": "브리프 항목 표준화 및 일관성 검증",
        "category": "validation",
        "type": "builtin",
        "editable": False,
    },
    {
        "id": "channel-variant-generator",
        "label": "Channel Variant Generator",
        "description": "채널별(SNS, 배너, 영상 등) 카피 변형 생성",
        "category": "generation",
        "type": "builtin",
        "editable": False,
    },
    {
        "id": "cultural-sensitivity-check",
        "label": "Cultural Sensitivity Check",
        "description": "문화적 민감성 및 현지화 적합성 검증",
        "category": "validation",
        "type": "builtin",
        "editable": False,
    },
    {
        "id": "tone-consistency-guard",
        "label": "Tone Consistency Guard",
        "description": "톤 앤 매너 일관성 유지 검증",
        "category": "validation",
        "type": "builtin",
        "editable": False,
    },
]

BUILTIN_IDS = {s["id"] for s in BUILTIN_SKILLS}


def get_all_skills() -> list[dict]:
    """빌트인 + 커스텀 스킬 통합 목록 반환"""
    custom_rows = list_custom_skills()
    custom_skills = [
        {
            "id": row["id"],
            "label": row["label"],
            "description": row["description"],
            "category": row["category"],
            "type": "custom",
            "editable": True,
        }
        for row in custom_rows
    ]
    return BUILTIN_SKILLS + custom_skills

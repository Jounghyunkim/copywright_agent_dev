"""
Post-generation copy filter — 상투어 검출, 압축도 검증, 의미 보존 검증.

writer-solmi 페르소나 사용 시 자동 적용되며, 결과에 per-copy 진단(diagnostics)을 첨부한다.
다른 페르소나에서도 호출 가능하나 상투어 목록은 한국어/LG 카피 맥락에 최적화되어 있다.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# ── 1. Cliché (상투어) blocklist ──

CLICHE_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"혁신적(인|으로|이다)?"), "혁신적인"),
    (re.compile(r"완벽(한|하게|을)"), "완벽한"),
    (re.compile(r"최고(의|로)?"), "최고의"),
    (re.compile(r"새로운\s*시대"), "새로운 시대"),
    (re.compile(r"꿈을\s*현실(로|로\s*만들)"), "꿈을 현실로"),
    (re.compile(r"미래를\s*열(다|어|겠)"), "미래를 열다"),
    (re.compile(r"한\s*차원\s*높은"), "한 차원 높은"),
    (re.compile(r"당신(만)?을\s*위한"), "당신만을 위한"),
    (re.compile(r"업계\s*최(고|초|대)"), "업계 최고/최초"),
    (re.compile(r"프리미엄\s*(라이프|경험)"), "프리미엄 라이프"),
    (re.compile(r"한\s*단계\s*(더|업)"), "한 단계 더"),
    (re.compile(r"(놀라운|경이로운)\s*(성능|기술)"), "놀라운 성능"),
    (re.compile(r"무한(한|의)\s*가능성"), "무한한 가능성"),
    (re.compile(r"(최첨단|최신)\s*기술(력|을)?"), "최첨단 기술"),
    (re.compile(r"더\s*나은\s*(내일|미래)"), "더 나은 내일"),
    (re.compile(r"innovative|revolutionary|cutting[\s-]*edge|game[\s-]*changer", re.IGNORECASE), "innovative/revolutionary"),
    (re.compile(r"next[\s-]*level|best[\s-]*in[\s-]*class|world[\s-]*class", re.IGNORECASE), "next-level/best-in-class"),
    (re.compile(r"redefin(e|ing|es)\s+(the\s+)?future", re.IGNORECASE), "redefine the future"),
    (re.compile(r"unlock\s+(your|the)\s+(potential|possibilities)", re.IGNORECASE), "unlock your potential"),
]

# ── 2. Korean adverb/filler patterns for density check ──

_FILLER_RE = re.compile(
    r"(정말|매우|아주|너무|굉장히|상당히|대단히|극도로|완전히|절대적으로|궁극적으로|진정으로|"
    r"특별하게|놀랍게|획기적으로|비약적으로|완벽하게|압도적으로|탁월하게)"
)


@dataclass
class CopyDiagnostic:
    """Single copy item의 진단 결과."""
    cliches: list[str] = field(default_factory=list)      # 검출된 상투어 표현
    avg_sentence_len: float = 0.0                         # 평균 문장 길이(자)
    filler_count: int = 0                                 # 불필요 부사/수식어 수
    similarity: float | None = None                       # 의미 보존 코사인 유사도 (0~1)
    warnings: list[str] = field(default_factory=list)     # 사람이 읽을 경고 메시지

    def to_dict(self) -> dict:
        return {
            "cliches": self.cliches,
            "avg_sentence_len": round(self.avg_sentence_len, 1),
            "filler_count": self.filler_count,
            "similarity": round(self.similarity, 3) if self.similarity is not None else None,
            "warnings": self.warnings,
        }


def _detect_cliches(text: str) -> list[str]:
    found = []
    for pat, label in CLICHE_PATTERNS:
        if pat.search(text):
            found.append(label)
    return found


def _measure_compression(text: str) -> tuple[float, int]:
    """Return (avg_sentence_length, filler_count)."""
    sentences = re.split(r"[.!?。\n]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        return 0.0, 0
    avg_len = sum(len(s) for s in sentences) / len(sentences)
    fillers = len(_FILLER_RE.findall(text))
    return avg_len, fillers


def _compute_similarity(copy_text: str, reference_text: str) -> float | None:
    """Cosine similarity between copy embedding and reference embedding.

    Uses the same Azure OpenAI embedding model as the rest of the system.
    Returns None if computation fails (embedding service unavailable, etc.).
    """
    if not reference_text.strip() or not copy_text.strip():
        return None
    try:
        import os
        from langchain_openai import AzureOpenAIEmbeddings
        import numpy as np

        embeddings = AzureOpenAIEmbeddings(
            azure_deployment=os.getenv("EMBEDDING_DEPLOYMENT", "text-embedding-3-large"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_endpoint=os.getenv("EMBEDDING_ENDPOINT", os.getenv("AZURE_OPENAI_ENDPOINT", "")),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
        )
        vecs = embeddings.embed_documents([copy_text, reference_text])
        a, b = np.array(vecs[0]), np.array(vecs[1])
        cos = float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
        return cos
    except Exception:
        logger.debug("similarity computation failed", exc_info=True)
        return None


# ── Thresholds ──

CLICHE_WARN = True          # 상투어가 1개라도 있으면 경고
AVG_SENTENCE_WARN = 40.0    # 평균 문장 길이 40자 초과 시 경고
FILLER_WARN = 3             # 불필요 수식어 3개 이상 경고
SIMILARITY_WARN = 0.3       # 유사도 0.3 미만이면 의미 이탈 경고


def run_copy_filter(
    copies_data: list[dict],
    brief: dict,
    strategic_message: dict,
) -> list[list[dict]]:
    """Run post-generation filter on all copy results.

    Args:
        copies_data: LLM output — list of {countryCode, copies: [{headline, ...}]}
        brief: campaign brief dict
        strategic_message: strategic message dict

    Returns:
        Parallel structure: list of list of CopyDiagnostic dicts.
        diagnostics[i][j] = diagnostic for copies_data[i].copies[j]
    """
    # Build reference text for semantic check
    ref_parts = []
    if brief.get("keyMessage"):
        ref_parts.append(str(brief["keyMessage"]))
    if isinstance(strategic_message, dict):
        cm = strategic_message.get("coreMessage")
        if isinstance(cm, dict):
            ref_parts.append(cm.get("statement", ""))
        elif isinstance(cm, str):
            ref_parts.append(cm)
    reference = " ".join(ref_parts).strip()

    all_diagnostics: list[list[dict]] = []

    for country_block in copies_data:
        country_diags: list[dict] = []
        copies = country_block.get("copies", [])
        for copy_item in copies:
            diag = CopyDiagnostic()

            # Concatenate visible copy fields for analysis
            visible = " ".join(
                str(copy_item.get(f, ""))
                for f in ("headline", "subheadline", "bodyCopy", "cta")
            ).strip()

            # 1) Cliché detection
            diag.cliches = _detect_cliches(visible)
            if diag.cliches:
                diag.warnings.append(f"상투어 검출: {', '.join(diag.cliches)}")

            # 2) Compression check
            diag.avg_sentence_len, diag.filler_count = _measure_compression(visible)
            if diag.avg_sentence_len > AVG_SENTENCE_WARN:
                diag.warnings.append(
                    f"문장 평균 {diag.avg_sentence_len:.0f}자 — 과감한 생략 권장 (기준: {AVG_SENTENCE_WARN:.0f}자)"
                )
            if diag.filler_count >= FILLER_WARN:
                diag.warnings.append(
                    f"불필요 수식어 {diag.filler_count}개 — 절제 권장"
                )

            # 3) Semantic preservation (skip if no reference)
            if reference:
                diag.similarity = _compute_similarity(visible, reference)
                if diag.similarity is not None and diag.similarity < SIMILARITY_WARN:
                    diag.warnings.append(
                        f"핵심 메시지 유사도 {diag.similarity:.2f} — 브리프 의도와 괴리 가능성"
                    )

            country_diags.append(diag.to_dict())
        all_diagnostics.append(country_diags)

    return all_diagnostics

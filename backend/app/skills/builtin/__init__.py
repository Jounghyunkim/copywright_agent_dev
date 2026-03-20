from .ai_washing import run as ai_washing_check
from .brand_lexicon import run as brand_lexicon_check
from .brief_normalizer import run as brief_normalizer_check
from .channel_variant import run as channel_variant_generate
from .cultural_sensitivity import run as cultural_sensitivity_check
from .tone_consistency import run as tone_consistency_check

BUILTIN_REGISTRY: dict[str, callable] = {
    "ai-washing-risk-check": ai_washing_check,
    "brand-lexicon-check": brand_lexicon_check,
    "campaign-brief-normalizer": brief_normalizer_check,
    "channel-variant-generator": channel_variant_generate,
    "cultural-sensitivity-check": cultural_sensitivity_check,
    "tone-consistency-guard": tone_consistency_check,
}

# core/meta_prompts/__init__.py
"""
Meta Prompts 模块
包含 Film IR 各阶段使用的核心 Prompts
"""

from .story_theme_analysis import (
    STORY_THEME_ANALYSIS_PROMPT,
    convert_to_frontend_format as convert_story_theme_to_frontend
)

from .narrative_extraction import (
    NARRATIVE_EXTRACTION_PROMPT,
    convert_to_frontend_format as convert_narrative_to_frontend,
    extract_abstract_layer as extract_narrative_abstract,
    extract_hidden_assets as extract_narrative_hidden_assets
)

__all__ = [
    # Story Theme (Pillar I)
    "STORY_THEME_ANALYSIS_PROMPT",
    "convert_story_theme_to_frontend",
    # Narrative Template (Pillar II)
    "NARRATIVE_EXTRACTION_PROMPT",
    "convert_narrative_to_frontend",
    "extract_narrative_abstract",
    "extract_narrative_hidden_assets"
]

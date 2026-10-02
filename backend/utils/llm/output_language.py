"""The language LLM-generated, user-facing text should be written in.

Users pick one language for their account (``users/{uid}.language``). Features whose output the
user reads directly (goal suggestions, goal advice, subscription notifications) append
``output_language_instruction()`` to their prompt so a Spanish-speaking user does not get English
text. Mirrors the proactive-notification directive (#5214).
"""

import logging
import re
from typing import Optional

import database.users as users_db

logger = logging.getLogger(__name__)

# The language comes from a user-controlled preference and is interpolated into prompts, so accept
# only clean BCP-47-style tokens (e.g. es, pt-BR, zh-TW) to prevent prompt injection.
_BCP47_LANGUAGE_RE = re.compile(r'[A-Za-z]{2,8}(-[A-Za-z0-9]{2,8})*')


def output_language_instruction(language: Optional[str]) -> str:
    """Prompt suffix asking for user-facing text in ``language``.

    Returns "" for English, unset, the ``multi`` transcription sentinel, or any value that is not a
    clean BCP-47 token, so the prompt is unchanged and the model writes English.
    """
    lang = (language or '').strip()
    if not lang or not _BCP47_LANGUAGE_RE.fullmatch(lang):
        return ""
    base = lang.split('-')[0].lower()
    if base in ('en', 'multi'):
        return ""
    return (
        f"\n\nWrite all user-facing text in the user's language (language/locale code: {lang}). "
        "Keep JSON keys, field names, and enum values exactly as specified."
    )


def user_output_language_instruction(uid: str) -> str:
    """``output_language_instruction`` for the user's saved language. Fails open to "" (English)."""
    try:
        return output_language_instruction(users_db.get_user_language_preference(uid))
    except Exception as e:
        logger.warning(f"output_language lookup_failed uid={uid} error={type(e).__name__}")
        return ""

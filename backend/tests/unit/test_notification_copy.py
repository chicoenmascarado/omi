"""Fixed push-notification copy follows the account language (English fallback, unchanged English)."""

import re
from unittest.mock import MagicMock, patch

import pytest

import utils.fair_use as fair_use_mod
from utils import notification_copy as nc
from utils.llm import notifications as llm_notifications


def _placeholders(text: str) -> list:
    return sorted(re.findall(r'\{(\w+)\}', text))


class TestResolveCopyLanguage:
    def test_maps_spanish_and_portuguese_variants(self):
        assert nc.resolve_copy_language('es') == 'es'
        assert nc.resolve_copy_language('es-419') == 'es'
        assert nc.resolve_copy_language('es_MX') == 'es'
        assert nc.resolve_copy_language('pt-BR') == 'pt-BR'
        assert nc.resolve_copy_language('pt') == 'pt-BR'

    def test_everything_else_is_english(self):
        for value in ('en', 'fr', 'multi', '', None, 3, MagicMock()):
            assert nc.resolve_copy_language(value) == 'en'

    def test_user_lookup_fails_open(self):
        def boom(_uid):
            raise RuntimeError('firestore down')

        assert nc.user_copy_language('uid', boom) == 'en'
        assert nc.user_copy_language('uid', lambda _uid: 'es-419') == 'es'


class TestCopyTable:
    def test_every_key_has_every_language_with_matching_placeholders(self):
        for key, variants in nc._COPY.items():
            assert set(variants) == set(nc.SUPPORTED_COPY_LANGUAGES), key
            for language, text in variants.items():
                assert text.strip(), (key, language)
                assert _placeholders(text) == _placeholders(variants['en']), (key, language)

    def test_english_copy_is_unchanged(self):
        assert nc.notification_copy('action_item_created.title', 'en') == 'Task Added'
        assert nc.notification_copy('action_item_completed.title', 'en') == 'Task Complete! 🎉'
        assert nc.notification_copy('fair_use.reference', 'en', case_ref='FU-1') == ' Reference: FU-1'
        assert nc.notification_copy('fair_use.warning.body', 'en', ref_suffix='').startswith(
            'Your speech usage is unusually high.'
        )

    def test_unknown_language_falls_back_to_english(self):
        assert nc.notification_copy('action_item_created.title', 'fr') == 'Task Added'

    def test_silent_user_messages_cover_every_language(self):
        english = nc.silent_user_messages('en')
        for language in nc.SUPPORTED_COPY_LANGUAGES:
            messages = nc.silent_user_messages(language)
            assert len(messages) == len(english)
            assert all('{name}' in m for m in messages)
        assert nc.silent_user_messages('fr') == english


class TestNotificationsUseTheCopy:
    def test_silent_user_notification_in_spanish(self):
        title, body = llm_notifications.generate_silent_user_notification('Ana', 'es')
        assert title == 'omi'
        assert body in [m.format(name='Ana') for m in nc.silent_user_messages('es')]

    def test_silent_user_notification_defaults_to_english(self):
        _, body = llm_notifications.generate_silent_user_notification('Ana')
        assert body in [m.format(name='Ana') for m in nc.silent_user_messages('en')]

    @pytest.mark.asyncio
    async def test_fair_use_notification_in_spanish_with_reference(self):
        send = MagicMock()
        users_db = MagicMock()
        users_db.get_user_language_preference.return_value = 'es'
        with (
            patch.object(fair_use_mod, '_get_send_notification', return_value=send),
            patch.object(fair_use_mod, 'users_db', users_db),
        ):
            await fair_use_mod._send_fair_use_notification('user1', 'restrict', case_ref='FU-9')
        _, title, body = send.call_args[0]
        assert title == 'Límite de transcripción alcanzado'
        assert body.endswith(' Referencia: FU-9')
        assert 'team@basedhardware.com' in body

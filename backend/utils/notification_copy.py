"""Fixed push-notification copy in the user's language.

Most notification text is either LLM-generated (and follows ``users/{uid}.language`` through
``utils.llm.output_language``) or user content. The few fixed strings below were always English;
they now come from this table, keyed by the account language with English as the fallback.
English values are byte-identical to the previous hard-coded copy.
"""

import logging
from typing import Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

SUPPORTED_COPY_LANGUAGES = ('en', 'es', 'pt-BR')

_COPY: Dict[str, Dict[str, str]] = {
    'action_item_created.title': {'en': 'Task Added', 'es': 'Tarea añadida', 'pt-BR': 'Tarefa adicionada'},
    'action_item_completed.title': {
        'en': 'Task Complete! 🎉',
        'es': '¡Tarea completada! 🎉',
        'pt-BR': 'Tarefa concluída! 🎉',
    },
    # Stands in for a missing display name ("Hey there" / "Hola, amigo").
    'fallback_name': {'en': 'there', 'es': 'amigo', 'pt-BR': 'amigo'},
    'fair_use.warning.title': {'en': 'Fair Use Notice', 'es': 'Aviso de uso razonable', 'pt-BR': 'Aviso de uso justo'},
    'fair_use.throttle.title': {
        'en': 'Transcription Quality Reduced',
        'es': 'Calidad de transcripción reducida',
        'pt-BR': 'Qualidade da transcrição reduzida',
    },
    'fair_use.restrict.title': {
        'en': 'Transcription Limit Reached',
        'es': 'Límite de transcripción alcanzado',
        'pt-BR': 'Limite de transcrição atingido',
    },
    'fair_use.warning.body': {
        'en': (
            'Your speech usage is unusually high. Omi is designed for personal conversations. '
            'If this continues, transcription quality may be reduced. '
            'Check Settings > Plan & Usage for details.{ref_suffix}'
        ),
        'es': (
            'Tu uso de voz es inusualmente alto. Omi está pensado para conversaciones personales. '
            'Si continúa, la calidad de la transcripción puede reducirse. '
            'Consulta Ajustes > Plan y uso para ver los detalles.{ref_suffix}'
        ),
        'pt-BR': (
            'Seu uso de voz está incomumente alto. O Omi foi feito para conversas pessoais. '
            'Se continuar, a qualidade da transcrição pode ser reduzida. '
            'Confira Configurações > Plano e uso para ver os detalhes.{ref_suffix}'
        ),
    },
    'fair_use.throttle.body': {
        'en': (
            'Due to high non-conversational usage, your transcription quality has been temporarily reduced. '
            'This will reset automatically. Contact team@basedhardware.com if you believe this is an error. '
            'Quote your case reference when contacting support.{ref_suffix}'
        ),
        'es': (
            'Debido a un uso no conversacional elevado, la calidad de tu transcripción se ha reducido '
            'temporalmente. Se restablecerá automáticamente. Escribe a team@basedhardware.com si crees que es '
            'un error. Indica tu referencia de caso al contactar con soporte.{ref_suffix}'
        ),
        'pt-BR': (
            'Devido ao alto uso não conversacional, a qualidade da sua transcrição foi reduzida temporariamente. '
            'Isso será restabelecido automaticamente. Escreva para team@basedhardware.com se achar que é um '
            'erro. Informe sua referência de caso ao falar com o suporte.{ref_suffix}'
        ),
    },
    'fair_use.restrict.body': {
        'en': (
            'Your cloud transcription has been temporarily limited due to repeated fair-use violations. '
            'On-device transcription continues normally. Contact team@basedhardware.com to resolve. '
            'Quote your case reference when contacting support.{ref_suffix}'
        ),
        'es': (
            'Tu transcripción en la nube se ha limitado temporalmente por infracciones repetidas del uso '
            'razonable. La transcripción en el dispositivo sigue funcionando con normalidad. Escribe a '
            'team@basedhardware.com para resolverlo. Indica tu referencia de caso al contactar con soporte.'
            '{ref_suffix}'
        ),
        'pt-BR': (
            'Sua transcrição na nuvem foi limitada temporariamente por violações repetidas de uso justo. '
            'A transcrição no dispositivo continua normalmente. Escreva para team@basedhardware.com para '
            'resolver. Informe sua referência de caso ao falar com o suporte.{ref_suffix}'
        ),
    },
    'fair_use.reference': {
        'en': ' Reference: {case_ref}',
        'es': ' Referencia: {case_ref}',
        'pt-BR': ' Referência: {case_ref}',
    },
}

_SILENT_USER_MESSAGES: Dict[str, List[str]] = {
    'en': [
        "Hey {name}, just checking in! My ears are open if you've got something to say.",
        "Is this thing on? Tapping my mic here, {name}. Let me know when you're ready to chat!",
        "Quiet on the set! {name}, are we rolling? Just waiting for your cue.",
        "The sound of silence... is nice, but I'm here for the words, {name}! What's on your mind?",
        "{name}, you've gone quiet! Just a heads up, I'm still here listening and using up your free minutes.",
        "Psst, {name}... My virtual ears are getting a little lonely. Anything to share?",
        "Enjoying the quiet time, {name}? Just remember, I'm on the clock, ready to transcribe!",
        "Hello from the other side... of silence! {name}, ready to talk again?",
        "I'm all ears, {name}! Just letting you know the recording is still live.",
        "Silence is golden, but words are what I live for, {name}! Let's chat when you're ready.",
    ],
    'es': [
        "¡Hola, {name}! Solo paso a saludar. Tengo los oídos abiertos si quieres contarme algo.",
        "¿Esto está encendido? Dando golpecitos al micro, {name}. ¡Avísame cuando quieras charlar!",
        "¡Silencio en el set! {name}, ¿grabamos? Solo espero tu señal.",
        "El sonido del silencio... está bien, pero yo vivo de las palabras, {name}. ¿Qué tienes en mente?",
        "{name}, ¡te has quedado callado! Te aviso: sigo escuchando y gastando tus minutos gratis.",
        "Psst, {name}... Mis oídos virtuales se sienten un poco solos. ¿Algo que contar?",
        "¿Disfrutando del silencio, {name}? Recuerda que sigo de guardia, listo para transcribir.",
        "¡Hola desde el otro lado... del silencio! {name}, ¿listo para volver a hablar?",
        "Soy todo oídos, {name}. Te aviso de que la grabación sigue activa.",
        "El silencio es oro, pero yo vivo de las palabras, {name}. Charlamos cuando quieras.",
    ],
    'pt-BR': [
        "Oi, {name}! Só passando para dar um alô. Estou de ouvidos abertos se quiser falar algo.",
        "Isto está ligado? Batendo no microfone aqui, {name}. Me avisa quando quiser conversar!",
        "Silêncio no set! {name}, vamos gravar? Só esperando sua deixa.",
        "O som do silêncio... é bom, mas eu vivo de palavras, {name}! O que está pensando?",
        "{name}, você ficou quieto! Só avisando: continuo ouvindo e gastando seus minutos grátis.",
        "Psiu, {name}... Meus ouvidos virtuais estão se sentindo meio sozinhos. Algo para contar?",
        "Curtindo o silêncio, {name}? Lembre que estou de plantão, pronto para transcrever!",
        "Olá do outro lado... do silêncio! {name}, pronto para falar de novo?",
        "Sou todo ouvidos, {name}! Só avisando que a gravação continua ativa.",
        "O silêncio vale ouro, mas eu vivo de palavras, {name}! Vamos conversar quando quiser.",
    ],
}


def resolve_copy_language(language: Optional[str]) -> str:
    """Map an account language code to a supported copy language; anything else is English."""
    if not isinstance(language, str):
        return 'en'
    base = language.strip().replace('_', '-').split('-')[0].lower()
    if base == 'es':
        return 'es'
    if base == 'pt':
        return 'pt-BR'
    return 'en'


def user_copy_language(uid: str, lookup: Optional[Callable[[str], Optional[str]]] = None) -> str:
    """The copy language for ``uid`` (``lookup`` defaults to the saved account language).

    Fails open to English, including when the database layer cannot be imported, so a language
    lookup can never cost the user a notification.
    """
    try:
        if lookup is None:
            # Imported lazily: notification modules are imported by tests and workers that stub the
            # database layer, and only the send path needs it.
            from database.users import get_user_language_preference as lookup
        return resolve_copy_language(lookup(uid))
    except Exception as e:
        logger.warning(f"notification_copy language_lookup_failed uid={uid} error={type(e).__name__}")
        return 'en'


def notification_copy(key: str, language: str, **values: str) -> str:
    """The copy for ``key`` in ``language`` (English fallback), formatted with ``values``."""
    variants = _COPY[key]
    template = variants.get(language) or variants['en']
    return template.format(**values) if values else template


def silent_user_messages(language: str) -> List[str]:
    """Templates (with a ``{name}`` placeholder) for the silent-user nudge."""
    return _SILENT_USER_MESSAGES.get(language) or _SILENT_USER_MESSAGES['en']

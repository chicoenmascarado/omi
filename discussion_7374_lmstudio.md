Short answer for current `main`: there is still no setting in the released apps that points Omi at LM Studio or any other OpenAI-compatible base URL. @Charlie284's summary still holds; a few details have changed since then.

**What exists today**

- **Bring your own keys (macOS and Windows desktop):** Settings → Advanced. You can use your own OpenAI, Anthropic, Gemini or **OpenRouter** key instead of Omi's (`backend/utils/byok.py`, `backend/utils/llm/clients.py`). OpenRouter is the closest thing to "my choice of model" without self-hosting. It isn't local, though: the keys are sent to the backend, which calls the provider.
- **A local engine in the macOS app, not exposed as a setting.** `desktop/macos/Desktop/Sources/LocalInference/` can call an OpenAI-compatible server on loopback; LM Studio's `http://127.0.0.1:1234/v1` qualifies, and non-loopback URLs are refused. It's only used to summarize conversations for free-plan users when the backend enables `FREE_TIER_LOCAL_PROCESSING` for the account (`backend/utils/free_tier_processing_policy.py`, `LocalProjectionFinalization.swift`). Chat and the other AI features don't use it, so it isn't a way to run Omi on LM Studio today.

**If you self-host the backend**

- Calls routed to the `openai` provider build `ChatOpenAI` without an explicit `base_url` (`_cached_openai_chat` in `backend/utils/llm/clients.py`). The OpenAI SDK then falls back to `OPENAI_BASE_URL`, which `backend/.env.dev.template` already lists. Pointing it at `http://localhost:1234/v1` sends those calls to LM Studio.
- That only covers part of the app. Routes that use Gemini, Anthropic (including the chat agent) or OpenRouter go to those providers. Requests also name hosted models (e.g. `gpt-…`), so LM Studio has to answer to that model name with whatever model you loaded.
- Treat this as an experiment, not a supported setup: structured-output features expect the hosted models' behavior.

If you want this as a real feature, the tracking issues Charlie mentioned (#6878, #8466) are the right place to add your use case.

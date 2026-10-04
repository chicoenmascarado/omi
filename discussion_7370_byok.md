There's no docs page for it yet, so here is how it works on current `main`.

**Where it is.** Bring-your-own-keys is a desktop feature:
- **macOS:** Settings → Advanced → the "Bring your own keys" card (`desktop/macos/Desktop/Sources/MainWindow/Pages/Settings/Sections/SettingsContentView+DeveloperKeys.swift`).
- **Windows:** Settings → Advanced → developer keys (`desktop/windows/src/renderer/src/components/settings/tabs/DeveloperKeysSection.tsx`).

The keys stay on that computer: in the app's settings on macOS, encrypted with the OS keystore on Windows. The app sends them as `X-BYOK-*` headers on each request. The backend only stores a fingerprint of each key and checks the headers against it (`backend/utils/byok.py`).

**Do you need all four?** No. You need at least one LLM key: OpenAI, Anthropic, Gemini or OpenRouter. Deepgram is optional. The backend rejects an enrollment that only has Deepgram (`activate_byok_endpoint` in `backend/routers/users.py`).

What each key unlocks:
- **Any validated LLM key** removes the limits on the AI features that run on your key.
- **Desktop chat** only runs on your own key with **Anthropic** (`DESKTOP_CHAT_BYOK_PROVIDER = 'anthropic'` in `backend/utils/subscription.py`). With OpenAI only, desktop chat still counts against Omi's chat limit. The settings card says this too.
- **Transcription** still uses Omi's Deepgram and stays on the free-tier allowance unless you also add a validated **Deepgram** key (`_user_subscription_response` in `backend/routers/users.py`).

**Does it sync to iOS/iPadOS/watchOS?** No. The mobile app doesn't send BYOK headers, and a request without them takes the normal path (the "fast path" in `_validated_byok_keys`). Requests from your phone use Omi's keys and your regular plan, even while BYOK is active on your Mac.

**Practical setup for "free with my existing subscriptions":**
1. Add your Anthropic key, so desktop chat uses it.
2. Optionally add OpenAI or Gemini.
3. Add a Deepgram key if you want transcription outside the free allowance.

The backend treats your BYOK enrollment as active for 7 days after the desktop app last confirmed it (`BYOK_HEARTBEAT_TTL_SECONDS` in `backend/database/users.py`).

// Starter prompts under the ask bar. The app has no prompt-suggestions source
// (no server feed, no local generator), so these are the fixed three — swap them
// for the feed the day one exists.
import { t } from '../../../lib/i18n'

// A function, not a constant, so the text is translated after the UI catalog loads.
export const hubSuggestions = (): string[] => [
  t('What should I focus on today to achieve my goals?'),
  t('What did I spend my time on this week?'),
  t("What's the highest-leverage thing I can do next?")
]

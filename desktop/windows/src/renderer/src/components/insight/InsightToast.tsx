// src/renderer/src/components/insight/InsightToast.tsx
// Rendered inside the shared acrylic toast window (#/insight-toast). Shows
// whichever payload arrived last: a proactive insight ('insight:payload') or a
// meeting-detection notice ('meeting:toast' — Phase 5). Main owns visibility +
// auto-dismiss; hover pause reuses the same IPC for both kinds.
import { useEffect, useState } from 'react'
import type { InsightPayload, MeetingToastPayload, WhatsNewPayload } from '../../../../shared/types'
import './insight-toast.css'
import { t } from '../../lib/i18n'

type ToastContent =
  | { type: 'insight'; p: InsightPayload }
  | { type: 'meeting'; p: MeetingToastPayload }
  | { type: 'whatsnew'; p: WhatsNewPayload }

// Post-update changelog card (Phase 8). Shares the acrylic card shell; a compact
// list of the version's changes with the full notes one click away.
function WhatsNewCard({ p }: { p: WhatsNewPayload }): React.JSX.Element {
  return (
    <div
      className="insight-card"
      onMouseEnter={() => window.omi.insightHoverStart()}
      onMouseLeave={() => window.omi.insightHoverEnd()}
    >
      <div className="insight-head">
        <span className="insight-cat">{t("What's new")}</span>
        <button
          className="insight-x"
          onClick={() => window.omi.insightDismiss()}
          aria-label={t('Dismiss')}
        >
          ✕
        </button>
      </div>
      <div className="insight-headline">
        {t('New in Omi')} {p.version}
      </div>
      <ul className="whatsnew-list">
        {p.changes.slice(0, 3).map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <div className="whatsnew-actions">
        <button
          className="meeting-btn meeting-btn-primary"
          onClick={() => window.omi.whatsNewOpenNotes()}
        >
          {t('View release notes')}
        </button>
      </div>
    </div>
  )
}

function MeetingCard({ p }: { p: MeetingToastPayload }): React.JSX.Element {
  const capturing = p.kind === 'capturing'
  const starting = p.kind === 'starting'
  const failed = p.kind === 'error'
  const errorKind = p.errorKind ?? 'startup'
  return (
    <div
      className="insight-card"
      onMouseEnter={() => window.omi.insightHoverStart()}
      onMouseLeave={() => window.omi.insightHoverEnd()}
    >
      <div className="insight-head">
        <span className="insight-cat">{t('Meeting detected')}</span>
        <button
          className="insight-x"
          onClick={() => window.omi.meetingAction(p.meetingId, 'dismiss')}
          aria-label={t('Dismiss')}
        >
          ✕
        </button>
      </div>
      <div className="insight-headline">
        {capturing
          ? t('Omi is capturing — {appName}', { appName: p.appName })
          : starting
            ? t('Starting capture — {appName}', { appName: p.appName })
            : failed
              ? errorKind === 'runtime'
                ? t('Capture stopped — {appName}', { appName: p.appName })
                : errorKind === 'save'
                  ? t("Capture couldn't be saved — {appName}", { appName: p.appName })
                  : t("Capture didn't start — {appName}", { appName: p.appName })
              : t('{appName} looks like a meeting', { appName: p.appName })}
      </div>
      <div className="insight-advice">
        {capturing
          ? t('Audio is being transcribed into a conversation.')
          : starting
            ? t('Connecting audio and transcription…')
            : failed
              ? errorKind === 'save'
                ? t('The recording ended, but Omi could not save the local meeting transcript.')
                : t(
                    'Check your sign-in, internet connection, and Windows microphone access, then retry.'
                  )
              : t('Capture and transcribe this meeting?')}
      </div>
      {p.firstRun ? (
        <div className="insight-foot">{t('First run — change this in Settings → General.')}</div>
      ) : null}
      <div className="meeting-actions">
        {capturing || starting ? (
          <button
            className="meeting-btn"
            onClick={() => window.omi.meetingAction(p.meetingId, 'stop')}
          >
            {starting ? t('Cancel') : t('Stop')}
          </button>
        ) : failed && errorKind === 'save' ? (
          <button
            className="meeting-btn"
            onClick={() => window.omi.meetingAction(p.meetingId, 'dismiss')}
          >
            {t('Dismiss')}
          </button>
        ) : (
          <>
            <button
              className="meeting-btn meeting-btn-primary"
              onClick={() => window.omi.meetingAction(p.meetingId, 'start')}
            >
              {failed ? t('Retry') : t('Start capturing')}
            </button>
            <button
              className="meeting-btn"
              onClick={() => window.omi.meetingAction(p.meetingId, 'dismiss')}
            >
              {t('Not now')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function InsightToast(): React.JSX.Element {
  const [content, setContent] = useState<ToastContent | null>(null)
  const [feedbackError, setFeedbackError] = useState(false)

  useEffect(() => {
    document.body.classList.add('insight-toast-body')
    const offInsight = window.omi.onInsightShow((p) => setContent({ type: 'insight', p }))
    const offMeeting = window.omi.onMeetingToast((p) => setContent({ type: 'meeting', p }))
    const offWhatsNew = window.omi.onWhatsNewToast((p) => setContent({ type: 'whatsnew', p }))
    // Pull any pending payload: a push sent while this window was loading (meeting
    // detected — or the what's-new toast firing — right at startup) lands before
    // this effect subscribes and would otherwise be lost.
    void window.omi.meetingGetToast?.().then((p) => {
      if (p) setContent((cur) => cur ?? { type: 'meeting', p })
    })
    void window.omi.whatsNewGetPending?.().then((p) => {
      if (p) setContent((cur) => cur ?? { type: 'whatsnew', p })
    })
    return () => {
      document.body.classList.remove('insight-toast-body')
      offInsight()
      offMeeting()
      offWhatsNew()
    }
  }, [])

  if (!content) return <div className="insight-toast-body" />
  if (content.type === 'meeting') return <MeetingCard p={content.p} />
  if (content.type === 'whatsnew') return <WhatsNewCard p={content.p} />

  const insight = content.p
  const jitFeedback = insight.jit
  const submitJitFeedback = (
    action: 'useful' | 'false_positive' | 'snooze' | 'disable' | 'missed_or_late'
  ): void => {
    if (!jitFeedback) return
    setFeedbackError(false)
    void window.omi
      .jitFeedback({
        eventId: jitFeedback.eventId,
        lane: jitFeedback.lane,
        action,
        subjectId: jitFeedback.subjectId,
        triggerRevision: jitFeedback.triggerRevision,
        accountGeneration: jitFeedback.accountGeneration,
        ...(action === 'snooze'
          ? { snoozedUntil: new Date(Date.now() + 60 * 60_000).toISOString() }
          : {})
      })
      .then(() => window.omi.insightDismiss())
      .catch(() => setFeedbackError(true))
  }
  return (
    <div
      className="insight-card"
      onMouseEnter={() => window.omi.insightHoverStart()}
      onMouseLeave={() => window.omi.insightHoverEnd()}
    >
      <div className="insight-head">
        <span className="insight-cat">{insight.category}</span>
        <button
          className="insight-x"
          onClick={() => window.omi.insightDismiss()}
          aria-label={t('Dismiss')}
        >
          ✕
        </button>
      </div>
      <div className="insight-headline">{insight.headline}</div>
      <div className="insight-advice">{insight.advice}</div>
      {jitFeedback?.rewindFrameId !== undefined ? (
        <button
          className="insight-foot"
          onClick={() => void window.omi.rewindFocusFrame(jitFeedback.rewindFrameId!)}
        >
          {t('Open keyframe in Rewind')}
        </button>
      ) : null}
      <div className="insight-foot">{insight.sourceApp}</div>
      {jitFeedback ? (
        <div className="meeting-actions" aria-label={t('JIT feedback')}>
          <button
            className="meeting-btn meeting-btn-primary"
            onClick={() => submitJitFeedback('useful')}
          >
            {t('Useful')}
          </button>
          <button className="meeting-btn" onClick={() => submitJitFeedback('false_positive')}>
            {t('Not relevant')}
          </button>
          <button className="meeting-btn" onClick={() => submitJitFeedback('snooze')}>
            {t('Snooze')}
          </button>
          <button className="meeting-btn" onClick={() => submitJitFeedback('disable')}>
            {t('Disable trigger')}
          </button>
          <button className="meeting-btn" onClick={() => submitJitFeedback('missed_or_late')}>
            {t('Missed / late')}
          </button>
        </div>
      ) : null}
      {feedbackError ? (
        <div role="alert" className="insight-foot">
          {t("Couldn't save feedback; it will stay available to retry.")}
        </div>
      ) : null}
    </div>
  )
}

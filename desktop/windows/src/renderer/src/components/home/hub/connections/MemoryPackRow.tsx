import { useState } from 'react'
import { toast } from '../../../../lib/toast'
import { useMemories } from '../../../../hooks/useMemories'
import { runMemoryPack } from '../../../../lib/mcpConnect'
import type { ExportMemory } from '../../../../../../shared/types'
import type { ConnectorBrand } from './ConnectorBrandMark'
import { ConnectorRow, PillButton } from './ConnectorRow'
import { ConnectorBrandMark } from './ConnectorBrandMark'
import { t } from '../../../../lib/i18n'

// The memory-PACK variant (Phase 2b): copy a prompt + your Markdown memory export
// to the clipboard and open the provider's chat, so you can paste it into a fresh
// conversation. Reuses the shared memory-export Markdown (main formats the pack +
// writes the clipboard + opens the chat). No hosted key, no OAuth.

// Each provider renders its real brand mark (the same marks the macOS app shows):
// Gemini ships the true four-colour spark, ChatGPT/Claude their logomarks.
const LABEL: Record<'gemini' | 'chatgpt' | 'claude', { title: string; brand: ConnectorBrand }> = {
  gemini: {
    get title() {
      return t('Gemini')
    },
    brand: 'gemini'
  },
  chatgpt: {
    get title() {
      return t('ChatGPT')
    },
    brand: 'chatgpt'
  },
  claude: {
    get title() {
      return t('Claude')
    },
    brand: 'claude'
  }
}

export function MemoryPackRow({
  provider
}: {
  provider: 'gemini' | 'chatgpt' | 'claude'
}): React.JSX.Element {
  const { memories } = useMemories()
  const [busy, setBusy] = useState(false)
  const { title, brand } = LABEL[provider]

  const run = async (): Promise<void> => {
    if (busy) return
    if (memories.length === 0) {
      toast(t('No memories to export yet'), { tone: 'warn' })
      return
    }
    setBusy(true)
    try {
      const toExport: ExportMemory[] = memories.map((m) => ({
        content: m.content,
        category: m.category ?? null,
        createdAt: m.created_at
      }))
      await runMemoryPack(provider, toExport)
      toast(t('Copied — paste into {title}', { title }), { tone: 'success' })
    } catch (e) {
      toast(t('Could not build the pack'), { tone: 'error', body: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ConnectorRow
      iconNode={<ConnectorBrandMark brand={brand} />}
      title={t('Memory pack for {title}', { title })}
      description={t('Copy a prompt + your memories, then paste into a new chat')}
      action={
        <PillButton tone="neutral" onClick={run} disabled={busy}>
          {busy ? t('Copying…') : t('Copy & open')}
        </PillButton>
      }
    />
  )
}

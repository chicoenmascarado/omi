import { useState } from 'react'
import { FileText } from 'lucide-react'
import { toast } from '../../../../lib/toast'
import { useMemories } from '../../../../hooks/useMemories'
import { runMemoryExport } from '../../../../lib/memoryExport'
import type { ExportMemory } from '../../../../../../shared/types'
import { ConnectorRow, PillButton } from './ConnectorRow'
import { ConnectorBrandMark } from './ConnectorBrandMark'
import { MemoryPackRow } from './MemoryPackRow'
import { t } from '../../../../lib/i18n'

// Memory export destinations — Obsidian, a plain Markdown file, or Notion. These
// are Windows' shipped one-shot writers (main/memoryExport/*), reused verbatim via
// window.omi.memoryExport*; the renderer owns the memories (and the API token) and
// hands them to main for the file/network write. (Mac's richer MCP memory-bank
// destinations are a separate, later phase — out of scope here.)

export function ExportsConnector(): React.JSX.Element {
  const { memories } = useMemories()
  const [exporting, setExporting] = useState(false)
  const [notionOpen, setNotionOpen] = useState(false)
  const [notionToken, setNotionToken] = useState('')
  const [notionPage, setNotionPage] = useState('')

  const toExportMemories = (): ExportMemory[] =>
    memories.map((m) => ({
      content: m.content,
      category: m.category ?? null,
      createdAt: m.created_at
    }))

  const runExport = async (target: 'obsidian' | 'file' | 'notion'): Promise<void> => {
    if (exporting) return
    if (memories.length === 0) {
      toast(t('No memories to export yet'), { tone: 'warn' })
      return
    }
    if (target === 'notion' && (!notionToken.trim() || !notionPage.trim())) {
      toast(t('Enter your Notion token and parent page ID'), { tone: 'warn' })
      return
    }
    setExporting(true)
    try {
      const r = await runMemoryExport(
        target,
        toExportMemories(),
        target === 'notion'
          ? { token: notionToken.trim(), parentPageId: notionPage.trim() }
          : undefined
      )
      if (!r.canceled) {
        toast(
          r.count === 1
            ? t('Exported {count} memory', { count: r.count })
            : t('Exported {count} memories', { count: r.count }),
          {
            tone: 'success',
            body: r.location
          }
        )
      }
    } catch (e) {
      toast(t('Export failed'), { tone: 'error', body: (e as Error).message })
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <ConnectorRow
        iconNode={<ConnectorBrandMark brand="notion" />}
        title={t('Notion')}
        description={t('Write your memories into a Notion page.')}
        action={
          <PillButton
            tone={notionOpen ? 'ghost' : 'primary'}
            onClick={() => setNotionOpen((v) => !v)}
          >
            {notionOpen ? t('Close') : t('Export')}
          </PillButton>
        }
      >
        {notionOpen && (
          <div className="space-y-2">
            <p className="text-[12.5px] text-home-muted">
              {t('Paste an internal-integration token and a page ID it can access.')}
            </p>
            <input
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
              placeholder={t('Notion integration token (secret_…)')}
              className="input-field text-[13px]"
            />
            <input
              value={notionPage}
              onChange={(e) => setNotionPage(e.target.value)}
              placeholder={t('Parent page ID')}
              className="input-field text-[13px]"
            />
            <PillButton tone="primary" onClick={() => runExport('notion')} disabled={exporting}>
              {exporting ? t('Exporting…') : t('Export to Notion')}
            </PillButton>
          </div>
        )}
      </ConnectorRow>

      <ConnectorRow
        iconNode={<ConnectorBrandMark brand="obsidian" />}
        title={t('Obsidian')}
        description={t('Write your memories into your Obsidian vault.')}
        action={
          <PillButton tone="primary" onClick={() => runExport('obsidian')} disabled={exporting}>
            {t('Export')}
          </PillButton>
        }
      />

      <ConnectorRow
        icon={FileText}
        title={t('Markdown file')}
        description={t('Save your memories as a single Markdown file.')}
        action={
          <PillButton tone="primary" onClick={() => runExport('file')} disabled={exporting}>
            {t('Export')}
          </PillButton>
        }
      />

      {/* Gemini has no tray tile of its own — its memory-pack lives here in the
          full Exports list (copy a prompt + pack, open Gemini). */}
      <MemoryPackRow provider="gemini" />
    </>
  )
}

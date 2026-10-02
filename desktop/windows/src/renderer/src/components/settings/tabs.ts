import {
  Settings as SettingsIcon,
  History,
  ShieldCheck,
  CircleUserRound,
  SlidersHorizontal,
  Brain,
  Bot,
  AudioLines,
  CreditCard,
  Keyboard,
  Bell,
  Info,
  type LucideIcon
} from 'lucide-react'
import { t } from '../../lib/i18n'

export type SettingsTabId =
  | 'general'
  | 'memories'
  | 'agents'
  | 'transcription'
  | 'rewind'
  | 'notifications'
  | 'privacy'
  | 'account'
  | 'plan-usage'
  | 'shortcuts'
  | 'advanced'
  | 'about'

export const SETTINGS_TABS: { id: SettingsTabId; label: string; Icon: LucideIcon }[] = [
  { id: 'general', label: t('General'), Icon: SettingsIcon },
  { id: 'memories', label: t('Memories'), Icon: Brain },
  { id: 'agents', label: t('Agents'), Icon: Bot },
  { id: 'transcription', label: t('Transcription'), Icon: AudioLines },
  { id: 'rewind', label: t('Rewind'), Icon: History },
  { id: 'notifications', label: t('Notifications'), Icon: Bell },
  { id: 'privacy', label: t('Privacy'), Icon: ShieldCheck },
  { id: 'account', label: t('Account'), Icon: CircleUserRound },
  { id: 'plan-usage', label: t('Plan & Usage'), Icon: CreditCard },
  { id: 'shortcuts', label: t('Shortcuts'), Icon: Keyboard },
  { id: 'advanced', label: t('Advanced'), Icon: SlidersHorizontal },
  { id: 'about', label: t('About'), Icon: Info }
]

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
  {
    id: 'general',
    get label() {
      return t('General')
    },
    Icon: SettingsIcon
  },
  {
    id: 'memories',
    get label() {
      return t('Memories')
    },
    Icon: Brain
  },
  {
    id: 'agents',
    get label() {
      return t('Agents')
    },
    Icon: Bot
  },
  {
    id: 'transcription',
    get label() {
      return t('Transcription')
    },
    Icon: AudioLines
  },
  {
    id: 'rewind',
    get label() {
      return t('Rewind')
    },
    Icon: History
  },
  {
    id: 'notifications',
    get label() {
      return t('Notifications')
    },
    Icon: Bell
  },
  {
    id: 'privacy',
    get label() {
      return t('Privacy')
    },
    Icon: ShieldCheck
  },
  {
    id: 'account',
    get label() {
      return t('Account')
    },
    Icon: CircleUserRound
  },
  {
    id: 'plan-usage',
    get label() {
      return t('Plan & Usage')
    },
    Icon: CreditCard
  },
  {
    id: 'shortcuts',
    get label() {
      return t('Shortcuts')
    },
    Icon: Keyboard
  },
  {
    id: 'advanced',
    get label() {
      return t('Advanced')
    },
    Icon: SlidersHorizontal
  },
  {
    id: 'about',
    get label() {
      return t('About')
    },
    Icon: Info
  }
]

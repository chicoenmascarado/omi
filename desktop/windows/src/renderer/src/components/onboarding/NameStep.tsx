import { useState } from 'react'
import { StepScaffold } from './StepScaffold'
import { t } from '../../lib/i18n'

type NameStepProps = {
  stepIndex: number
  totalSteps: number
  initialValue: string
  onContinue: (name: string) => void
  onBack?: () => void
}

export function NameStep({
  stepIndex,
  totalSteps,
  initialValue,
  onContinue,
  onBack
}: NameStepProps): React.JSX.Element {
  const [name, setName] = useState(initialValue)
  const trimmed = name.trim()

  return (
    <StepScaffold
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      eyebrow={t('NAME')}
      title={t('What should Omi call you?')}
      continueDisabled={trimmed.length === 0}
      onContinue={() => onContinue(trimmed)}
      onBack={onBack}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && trimmed.length > 0) onContinue(trimmed)
        }}
        placeholder={t('Your name')}
        className="glass-subtle w-64 rounded-lg px-4 py-3 text-center text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
      />
    </StepScaffold>
  )
}

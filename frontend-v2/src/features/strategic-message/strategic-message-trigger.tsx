import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

interface Props {
  onExtract: () => void
  isPending: boolean
  isError: boolean
  errorMessage?: string
}

/**
 * AnalysisReport가 승인된 후 Strategic Message 추출을 시작하는 CTA.
 */
export function StrategicMessageTrigger({
  onExtract,
  isPending,
  isError,
  errorMessage,
}: Props) {
  if (isPending) {
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: '3px solid var(--neutral-200)',
              borderTopColor: 'var(--lg-red-600)',
              borderRadius: '50%',
              animation: 'sm-spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: 14, color: 'var(--neutral-700)' }}>
            Copywriting Strategy를 추출 중입니다…
          </p>
        </div>
        <style>{`@keyframes sm-spin { to { transform: rotate(360deg) } }`}</style>
      </Card>
    )
  }

  return (
    <Card className="stack">
      <h3 style={{ fontSize: 14, fontWeight: 700 }}>
        다음 단계: Copywriting Strategy 추출
      </h3>
      <p style={{ fontSize: 13, color: 'var(--neutral-700)', lineHeight: 1.6 }}>
        승인된 Market Analyst Report를 바탕으로 Core Message, Message Pillars,
        Emotional Hook, Tone Direction, Key Phrases 를 도출합니다.
      </p>
      {isError && errorMessage && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--danger)',
          }}
        >
          {errorMessage}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onExtract}>전략 추출 시작 →</Button>
      </div>
    </Card>
  )
}

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { FieldLabel, TextInput } from '@/shared/ui/field'
import { Button } from '@/shared/ui/button'
import { useHealth } from '@/shared/api/hooks'

export function SettingsPage() {
  const health = useHealth()

  return (
    <>
      <div>
        <h2 className="page-title">일반 설정</h2>
        <p className="page-subtitle">플랫폼 구성 및 연동 상태</p>
      </div>

      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>시스템 상태</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone={health.isError ? 'danger' : 'success'}>
            Backend :5000 {health.isError ? 'offline' : 'online'}
          </Badge>
          <Badge tone="neutral">FAISS Index</Badge>
          <Badge tone="neutral">Azure OpenAI</Badge>
          <Badge tone="neutral">Tavily Search</Badge>
        </div>
      </Card>

      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>백엔드 연결</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone="success">FastAPI</Badge>
          <Badge tone="neutral">localhost:5000</Badge>
        </div>
        <div>
          <FieldLabel>API Base URL</FieldLabel>
          <TextInput defaultValue="/api/v1" readOnly />
        </div>
      </Card>

      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>외부 서비스</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone="primary">Azure OpenAI</Badge>
          <Badge tone="primary">Tavily</Badge>
          <Badge tone="neutral">FAISS (local)</Badge>
        </div>
        <p style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
          API 키는 backend/.env 에서 관리합니다.
        </p>
      </Card>

      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>사용자</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost">캐시 초기화</Button>
          <Button variant="danger">로그아웃</Button>
        </div>
      </Card>
    </>
  )
}

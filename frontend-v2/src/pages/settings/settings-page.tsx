import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { FieldLabel, TextInput } from '@/shared/ui/field'
import { Button } from '@/shared/ui/button'
import { useHealth } from '@/shared/api/hooks'

export function SettingsPage() {
  const health = useHealth()
  const { t } = useTranslation()

  return (
    <>
      <div>
        <h2 className="page-title">{t('page:settings.title')}</h2>
        <p className="page-subtitle">{t('page:settings.subtitle')}</p>
      </div>

      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t('settings:systemStatus')}</h3>
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
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t('settings:backendConnection')}</h3>
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
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t('settings:externalServices')}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone="primary">Azure OpenAI</Badge>
          <Badge tone="primary">Tavily</Badge>
          <Badge tone="neutral">FAISS (local)</Badge>
        </div>
        <p style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
          {t('settings:apiKeysManaged')}
        </p>
      </Card>

      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t('settings:userSection')}</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost">{t('common:button.clearCache')}</Button>
          <Button variant="danger">{t('common:button.logout')}</Button>
        </div>
      </Card>
    </>
  )
}

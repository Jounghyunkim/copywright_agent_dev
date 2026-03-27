// Case timeline widget — renders timeline events for a campaign
// This is a placeholder for future expansion when backend provides /cases/{id}/timeline

export function CaseTimeline({ caseId }: { caseId: string }) {
  return (
    <div style={{ padding: 16, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
      Timeline for case {caseId} will appear here.
    </div>
  )
}

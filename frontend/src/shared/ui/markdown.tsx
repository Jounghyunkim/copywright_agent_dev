import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children: string
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <div className="md-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '16px 0 8px', lineHeight: 1.3 }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '14px 0 6px', lineHeight: 1.3 }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '12px 0 4px', lineHeight: 1.3 }}>{children}</h3>,
          p: ({ children }) => <p style={{ margin: '6px 0', lineHeight: 1.7 }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: '3px 0', lineHeight: 1.6 }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--color-text)' }}>{children}</strong>,
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <code style={{
                  display: 'block', background: 'var(--color-bg)', padding: 12,
                  borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)', lineHeight: 1.6,
                  overflowX: 'auto', border: '1px solid var(--color-border)',
                }}>
                  {children}
                </code>
              )
            }
            return (
              <code style={{
                background: 'var(--color-bg)', padding: '1px 6px',
                borderRadius: 4, fontSize: '0.85em',
                fontFamily: 'var(--font-mono)', color: 'var(--color-primary)',
              }}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => <pre style={{ margin: '8px 0', overflow: 'auto' }}>{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote style={{
              margin: '8px 0', paddingLeft: 14,
              borderLeft: '3px solid var(--color-primary-light)',
              color: 'var(--color-text-secondary)', fontStyle: 'italic',
            }}>
              {children}
            </blockquote>
          ),
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '12px 0' }} />,
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '8px 0' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem',
              }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{
              textAlign: 'left', padding: '6px 10px', fontWeight: 700,
              borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg)',
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              padding: '6px 10px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

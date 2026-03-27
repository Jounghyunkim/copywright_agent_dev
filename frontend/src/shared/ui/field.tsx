import type { CSSProperties, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldProps {
  label?: string
  required?: boolean
  error?: string
  style?: CSSProperties
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: 4,
}

const inputBase: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: '0.875rem',
  outline: 'none',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  transition: 'border-color 0.2s',
}

export function InputField({
  label, required, error, style, ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={style}>
      {label && <label style={labelStyle}>{label}{required && <span style={{ color: 'var(--color-error)' }}> *</span>}</label>}
      <input style={inputBase} {...rest} />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginTop: 2 }}>{error}</span>}
    </div>
  )
}

export function TextareaField({
  label, required, error, style, rows = 3, ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div style={style}>
      {label && <label style={labelStyle}>{label}{required && <span style={{ color: 'var(--color-error)' }}> *</span>}</label>}
      <textarea style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }} rows={rows} {...rest} />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginTop: 2 }}>{error}</span>}
    </div>
  )
}

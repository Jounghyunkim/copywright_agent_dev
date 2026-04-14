import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="field-label">{children}</label>
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />
}

// Type declarations for legacy JSX components
declare module '@/components/BriefingForm' {
  const BriefingForm: React.FC<any>
  export const PreviewBody: React.FC<any>
  export const SECTIONS: any[]
  export default BriefingForm
}

declare module '@/components/AnalysisReport' {
  const AnalysisReport: React.FC<any>
  export default AnalysisReport
}

declare module '@/components/StrategicMessage' {
  const StrategicMessage: React.FC<any>
  export default StrategicMessage
}

declare module '@/components/CopyResults' {
  const CopyResults: React.FC<any>
  export default CopyResults
}

declare module '@/components/GenerationConfig' {
  const GenerationConfig: React.FC<any>
  export const SKILLSETS: any[]
  export default GenerationConfig
}

declare module '@/components/EditorViews' {
  export const InitialView: React.FC<any>
  export const ResultView: React.FC<any>
  export const StrategicMessageView: React.FC<any>
  export const GenerationConfigView: React.FC<any>
  export const CopyResultsView: React.FC<any>
  export const ReviewView: React.FC<any>
  export const ReviewResultsView: React.FC<any>
}

declare module '@/styles/theme' {
  export const COLORS: Record<string, string>
}

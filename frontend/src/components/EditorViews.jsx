import React from 'react';
import { Bot, Zap, SmilePlus, BarChart2 } from 'lucide-react';
import { COLORS } from '../styles/theme';
import AnalysisReport from './AnalysisReport';

const InitialView = () => (
    <>
      <div style={{ display: 'flex', gap: '16px', maxWidth: '85%' }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
          boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0
        }}>
          <Bot size={22} />
        </div>
        <div>
          <div style={{ 
            padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
            backgroundColor: COLORS.WHITE, boxShadow: `0 4px 15px ${'rgba(0, 0, 0, 0.08)'}`,
            lineHeight: 1.6, fontSize: '1rem'
          }}>
            <p style={{ margin: 0, fontWeight: 500 }}>안녕하세요, 정현님! 👋</p>
            <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
              좌측 패널에 캠페인 정보를 입력하고 분석을 시작해주세요.
            </p>
          </div>
        </div>
      </div>
       <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.3 }}>
          <div style={{ padding: '30px', borderRadius: '50%', border: `2px dashed ${COLORS.TEXT_SUB}`, marginBottom: '1.5rem' }}>
            <Zap size={64} color={COLORS.TEXT_SUB} />
          </div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Ready to Create</p>
          <p style={{ fontSize: '0.9rem' }}>Fill out the briefing to activate the Multi-Agent engine.</p>
        </div>
    </>
);

const ResultView = ({ onApprove, onModify, isApproved, analysisResult }) => (
    <div style={{ display: 'flex', gap: '16px', maxWidth: '100%' }}>
      <div style={{ 
        width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
        boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0
      }}>
        <Bot size={22} />
      </div>
      <div style={{flex: 1}}>
        <div style={{ 
          padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
          backgroundColor: COLORS.WHITE, boxShadow: `0 4px 15px ${'rgba(0, 0, 0, 0.08)'}`,
          lineHeight: 1.6, fontSize: '1rem'
        }}>
          <p style={{ margin: 0, fontWeight: 500 }}>브리핑을 접수했습니다, 정현님! 🚀</p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            **Market Analyst Agent**가 RAG 기반으로 타겟 시장을 분석하여 핵심 인사이트를 도출했습니다.
            아래 리포트를 검토하시고 다음 단계를 승인해주세요.
          </p>
        </div>
        <AnalysisReport 
          onApprove={onApprove} 
          onModify={onModify} 
          isApproved={isApproved}
          analysisResult={analysisResult}
        />
      </div>
    </div>
);


export { InitialView, ResultView };

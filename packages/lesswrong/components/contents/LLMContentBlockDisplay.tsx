import React from 'react';

export default function LLMContentBlockDisplay({modelName, children}: {
  modelName: string,
  children: React.ReactNode,
}) {
  return <div className="llm-content-block" data-model-name={modelName}>
    <div className="llm-content-block-header">
      {modelName}
    </div>
    {children}
  </div>
}

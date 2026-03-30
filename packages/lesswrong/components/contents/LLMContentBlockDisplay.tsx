import React, { type Ref } from 'react';
import { TooltipRef } from '../common/FMTooltip';

export default function LLMContentBlockDisplay({modelName, children}: {
  modelName?: string,
  children: React.ReactNode,
}) {
  return <div className="llm-content-block" data-model-name={modelName}>
    <TooltipRef
     title={<span>Written or edited by {modelName ?? "Unknown Model"}</span>}
     distance={8} placement="top-start"
    >
      {(ref: Ref<HTMLDivElement>) => <div className="llm-content-block-header" ref={ref}>
        {modelName ?? "Unknown Model"}
      </div>}
    </TooltipRef>
    {children}
  </div>
}

'use client';
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): turns on drag-to-place for iframe widgets (move
// them by a grip on their top edge, resize them by their edges). Only the Experiment 2 demo editor
// provides `true`, so every other editor behaves exactly as before.
import React from 'react';

export const IframeWidgetDragContext = React.createContext(false);

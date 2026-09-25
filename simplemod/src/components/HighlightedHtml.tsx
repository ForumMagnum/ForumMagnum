'use client';

import React, { useMemo } from 'react';
import { highlightHtmlWithPangramWindowScores } from '@/components/sunshineDashboard/helpers';
import type { PangramWindowScore } from '../lib/types';

const HighlightedHtml = ({ html, windowScores, className }: {
  html: string | null;
  windowScores: PangramWindowScore[] | null;
  className?: string;
}) => {
  const rendered = useMemo(() => {
    const safeHtml = html ?? '<p><em>(no content)</em></p>';
    if (typeof window === 'undefined' || !windowScores?.length) {
      return safeHtml;
    }
    return highlightHtmlWithPangramWindowScores(safeHtml, windowScores);
  }, [html, windowScores]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
};

export default HighlightedHtml;

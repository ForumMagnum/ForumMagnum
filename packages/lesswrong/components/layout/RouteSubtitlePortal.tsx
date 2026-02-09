'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/lib/reactRouterWrapper';
import { useStyles } from '@/components/hooks/useStyles';
import { headerSubtitleStyles } from '@/components/common/HeaderSubtitle';
import { useSubtitlePortal } from './SubtitlePortalContext';

export interface RouteSubtitle {
  subtitle?: string | { title: string; link: string } | React.FunctionComponent<{}>;
}

const getSubtitleNode = (
  subtitle: RouteSubtitle['subtitle'],
  className: string
): React.ReactNode => {
  if (!subtitle) {
    return null;
  }
  if (typeof subtitle === 'string') {
    return <span className={className}>{subtitle}</span>;
  }
  if ('link' in subtitle) {
    return (
      <span className={className}>
        <Link to={subtitle.link}>{subtitle.title}</Link>
      </span>
    );
  }

  const SubtitleComponent = subtitle;
  return <SubtitleComponent />;
};

export const RouteSubtitlePortal = ({ subtitle }: RouteSubtitle) => {
  const classes = useStyles(headerSubtitleStyles);
  const { containerRef, setHasSubtitleContent } = useSubtitlePortal();
  const hasSubtitle = !!subtitle;
  const [containerNode, setContainerNode] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!hasSubtitle) {
      return;
    }
    setHasSubtitleContent(true);
    return () => {
      setHasSubtitleContent(false);
    };
  }, [hasSubtitle, setHasSubtitleContent]);

  useEffect(() => {
    setContainerNode(containerRef.current);
  }, [containerRef]);

  const subtitleNode = useMemo(
    () => getSubtitleNode(subtitle, classes.subtitle),
    [subtitle, classes.subtitle]
  );

  if (!hasSubtitle || !subtitleNode || !containerNode) {
    return null;
  }

  return createPortal(subtitleNode, containerNode);
};

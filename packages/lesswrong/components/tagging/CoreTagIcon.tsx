import React, { FC, ReactNode } from 'react';

// Mapping from tag slug to icon. LW and AF currently have no core-tag icons.
export const coreTagIconMap: Record<string, FC<{className?: string}>> = {};

const CoreTagIcon = ({tag, fallbackNode, className}: {
  tag: {slug: string},
  fallbackNode?: ReactNode,
  className?: string,
}) => {
  const Icon = coreTagIconMap[tag.slug];
  if (!Icon) {
    return fallbackNode ? <>{fallbackNode}</> : null;
  }
  return <Icon className={className} />;
}

export default CoreTagIcon;

import SvgIcon from '@/components/icons/SvgIcon';
import React, { CSSProperties } from 'react';

function createSvgIcon(path: React.ReactNode, displayName: string) {
  let Icon = (props: {
    className?: string
    style?: CSSProperties
    onClick?: (ev: React.MouseEvent) => void
    viewBox?: string
  }) => (
    <SvgIcon {...props}>
      {path}
    </SvgIcon>
  );

  return Icon;
};

export default createSvgIcon;

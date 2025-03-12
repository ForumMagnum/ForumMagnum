import React from 'react';
import SvgIcon from '@/lib/vendor/@material-ui/core/src/SvgIcon';

function createSvgIcon(path: React.ReactNode, displayName: string) {
  let Icon = (props: any) => (
    <SvgIcon {...props}>
      {path}
    </SvgIcon>
  );

  (Icon as any).displayName = `${displayName}Icon`;
  (Icon as any).muiName = 'SvgIcon';

  return Icon;
};

export default createSvgIcon;

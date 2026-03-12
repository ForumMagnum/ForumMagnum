import React, { ReactNode } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useHeaderVisible } from '@/components/hooks/useHeaderVisible';
import StickyBox from '@/lib/vendor/react-sticky-box';
import classNames from 'classnames';

const STICKY_SECTION_TOP_MARGIN = 20;

const styles = defineStyles("MaybeStickyWrapper", (theme: ThemeType) => ({
  stickyWrapper: {
    transition: "transform 200ms ease-in-out",
    transform: `translateY(${STICKY_SECTION_TOP_MARGIN}px)`,
    marginBottom: 20,
  },
  stickyWrapperHeaderVisible: {
    transform: `translateY(calc(var(--header-height) + ${STICKY_SECTION_TOP_MARGIN}px))`,
  },
}))

const StickyWrapper = ({children}: {
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  const {headerVisible, headerAtTop} = useHeaderVisible();

  return <StickyBox offsetTop={0} offsetBottom={20}>
    <div className={classNames(classes.stickyWrapper, {
      [classes.stickyWrapperHeaderVisible]: headerVisible && !headerAtTop,
    })}>
      {children}
    </div>
  </StickyBox>
}

export const MaybeStickyWrapper = ({sticky, children}: {
  sticky: boolean,
  children: ReactNode,
}) => {
  return sticky
    ? <StickyWrapper>{children}</StickyWrapper>
    : <>{children}</>;
}



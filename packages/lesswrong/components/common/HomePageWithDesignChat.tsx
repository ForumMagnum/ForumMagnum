'use client';

import React, { useEffect } from 'react';
import classNames from 'classnames';
import SandboxedHomePage from './SandboxedHomePage';
import HomeDesignChatPanel from './HomeDesignChatPanel';
import HomeDesignChatProvider from './HomeDesignChatProvider';
import { setHomeDesignActive, useHomeDesignChat } from './HomeDesignChatContext';
import LWHome from './LWHome';
import { useSubscribedLocation } from '@/lib/routeUtil';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('HomePageWithDesignChat', (theme: ThemeType) => ({
  floatingPanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 'clamp(360px, 30vw, 470px)',
    zIndex: 2147483001,
    [theme.breakpoints.down('md')]: {
      top: 'auto',
      left: 0,
      width: '100%',
      height: 'min(48dvh, 460px)',
    },
  },
  floatingPanelBelowHeader: {
    top: 'var(--header-height)',
    height: 'calc(100dvh - var(--header-height))',
    [theme.breakpoints.down('md')]: {
      top: 'auto',
      height: 'min(48dvh, 460px)',
    },
  },
}));

const HomePageWithDesignChatInner = () => {
  const classes = useStyles(styles);
  const designChat = useHomeDesignChat();
  const { query } = useSubscribedLocation();
  const themePublicId = typeof query.theme === 'string' ? query.theme : undefined;
  const shouldShowSandboxedHome = Boolean(
    themePublicId ||
    designChat.customSrcdoc ||
    designChat.useDefaultDesign
  );

  useEffect(() => {
    setHomeDesignActive(shouldShowSandboxedHome);
    return () => {
      setHomeDesignActive(false);
    };
  }, [shouldShowSandboxedHome]);

  return (
    <>
      {shouldShowSandboxedHome ? <SandboxedHomePage showPanel={false} /> : <LWHome />}
      {designChat.isOpen && (
        <div className={classNames(classes.floatingPanel, {
          [classes.floatingPanelBelowHeader]: !shouldShowSandboxedHome,
        })}>
          <HomeDesignChatPanel />
        </div>
      )}
    </>
  );
};

const HomePageWithDesignChat = ({ initialIsOpen = false }: { initialIsOpen?: boolean }) => {
  return (
    <HomeDesignChatProvider initialIsOpen={initialIsOpen}>
      <HomePageWithDesignChatInner />
    </HomeDesignChatProvider>
  );
};

export default HomePageWithDesignChat;

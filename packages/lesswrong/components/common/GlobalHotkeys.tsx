import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useGlobalKeydown } from './withGlobalKeydown';
import { useSetTheme, useConcreteThemeOptions } from '../themes/useTheme';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCurrentUser } from './withUser';
import { userIsAdminOrMod } from '../../lib/vulcan-users';
import { userHasDarkModeHotkey } from '../../lib/betas';

export const GlobalHotkeys = () => {
  const currentThemeOptions = useConcreteThemeOptions();
  const setTheme = useSetTheme();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  useGlobalKeydown((e) => {
    // Toggle Dark Mode
    // option+shift+d (mac) / alt+shift+d (everyone else)
    if (userHasDarkModeHotkey(currentUser) && e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.keyCode === 68) {
      e.preventDefault();

      const newThemeName = currentThemeOptions.name === 'dark' ? 'default' : 'dark';
      setTheme({ ...currentThemeOptions, name: newThemeName });
    }

    // Toggle Sunshine Sidebar Visibility (admin-only)
    // option+shift+s (mac) / alt+shift+s (everyone else)
    if (userIsAdminOrMod(currentUser) && e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.keyCode === 83) {
      e.preventDefault();

      void updateCurrentUser({
        hideSunshineSidebar: !currentUser?.hideSunshineSidebar
      });
    }
  });

  return <></>;
}

const GlobalHotkeysComponent = registerComponent('GlobalHotkeys', GlobalHotkeys);

declare global {
  interface ComponentTypes {
    GlobalHotkeys: typeof GlobalHotkeysComponent
  }
}

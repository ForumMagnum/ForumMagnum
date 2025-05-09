import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useGlobalKeydown, useOnSearchHotkey } from './withGlobalKeydown';
import { useSetTheme, useConcreteThemeOptions } from '../themes/useTheme';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCurrentUser } from './withUser';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { userHasDarkModeHotkey } from '../../lib/betas';
import { useReplaceTextContent } from '../hooks/useReplaceTextContent';
import { isLW } from '@/lib/instanceSettings';

export const GlobalHotkeysInner = () => {
  const currentThemeOptions = useConcreteThemeOptions();
  const setTheme = useSetTheme();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const replaceText = useReplaceTextContent();

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

    if (isLW && userIsAdminOrMod(currentUser) && e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.keyCode === 85) {
      replaceText();
    }
  });
  
  useOnSearchHotkey(() => {
    // When you press Cmd+F/Ctrl+F/etc, expand all collapsible sections
    const collapsibleSections = document.getElementsByTagName("details");
    for (let i=0; i<collapsibleSections.length; i++) {
      const detailsTag = collapsibleSections.item(i);
      if (detailsTag && !detailsTag.getAttribute("open")) {
        detailsTag.setAttribute("open", "true");
      }
    }
  });

  return <></>;
}

export const GlobalHotkeys = registerComponent('GlobalHotkeys', GlobalHotkeysInner);



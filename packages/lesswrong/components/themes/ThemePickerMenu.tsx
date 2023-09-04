import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { ThemeMetadata, themeMetadata, getForumType, AbstractThemeOptions } from '../../themes/themeNames';
import { ForumTypeString, allForumTypes, forumTypeSetting, isEAForum } from '../../lib/instanceSettings';
import { useThemeOptions, useSetTheme } from './useTheme';
import { useCurrentUser } from '../common/withUser';
import Paper from '@material-ui/core/Paper';
import Info from '@material-ui/icons/Info';
import { isFriendlyUI } from '../../themes/forumTheme';
import { showThemePickerSetting } from '../../lib/publicSettings';

const styles = (_theme: ThemeType): JssStyles => ({
  check: {
    width: 20,
    marginRight: 8,
  },
  notChecked: {
    width: 20,
    marginRight: 8,
  },
  siteThemeOverrideLabel: {
    padding: 8,
  },
  infoIcon: {
    fontSize: 14,
    marginLeft: isFriendlyUI ? 6 : 0,
  },
})

const ThemePickerMenu = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  const currentThemeOptions = useThemeOptions();
  const setTheme = useSetTheme();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const selectedForumTheme = getForumType(currentThemeOptions);

  const persistUserTheme = (newThemeOptions: AbstractThemeOptions) => {
    if (isEAForum && currentUser) {
      void updateCurrentUser({
        theme: newThemeOptions as DbUser['theme'],
      });
    }
  }

  const setThemeName = (name: UserThemeSetting) => {
    const newThemeOptions = {...currentThemeOptions, name};
    setTheme(newThemeOptions);
    persistUserTheme(newThemeOptions);
  }

  const setThemeForum = (forumType: ForumTypeString) => {
    const newThemeOptions = {
      ...currentThemeOptions,
      siteThemeOverride: {
        ...currentThemeOptions.siteThemeOverride,
        [forumTypeSetting.get()]: forumType,
      },
    };
    setTheme(newThemeOptions);
    persistUserTheme(newThemeOptions);
  }

  const {
    LWTooltip, Typography, DropdownMenu, DropdownItem, DropdownDivider, ForumIcon,
  } = Components;
  const submenu = (
    <Paper>
      <DropdownMenu>
        {showThemePickerSetting.get() &&
          <>
            {themeMetadata.map((themeMetadata: ThemeMetadata) =>
              <DropdownItem
                key={themeMetadata.name}
                title={themeMetadata.label}
                onClick={() => setThemeName(themeMetadata.name)}
                icon={() => currentThemeOptions?.name === themeMetadata.name
                  ? <ForumIcon icon="Check" className={classes.check} />
                  : <div className={classes.notChecked} />
                }
              />
            )}
            <DropdownDivider />
          </>
        }

        {currentUser?.isAdmin &&
          <div>
            <div>
              <Typography variant="body2" className={classes.siteThemeOverrideLabel}>
                Site Theme Override
                <LWTooltip title={<p>
                  Admin only. Makes the site look (for you) like another Forum Magnum
                  site. Useful for testing themes and component-style changes. Note that
                  this only overrides the theme; site-specific differences in
                  functionality will not be affected.
                </p>}>
                  <Info className={classes.infoIcon}/>
                </LWTooltip>
              </Typography>
            </div>
            {[...allForumTypes.keys()].map((forumType: ForumTypeString) =>
              <DropdownItem
                key={forumType}
                title={forumType}
                onClick={() => setThemeForum(forumType)}
                icon={() => selectedForumTheme === forumType
                  ? <ForumIcon icon="Check" className={classes.check} />
                  : <div className={classes.notChecked} />
                }
              />
            )}
          </div>
        }
      </DropdownMenu>
    </Paper>
  );

  return <LWTooltip
    title={submenu}
    tooltip={false}
    clickable
    inlineBlock={false}
    placement="left-start"
  >
    {children}
  </LWTooltip>
}


const ThemePickerMenuComponent = registerComponent('ThemePickerMenu', ThemePickerMenu, {styles});

declare global {
  interface ComponentTypes {
    ThemePickerMenu: typeof ThemePickerMenuComponent
  }
}

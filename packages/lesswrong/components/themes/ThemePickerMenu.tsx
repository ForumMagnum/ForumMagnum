import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { ThemeMetadata, themeMetadata, getForumType, AbstractThemeOptions } from '../../themes/themeNames';
import { ForumTypeString, allForumTypes, forumTypeSetting, isEAForum, isLWorAF } from '../../lib/instanceSettings';
import { useThemeOptions, useSetTheme, ThemeContext } from './useTheme';
import { useCurrentUser } from '../common/withUser';
import { isMobile } from '../../lib/utils/isMobile'
import { Paper }from '@/components/widgets/Paper';
import Info from '@/lib/vendor/@material-ui/icons/src/Info';
import LWTooltip from "../common/LWTooltip";
import { Typography } from "../common/Typography";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import DropdownDivider from "../dropdowns/DropdownDivider";
import ForumIcon from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
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
    marginLeft: theme.isFriendlyUI ? 6 : 0,
  },
})

const ThemePickerMenu = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const themeContext = React.useContext(ThemeContext)!;
  const currentThemeOptions = themeContext!.abstractThemeOptions;
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
  
  // When switching theme on desktop, stop event propagation so that the
  // event handler in UsersMenu doesn't close the menu, and you can try
  // multiple themes without having to reopen it.
  const dontCloseMenu = (event: React.MouseEvent) => {
    if (!isMobile()) {
      event.stopPropagation();
    }
  }

  const setThemeName = (event: React.MouseEvent, name: UserThemeSetting) => {
    dontCloseMenu(event);

    const newThemeOptions = {...currentThemeOptions, name};
    themeContext.setThemeOptions(newThemeOptions);
    persistUserTheme(newThemeOptions);
  }

  const setThemeForum = (event: React.MouseEvent, forumType: ForumTypeString) => {
    dontCloseMenu(event);

    const newThemeOptions = {
      ...currentThemeOptions,
      siteThemeOverride: {
        ...currentThemeOptions.siteThemeOverride,
        [forumTypeSetting.get()]: forumType,
      },
    };
    themeContext.setThemeOptions(newThemeOptions);
    persistUserTheme(newThemeOptions);
  }
  const submenu = (
    <Paper>
      <DropdownMenu>
        {isLWorAF &&
          <>
            {themeMetadata.map((themeMetadata: ThemeMetadata) =>
              <DropdownItem
                key={themeMetadata.name}
                title={themeMetadata.label}
                onClick={(event) => setThemeName(event, themeMetadata.name)}
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
                onClick={(event) => setThemeForum(event, forumType)}
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

export default registerComponent('ThemePickerMenu', ThemePickerMenu, {styles});



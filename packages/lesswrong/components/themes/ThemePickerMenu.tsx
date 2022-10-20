import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ThemeMetadata, themeMetadata, getForumType, ThemeOptions, AbstractThemeOptions } from '../../themes/themeNames';
import { ForumTypeString, allForumTypes, forumTypeSetting } from '../../lib/instanceSettings';
import { useSetTheme } from './useTheme';
import { useCurrentUser } from '../common/withUser';
import Divider from '@material-ui/core/Divider';
import Check from '@material-ui/icons/Check';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Info from '@material-ui/icons/Info';
import { useCookies } from 'react-cookie'
import moment from 'moment';

const styles = (theme: ThemeType): JssStyles => ({
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
  },
})

const removeStylesheetsMatching = (substring: string) => {
  const linkTags = document.getElementsByTagName("link");
  for (let i=0; i<linkTags.length; i++) {
    if (linkTags[i].getAttribute("rel") === "stylesheet") {
      const href = linkTags[i].getAttribute("href")
      if (href && href.indexOf(substring) >= 0) {
        linkTags[i].parentElement!.removeChild(linkTags[i]);
        break;
      }
    }
  }
}
const addStylesheet = (href: string, onFinish: (success: boolean)=>void) => {
  const styleNode = document.createElement("link");
  styleNode.setAttribute("rel", "stylesheet");
  styleNode.setAttribute("href", href);
  styleNode.onload = () => {
    onFinish(true);
  }
  styleNode.onerror = () => {
    onFinish(false);
  }
  document.head.appendChild(styleNode);
}

const THEME_COOKIE_NAME = "theme";

const ThemePickerMenu = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  const [cookies, setCookie] = useCookies([THEME_COOKIE_NAME]);
  const { LWTooltip, Typography } = Components;
  const [currentThemeOptions, setCurrentThemeOptions] = useState(window?.themeOptions);
  const setPageTheme = useSetTheme();
  const currentUser = useCurrentUser();
  
  const setTheme = async (themeOptions: ThemeOptions) => {
    setCurrentThemeOptions(themeOptions);
    if (JSON.stringify(window.themeOptions) !== JSON.stringify(themeOptions)) {
      const oldThemeOptions = window.themeOptions;
      const serializedThemeOptions = JSON.stringify(themeOptions);
      window.themeOptions = themeOptions;
      setPageTheme(themeOptions);
      setCookie(THEME_COOKIE_NAME, JSON.stringify(themeOptions), {
        path: "/",
        expires: moment().add(9999, 'days').toDate(),
      });
      addStylesheet(`/allStyles?theme=${encodeURIComponent(serializedThemeOptions)}`, (success: boolean) => {
        if (success) {
          removeStylesheetsMatching(encodeURIComponent(JSON.stringify(oldThemeOptions)));
        }
      });
    }
  }

  const setAbstractTheme = async (themeOptions: AbstractThemeOptions) => {
    if (themeOptions.name === "auto") {
      themeOptions.name = "default"; // TODO: Properly resolve 'auto'
    }
    setTheme(themeOptions as ThemeOptions);
  }
  
  const selectedForumTheme = getForumType(currentThemeOptions);
  
  const submenu = <Paper>
    {themeMetadata.map((themeMetadata: ThemeMetadata) =>
      <MenuItem key={themeMetadata.name} onClick={async (ev) => {
        await setAbstractTheme({
          ...currentThemeOptions,
          name: themeMetadata.name
        })
      }}>
        {currentThemeOptions?.name === themeMetadata.name
          ? <Check className={classes.check}/>
          : <div className={classes.notChecked}/>
        }
        {themeMetadata.label}
      </MenuItem>
    )}
    
    <Divider/>
    
    {currentUser?.isAdmin && <div>
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
      {allForumTypes.map((forumType: ForumTypeString) =>
        <MenuItem key={forumType} onClick={async (ev) => {
          await setAbstractTheme({
            ...currentThemeOptions,
            siteThemeOverride: {
              ...currentThemeOptions.siteThemeOverride,
              [forumTypeSetting.get()]: forumType
            },
          })
        }}>
          {(selectedForumTheme === forumType)
            ? <Check className={classes.check}/>
            : <div className={classes.notChecked}/>
          }
          {forumType}
        </MenuItem>
      )}
    </div>}
  </Paper>
  
  
  return <LWTooltip
    title={submenu}
    tooltip={false} clickable={true}
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

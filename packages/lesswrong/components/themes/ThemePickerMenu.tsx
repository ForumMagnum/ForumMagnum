import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ThemeMetadata, themeMetadata } from '../../themes/themeNames';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';

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

const ThemePickerMenu = ({children}: {
  children: React.ReactNode
}) => {
  const { LWTooltip } = Components;
  
  const pickTheme = async (theme: ThemeMetadata) => {
    if ((window as any).themeName !== theme.name) {
      const oldThemeName = (window as any).themeName;
      (window as any).themeName = theme.name;
      addStylesheet(`/allStyles?theme=${theme.name}`, (success: boolean) => {
        if (success) {
          removeStylesheetsMatching(oldThemeName);
        }
      });
    }
  }
  
  const submenu = <Paper>
    {themeMetadata.map(theme => <MenuItem key={theme.name} onClick={(ev) => pickTheme(theme)}>
      {theme.label}
    </MenuItem>)}
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


const ThemePickerMenuComponent = registerComponent('ThemePickerMenu', ThemePickerMenu);

declare global {
  interface ComponentTypes {
    ThemePickerMenu: typeof ThemePickerMenuComponent
  }
}

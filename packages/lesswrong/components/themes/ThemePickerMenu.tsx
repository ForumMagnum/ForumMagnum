import React from 'react';
import { ThemeMetadata, getThemeMetadata, AbstractThemeOptions } from '../../themes/themeNames';
import { ThemeContext } from './useTheme';
import { isMobile } from '../../lib/utils/isMobile'
import { Paper }from '@/components/widgets/Paper';
import LWTooltip from "../common/LWTooltip";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import ForumIcon from "../common/ForumIcon";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ThemePickerMenu', (theme: ThemeType) => ({
  check: {
    width: 20,
    marginRight: 8,
  },
  notChecked: {
    width: 20,
    marginRight: 8,
  },
}))

const ThemePickerMenu = ({children}: {
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const themeContext = React.useContext(ThemeContext)!;
  const currentThemeOptions = themeContext!.abstractThemeOptions;

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
  }

  const submenu = (
    <Paper>
      <DropdownMenu>
        {getThemeMetadata().map((themeMetadata: ThemeMetadata) =>
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

export default ThemePickerMenu



import React, { useEffect, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getEnvKeystrokeText } from '@/lib/vendor/ckeditor5-util/keyboard';
import classNames from 'classnames';
import { KEYSTROKE_GUTTER } from './constants';

const styles = defineStyles('KeystrokeDisplay', (theme: ThemeType) => ({
  // minWidth (not width): labels after chips line up at KEYSTROKE_GUTTER, longer keystrokes grow
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: KEYSTROKE_GUTTER,
    height: 18,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    fontSize: 10,
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 3,
    border: `1px solid ${theme.palette.grey[300]}`,
    padding: '0 4px',
  },
  withMargin: {
    marginLeft: 8,
  },
  activeContext: {
    backgroundColor: theme.palette.error.dark,
    borderColor: theme.palette.error.dark,
    color: theme.palette.error.contrastText,
  },
}));

const KeystrokeDisplay = ({
  keystroke,
  withMargin = false,
  activeContext = false,
}: {
  keystroke: string;
  withMargin?: boolean;
  activeContext?: boolean;
}) => {
  const classes = useStyles(styles);

  // Mac glyphs come from navigator.userAgent; show raw text until mounted to avoid a hydration mismatch
  const [envReady, setEnvReady] = useState(false);
  useEffect(() => setEnvReady(true), []);

  return (
    <span
      className={classNames(
        classes.root,
        withMargin && classes.withMargin,
        activeContext && classes.activeContext,
      )}
    >
      {envReady ? getEnvKeystrokeText(keystroke) : keystroke}
    </span>
  );
};

export default KeystrokeDisplay;

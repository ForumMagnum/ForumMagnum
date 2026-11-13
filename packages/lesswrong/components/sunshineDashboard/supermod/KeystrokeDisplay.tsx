import React, { useEffect, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getEnvKeystrokeText } from '@/lib/vendor/ckeditor5-util/keyboard';
import classNames from 'classnames';
import { KEYSTROKE_GUTTER } from './constants';

const styles = defineStyles('KeystrokeDisplay', (theme: ThemeType) => ({
  // The whole keystroke (modifiers included, e.g. ⇧M) renders in one box.
  // Every chip is at least a full gutter wide so that the labels following it —
  // across command rows, submit buttons and template checkboxes alike — all start
  // at the same x. minWidth rather than width so a keystroke too long for the
  // gutter grows instead of being clipped.
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

  // getEnvKeystrokeText (via parseKeystroke) picks Mac glyphs (⌘, ⇧) from
  // navigator.userAgent, which the server doesn't have, so until the client has
  // mounted the raw keystroke text is shown — identical on server and client —
  // to keep hydration stable.
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

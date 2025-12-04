import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getEnvKeystrokeText } from '@/lib/vendor/ckeditor5-util/keyboard';
import classNames from 'classnames';

const styles = defineStyles('KeystrokeDisplay', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  keystrokeChar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
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
  splitBeforeTranslation = false,
}: {
  keystroke: string;
  withMargin?: boolean;
  activeContext?: boolean;
  splitBeforeTranslation?: boolean;
}) => {
  const classes = useStyles(styles);

  const displayedKeystrokes = splitBeforeTranslation ? keystroke.split('+').map(key => getEnvKeystrokeText(key)) : getEnvKeystrokeText(keystroke).split('');

  return (
    <span className={classNames(classes.root, withMargin && classes.withMargin)}>
      {displayedKeystrokes.map((char) => (
        <span
          key={char}
          className={classNames(
            classes.keystrokeChar,
            activeContext && classes.activeContext,
          )}
        >
          <span>{char}</span>
        </span>
      ))}
    </span>
  );
};

export default KeystrokeDisplay;

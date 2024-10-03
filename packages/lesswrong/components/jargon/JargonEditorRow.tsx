// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...commentBodyStyles(theme),
  },
  isActive: {
    marginBottom: 12,
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    padding: 8,
  },
  input: {
    flexGrow: 1,
    marginRight: 8,
  },
  toggleSwitch: {
    marginRight: 8,
  }
});

export const JargonEditorRow = ({classes, jargonTerm}: {
  classes: ClassesType<typeof styles>,
  jargonTerm: DbJargonTerm,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { ToggleSwitch } = Components;

  const [isActive, setIsActive] = React.useState(false);

  return <div className={classNames(classes.root, isActive && classes.isActive)}>
    <ToggleSwitch value={isActive} className={classes.toggleSwitch} setValue={setIsActive}/>
    {!isActive && <div contentEditable={true} dangerouslySetInnerHTML={{__html: jargonTerm.term}} />}
    {isActive && <div contentEditable={true} dangerouslySetInnerHTML={{__html: jargonTerm?.contents?.originalContents?.data ?? ''}} />}
  </div>;
}

const JargonEditorRowComponent = registerComponent('JargonEditorRow', JargonEditorRow, {styles});

declare global {
  interface ComponentTypes {
    JargonEditorRow: typeof JargonEditorRowComponent
  }
}

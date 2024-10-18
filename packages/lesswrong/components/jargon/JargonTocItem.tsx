// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    width: 150,
    marginBottom: 10,
    opacity: .5
  },
  approved: {
    opacity: .9,
  }
});

export const JargonTocItem = ({classes, jargonTerm}: {
  classes: ClassesType<typeof styles>,
  jargonTerm: JargonTermsFragment,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classNames(classes.root, jargonTerm.approved && classes.approved)}>
    {jargonTerm.term}
  </div>;
}

const JargonTocItemComponent = registerComponent('JargonTocItem', JargonTocItem, {styles});

declare global {
  interface ComponentTypes {
    JargonTocItem: typeof JargonTocItemComponent
  }
}

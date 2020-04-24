import React, { useCallback, useState } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-core';
import { Link } from '../../lib/reactRouterWrapper';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import classNames from 'classnames';

const styles = theme => ({
  revisionRow: {
  },
  radio: {
    padding: 4,
  },
  radioDisabled: {
    color: "rgba(0,0,0,0) !important",
  },
});

const RevisionSelect = ({ revisions, describeRevision, onPairSelected, classes }: {
  revisions: Array<RevisionMetadata>,
  describeRevision: (rev: RevisionMetadata) => React.ReactNode,
  onPairSelected: ({before, after}: {before: RevisionMetadata, after: RevisionMetadata}) => void,
  classes: ClassesType,
}) => {
  const { FormatDate } = Components;
  
  const [beforeRevisionIndex, setBeforeRevisionIndex] = useState(1);
  const [afterRevisionIndex, setAfterRevisionIndex] = useState(0);
  
  const compareRevs = useCallback(() => {
    if (!revisions) return;
    const beforeVersion = revisions[beforeRevisionIndex].version;
    const afterVersion = revisions[afterRevisionIndex].version;
    onPairSelected({
      before: revisions[beforeRevisionIndex],
      after: revisions[afterRevisionIndex]
    });
  }, [beforeRevisionIndex, afterRevisionIndex, onPairSelected, revisions]);
  
  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Cast to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  
  return <React.Fragment>
    {revisions.map((rev,i) => {
      const beforeDisabled = i<=afterRevisionIndex;
      const afterDisabled = i>=beforeRevisionIndex;
      return (
        <div key={rev.version} className={classes.revisionRow}>
          <Radio
            className={classNames(classes.radio, {[classes.radioDisabled]: beforeDisabled})}
            disabled={beforeDisabled}
            checked={i===beforeRevisionIndex}
            onChange={(ev, checked) => {
              if (checked) {
                setBeforeRevisionIndex(i);
              }
            }}
          />
          <Radio
            className={classNames(classes.radio, {[classes.radioDisabled]: afterDisabled})}
            disabled={afterDisabled}
            checked={i===afterRevisionIndex}
            onChange={(ev, checked) => {
              if (checked) {
                setAfterRevisionIndex(i);
              }
            }}
          />
          {describeRevision(rev)}
        </div>
      )
    })}
    
    <Button onClick={compareRevs}>Compare selected revisions</Button>
  </React.Fragment>
}

const RevisionSelectComponent = registerComponent(
  'RevisionSelect', RevisionSelect, {styles}
);

declare global {
  interface ComponentTypes {
   RevisionSelect: typeof RevisionSelectComponent
  }
}

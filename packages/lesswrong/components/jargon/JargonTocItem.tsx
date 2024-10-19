// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    width: 150,
    cursor: 'pointer',
    opacity: .5,
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      opacity: .8
    },
    '&:hover $delete': {
      opacity: 1
    }
  },
  term: {
    paddingTop: 6,
    paddingBottom: 6,
    textTransform: 'capitalize',
  },
  approved: {
    opacity: .9,
  },
  delete: {
    opacity: 0,
    color: theme.palette.grey[500],
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    }
  }
});

export const JargonTocItem = ({classes, jargonTerm}: {
  classes: ClassesType<typeof styles>,
  jargonTerm: JargonTermsFragment,
}) => {
  
  const {mutate: updateJargonTerm} = useUpdate({
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
  });

  const handleActiveChange = () => {
    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        approved: !jargonTerm.approved,
        deleted: false,
      },
      optimisticResponse: {
        ...jargonTerm,
        approved: !jargonTerm.approved,
        deleted: false,
      }
    })
  }

  const handleDelete = () => {
    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        deleted: true
      },
      optimisticResponse: {
        ...jargonTerm,
        deleted: true,
      }
    })
  }

  const { LWTooltip } = Components;

  return <div className={classNames(classes.root, jargonTerm.approved && classes.approved)}>
    <div className={classes.term} onClick={handleActiveChange}>{jargonTerm.term}</div>
    <LWTooltip title="Delete" placement="right">
      <div className={classes.delete} onClick={handleDelete}>x</div>
    </LWTooltip> 
  </div>;
}

const JargonTocItemComponent = registerComponent('JargonTocItem', JargonTocItem, {styles});

declare global {
  interface ComponentTypes {
    JargonTocItem: typeof JargonTocItemComponent
  }
}

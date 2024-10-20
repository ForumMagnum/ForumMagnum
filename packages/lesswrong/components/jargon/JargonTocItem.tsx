// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';
import Checkbox from '@material-ui/core/Checkbox';
import { JargonTooltip } from './JargonTooltip';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    whiteSpace: 'pre',
    cursor: 'pointer',
    display: 'inline-flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: '4px 8px',
    opacity: .5,
    '&:hover': {
      opacity: .6
    },
    '&:hover $delete': {
      opacity: .7
    }
  },
  checkbox: {
    padding: 8,
    '& .MuiSvgIcon-root': {
      height: 16,
      width: 16,
    }
  },
  term: {
    textTransform: 'capitalize',
  },
  approved: {
    opacity: 1,
    borderColor: theme.palette.grey[800],
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
        deleted: true,
        approved: false,
      },
      optimisticResponse: {
        ...jargonTerm,
        deleted: true,
        approved: false,
      }
    })
  }

  const { LWTooltip, JargonTooltip } = Components;

  return <span className={classNames(classes.root, jargonTerm.approved && classes.approved)} onClick={handleActiveChange}>
    <JargonTooltip term={jargonTerm.term} definitionHTML={jargonTerm.contents?.html ?? ''} altTerms={jargonTerm.altTerms ?? []} humansAndOrAIEdited={jargonTerm.humansAndOrAIEdited} replacedSubstrings={[]} clickable={false}>
      <span className={classes.term}>{jargonTerm.term}</span>
    </JargonTooltip>
    
    <LWTooltip title="Delete" placement="right">
      <span className={classes.delete} onClick={handleDelete}>x</span>
    </LWTooltip> 
  </span>;
}

const JargonTocItemComponent = registerComponent('JargonTocItem', JargonTocItem, {styles});

declare global {
  interface ComponentTypes {
    JargonTocItem: typeof JargonTocItemComponent
  }
}

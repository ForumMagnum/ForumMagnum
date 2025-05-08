import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import type { Hit } from 'react-instantsearch-core';
import LocalLibraryIcon from '@/lib/vendor/@material-ui/icons/src/LocalLibrary';
import { Snippet } from 'react-instantsearch-dom';
import { SearchHitComponentProps } from './types';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    display: 'flex',
    alignItems: 'center'
  },
  title: {
    display: "inline",
    ...theme.typography.postStyle,
    fontSize: "1.25rem",
    ...theme.typography.smallCaps,
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
    marginRight: 8,
    textDecoration: "none",
    "& a:hover": {
      color: "inherit",
    },
  },
  icon: {
    width: 20,
    color: theme.palette.grey[500],
    marginRight: 12,
    marginLeft: 4
  },
  meta: {
    display: "inline-block",
    color: theme.palette.text.dim,
    "& div": {
      display: "inline-block",
      marginRight: 5,
    }
  },
  snippet: {
    ...theme.typography.postStyle,
    lineHeight: "1.3rem",
    marginTop: 4,
    wordBreak: "break-word"
  }
});

const SequencesSearchHitInner = ({hit, clickAction, classes, showIcon=false}: SearchHitComponentProps) => {
  const sequence: SearchSequence = hit;
  const { LWTooltip, MetaInfo } = Components
  
  const showSnippet = hit._snippetResult?.body?.matchLevel !== "none"

  return <div className={classes.root}>
      {showIcon && <LWTooltip title="Sequence">
        <LocalLibraryIcon className={classes.icon}/>
      </LWTooltip>}
      <Link to={"/sequences/" + sequence._id} onClick={() => clickAction(sequence._id)}>
        <div className="sequences-item-body ">
          <div className={classes.title}>
            {sequence.title}
          </div>
          <div className={classes.meta}>
            <MetaInfo>{sequence.authorDisplayName}</MetaInfo>
            <MetaInfo className="sequences-item-created-date">
              <Components.FormatDate date={sequence.createdAt}/>
            </MetaInfo>
          </div>
        </div>
        {showSnippet && <div className={classes.snippet}>
          <Snippet attribute="description" hit={sequence} tagName="mark" />
        </div>}
      </Link>
  </div>
}

export const SequencesSearchHit = registerComponent("SequencesSearchHit", SequencesSearchHitInner, {styles});

declare global {
  interface ComponentTypes {
    SequencesSearchHit: typeof SequencesSearchHit
  }
}


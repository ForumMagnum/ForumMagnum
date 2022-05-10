import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import type { Hit } from 'react-instantsearch-core';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    display: "inline",
    fontSize: "1.25rem",
    fontVariant: "small-caps",
    marginRight: 8,
    textDecoration: "none",
    "& a:hover": {
      color: "inherit",
    }
  },
  meta: {
    display: "inline-block",
    color: theme.palette.text.dim,
    "& div": {
      display: "inline-block",
      marginRight: 5,
    }
  },
});

const SequencesSearchHit = ({hit, clickAction, classes}: {
  hit: Hit<AlgoliaSequence>,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const sequence: AlgoliaSequence = hit;
  const linkProperties = clickAction ? {onClick: () => clickAction(sequence._id)} : {to: "sequences/" + sequence._id};
  return <div className="search-results-sequences-item sequences-item">
      <Link {...linkProperties} className="sequence-item-title-link">
        <div className="sequences-item-body ">
          <div className={classes.title}>
            {sequence.title}
          </div>
          <div className={classes.meta}>
            <div className="sequences-item-author">{sequence.authorDisplayName}</div>
            <div className="sequences-item-created-date">
              <Components.FormatDate date={sequence.createdAt}/>
            </div>
          </div>
        </div>
      </Link>
  </div>
}

const SequencesSearchHitComponent = registerComponent("SequencesSearchHit", SequencesSearchHit, {styles});

declare global {
  interface ComponentTypes {
    SequencesSearchHit: typeof SequencesSearchHitComponent
  }
}


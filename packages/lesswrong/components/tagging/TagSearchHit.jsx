import React from 'react';
import { registerComponent, Components, useSingle } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withHover from '../common/withHover';
import { Tags } from '../../lib/collections/tags/collection.js';

const styles = {
  root: {
    display: "block",
    padding: 8,
    cursor: "pointer",
  },
  card: {
    padding: 16,
    width: 400,
  },
};

const TagSearchHit = ({hit, onClick, hover, anchorEl, classes}) => {
  const { PopperCard, ContentItemBody, Loading } = Components;
  const { document: tag } = useSingle({
    documentId: hit._id,
    collection: Tags,
    queryName: "tagSearchHit",
    fragmentName: "TagFragment",
    fetchPolicy: 'cache-then-network',
  });
  
  return (
    <React.Fragment>
      <PopperCard open={hover} anchorEl={anchorEl} placement="right-start">
        <div className={classes.card}>
          {!tag && <Loading/>}
          {tag && <ContentItemBody
            dangerouslySetInnerHTML={{__html: tag.description?.htmlHighlight}}
            description={`tag ${tag.name}`}
          />}
        </div>
      </PopperCard>
      <a className={classes.root} onClick={onClick} >
        {hit.name}
      </a>
    </React.Fragment>
  );
}

registerComponent("TagSearchHit", TagSearchHit,
  withHover,
  withStyles(styles, {name: "TagSearchHit"}));

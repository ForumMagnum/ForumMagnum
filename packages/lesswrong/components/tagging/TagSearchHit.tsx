import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import withHover from '../common/withHover';
import { Tags } from '../../lib/collections/tags/collection';
import { commentBodyStyles } from '../../themes/stylePiping'
import classNames from 'classnames';

const styles = theme => ({
  root: {
    display: "block",
    padding: 8,
    cursor: "pointer",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[500],
    '&:hover': {
      color: theme.palette.lwTertiary.main
    }
  },
  card: {
    padding: 16,
    width: 400,
    ...commentBodyStyles(theme),
    
    // No hover-preview on small phone screens
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  tagDescription: {
    marginBottom: 12
  },
  hasDescription: {
    color: theme.palette.grey[900]
  },
  postCount: {
    fontSize: ".85em",
    color: theme.palette.grey[500]
  }
});

interface ExternalProps {
  hit: any,
  onClick: (ev: any) => void,
}
interface TagSearchHitProps extends ExternalProps, WithHoverProps, WithStylesProps {
}

const TagSearchHit = ({hit, onClick, hover, anchorEl, classes}: TagSearchHitProps) => {
  const { PopperCard, ContentItemBody, Loading } = Components;
  const { document: tag } = useSingle({
    documentId: hit._id,
    collection: Tags,
    fragmentName: "TagFragment",
    fetchPolicy: 'cache-then-network' as any, //TODO
  });
  return (
    <React.Fragment>
      <PopperCard open={hover} anchorEl={anchorEl} placement="right-start">
        <div className={classes.card}>
          {!tag && <Loading/>}
          <div className={classes.tagDescription}>
            {tag && tag.description?.htmlHighlight ? <ContentItemBody
                dangerouslySetInnerHTML={{__html: tag.description?.htmlHighlight}}
                description={`tag ${tag.name}`}
              /> 
            : <em>No description</em>}
          </div>
          <div className={classes.postCount}>{hit.postCount} posts</div>
        </div>
      </PopperCard>
      <span className={classNames(classes.root, {[classes.hasDescription]: tag?.description?.htmlHighlight})} onClick={onClick} >
        {hit.name} <span className={classes.postCount}>({hit.postCount})</span>
      </span>
    </React.Fragment>
  );
}

const TagSearchHitComponent = registerComponent<ExternalProps>("TagSearchHit", TagSearchHit, {
  styles,
  hocs: [withHover()]
});

declare global {
  interface ComponentTypes {
    TagSearchHit: typeof TagSearchHitComponent
  }
}


import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useHover } from '../common/withHover';
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "block",
    padding: 8,
    cursor: "pointer",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[900],
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
  postCount: {
    fontSize: ".85em",
    color: theme.palette.grey[500]
  }
});

const TagSearchHit = ({hit, onClick, classes}: {
  hit: any,
  onClick: (ev: any) => void,
  classes: ClassesType,
}) => {
  const { PopperCard, ContentItemBody, Loading } = Components;
  const { document: tag } = useSingle({
    documentId: hit._id,
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
    fetchPolicy: 'cache-then-network' as any, //TODO
  });
  const {eventHandlers, hover, anchorEl} = useHover();

  return (
    <span {...eventHandlers}>
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
      <span className={classes.root} onClick={onClick} >
        {hit.name} <span className={classes.postCount}>({hit.postCount || 0})</span>
      </span>
    </span>
  );
}

const TagSearchHitComponent = registerComponent("TagSearchHit", TagSearchHit, {styles});

declare global {
  interface ComponentTypes {
    TagSearchHit: typeof TagSearchHitComponent
  }
}


import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import withHover from '../common/withHover';
import { Tags } from '../../lib/collections/tags/collection';
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
    display: "block",
    padding: 8,
    cursor: "pointer",
    ...theme.typography.commentStyle
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

const TagSearchHitComponent = registerComponent<ExternalProps>("TagSearchHit", TagSearchHit, {
  styles,
  hocs: [withHover()]
});

declare global {
  interface ComponentTypes {
    TagSearchHit: typeof TagSearchHitComponent
  }
}


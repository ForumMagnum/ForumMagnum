import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping'
import { truncate } from '../../lib/editor/ellipsize';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...commentBodyStyles(theme),
    "& .read-more a": {
      fontSize: ".85em",
      color: theme.palette.grey[600]
    },
  }
});


const TagPreviewDescription = ({tag, classes}: {
  tag: TagPreviewFragment,
  classes: ClassesType
}) => {
  const { ContentItemBody } = Components;

  if (!tag) return null
  
  const highlight = truncate(tag.description?.htmlHighlight, 1, "paragraphs",
    '... <span class="read-more"><a>(read more)</a></span>')

  if (tag.description?.htmlHighlight) {
    return <ContentItemBody
      className={classes.root}
      dangerouslySetInnerHTML={{__html: highlight}}
      description={`tag ${tag.name}`}
    />
  }
  return <div className={classes.root}><b>{tag.name}</b></div>
}

const TagPreviewDescriptionComponent = registerComponent("TagPreviewDescription", TagPreviewDescription, {styles});

declare global {
  interface ComponentTypes {
    TagPreviewDescription: typeof TagPreviewDescriptionComponent
  }
}

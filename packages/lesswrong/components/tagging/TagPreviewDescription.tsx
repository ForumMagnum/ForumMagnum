import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping'
import { truncate } from '../../lib/editor/ellipsize';
import { useNavigation } from '../../lib/routeUtil';
import { tagGetUrl } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...commentBodyStyles(theme),
    "& a.read-more": {
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
  const { history } = useNavigation();

  if (!tag) return null
  
  const highlight = truncate(tag.description?.htmlHighlight, 1, "paragraphs",
    '... <a class="read-more" href="#">(read more)</a>')

  if (tag.description?.htmlHighlight) {
    return <div
      onClick={(ev: React.SyntheticEvent) => {
        if ((ev.target as any)?.className==="read-more") {
          history.push(tagGetUrl(tag));
        }
      }}
    >
      <ContentItemBody
        className={classes.root}
        dangerouslySetInnerHTML={{__html: highlight}}
        description={`tag ${tag.name}`}
      />
    </div>
  }
  return <div className={classes.root}><b>{tag.name}</b></div>
}

const TagPreviewDescriptionComponent = registerComponent("TagPreviewDescription", TagPreviewDescription, {styles});

declare global {
  interface ComponentTypes {
    TagPreviewDescription: typeof TagPreviewDescriptionComponent
  }
}

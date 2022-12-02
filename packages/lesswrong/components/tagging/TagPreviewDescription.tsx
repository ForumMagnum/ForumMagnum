import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { truncate } from '../../lib/editor/ellipsize';
import { useNavigation } from '../../lib/routeUtil';
import { tagGetUrl } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    "& a.read-more-button": {
      fontSize: ".85em",
      color: theme.palette.grey[600]
    },
  }
});


const TagPreviewDescription = ({tag, classes}: {
  tag: TagPreviewFragment,
  classes: ClassesType
}) => {
  const { ContentItemBody, ContentStyles } = Components;
  const { history } = useNavigation();

  if (!tag) return null
  
  const highlight = truncate(tag.description?.htmlHighlight, 1, "paragraphs",
    '... <a class="read-more-button" href="#">(read more)</a>')

  if (tag.description?.htmlHighlight) {
    return <div
      onClick={(ev: React.SyntheticEvent) => {
        if ((ev.target as any)?.className==="read-more-button") {
          history.push(tagGetUrl(tag));
        }
      }}
    >
      <ContentStyles contentType="comment">
        <ContentItemBody
          className={classes.root}
          dangerouslySetInnerHTML={{__html: highlight}}
          description={`tag ${tag.name}`}
        />
      </ContentStyles>
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

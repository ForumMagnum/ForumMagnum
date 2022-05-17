import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagLinkpostBody = ({post, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType
}) => {
  const { ContentStyles, ContentItemBody } = Components;
  const tag = post.linkedTag!;
  
  const htmlWithAnchors = tag.tableOfContents?.html || tag.description?.html || "";
  
  return <div>
    <ContentStyles contentType="tag">
      <ContentItemBody
        dangerouslySetInnerHTML={{__html: htmlWithAnchors}}
        description={`tag ${tag.name}`}
        className={classes.description}
      />
    </ContentStyles>
  </div>
}

const TagLinkpostBodyComponent = registerComponent("TagLinkpostBody", TagLinkpostBody, {styles});

declare global {
  interface ComponentTypes {
    TagLinkpostBody: typeof TagLinkpostBodyComponent
  }
}

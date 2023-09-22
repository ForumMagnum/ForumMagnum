// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { DebateBody } from './DebateBody';
import { DebateResponseWithReplies } from './DebateResponseBlock';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

// A wrapper around DebateBody with a Table of Contents,
// built out of the contents of the debate comments
export const DebateBodyWithToc =  ({ debateResponses, post, classes }: {
  debateResponses: DebateResponseWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  classes: ClassesType,
}) => {
  const { ToCColumn, DebateBody } = Components
  return  <ToCColumn
    tableOfContents={tableOfContents}
    header={header}
    rightColumnChildren={rightColumnChildren}
  >
    <DebateBody
      debateResponses={debateResponses}
      post={post}
    />
  </ToCColumn>
}

const DebateBodyWithTocComponent = registerComponent('DebateBodyWithToc', DebateBodyWithToc, {styles});

declare global {
  interface ComponentTypes {
    DebateBodyWithToc: typeof DebateBodyWithTocComponent
  }
}

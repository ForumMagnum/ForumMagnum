import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';

const DialoguesList = ({limit=20, hideLoadMore=false}: {
  limit?: number,
  hideLoadMore?: boolean,
}) => {
  const { PostsItem, LWTooltip, SingleColumnSection, SectionTitle } = Components

  const {
    results: dialoguePosts
  } = usePaginatedResolver({
    fragmentName: "PostsPage",
    resolverName: "RecentlyActiveDialogues",
    limit: 3,
  }); 

  const dialoguesTooltip = <div>
    Beta feature: dialogues between a small group of users. Click for more info
  </div>

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <SingleColumnSection>
      <LWTooltip placement="top-start" title={dialoguesTooltip}>
        <Link to="/posts/y8aCB8z2QpJWBdwtA/announcing-dialogues">
          <SectionTitle title="Dialogues"/>
        </Link>
      </LWTooltip>
      {dialoguePosts?.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < dialoguePosts.length-1}
        />
      )}
   </SingleColumnSection>
  </AnalyticsContext>
}

const DialoguesListComponent = registerComponent('DialoguesList', DialoguesList, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    DialoguesList: typeof DialoguesListComponent
  }
}

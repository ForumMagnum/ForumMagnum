import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';

const DialoguesList = () => {
  const { PostsItem, LWTooltip, SingleColumnSection, SectionTitle } = Components

  const { results: dialoguePosts } = usePaginatedResolver({
    fragmentName: "PostsPage",
    resolverName: "RecentlyActiveDialogues",
    limit: 3,
  }); 

  const {
    document: party,
  } = useSingle({
    documentId: "BJcNeJss4jxc68GQR",
    collectionName: "Posts",
    fragmentName: "PostsPage",
  });

  const dialoguesTooltip = <div>
    <p>Beta feature: Dialogues between a small group of users. Click to see more.</p>
  </div>

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <SingleColumnSection>
      <SectionTitle href="/dialogues"
        title={<LWTooltip placement="top-start" title={dialoguesTooltip}>
          Dialogues
        </LWTooltip>}
      />
      {party && <PostsItem post={party}/>}
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

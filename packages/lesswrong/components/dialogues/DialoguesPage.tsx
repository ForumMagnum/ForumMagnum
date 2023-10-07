import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';

const DialoguesPage = () => {
  const { PostsItem, LWTooltip, SingleColumnSection, SectionTitle, SectionFooter, LoadMore } = Components

  const { results: dialoguePosts, loadMoreProps } = usePaginatedResolver({
    fragmentName: "PostsPage",
    resolverName: "RecentlyActiveDialogues",
    limit: 20,
  }); 

  const { document: announcementPost } = useSingle({
    documentId: "kQuSZG8ibfW6fJYmo",
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
  });

  const dialoguesTooltip = <div>
    <p>Beta feature: Dialogues between a small group of users.</p>
  </div>

  return <AnalyticsContext pageSubSectionContext="DialoguesPage">
    <SingleColumnSection>
      <SectionTitle
        title={<LWTooltip placement="top-start" title={dialoguesTooltip}>
          Dialogues
        </LWTooltip>}
      />
      {announcementPost && <PostsItem
        key={"kQuSZG8ibfW6fJYmo"} post={announcementPost} forceSticky
      />}
      {dialoguePosts?.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < dialoguePosts.length-1}
        />
      )}
      <SectionFooter>
        <LoadMore {...loadMoreProps}/>
      </SectionFooter>
   </SingleColumnSection>
  </AnalyticsContext>
}

const DialoguesPageComponent = registerComponent('DialoguesPage', DialoguesPage, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    DialoguesPage: typeof DialoguesPageComponent
  }
}

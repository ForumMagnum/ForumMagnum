import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import PostsItem from "../posts/PostsItem";
import LWTooltip from "../common/LWTooltip";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import SectionFooter from "../common/SectionFooter";
import LoadMore from "../common/LoadMore";

const PostsListWithVotesQuery = gql(`
  query DialoguesPage($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsListWithVotes
      }
    }
  }
`);

const DialoguesPage = () => {
  const { results: dialoguePosts, loadMoreProps } = usePaginatedResolver({
    fragmentName: "PostsPage",
    resolverName: "RecentlyActiveDialogues",
    limit: 20,
  }); 
  
  const { results: myDialogues, loadMoreProps: myDialoguesLoadMoreProps } = usePaginatedResolver({
    fragmentName: "PostsPage",
    resolverName: "MyDialogues",
    limit: 10,
  }); 

  const currentUser = useCurrentUser();

  const renderMyDialogues = currentUser && myDialogues?.length

  const { data } = useQuery(PostsListWithVotesQuery, {
    variables: { documentId: "kQuSZG8ibfW6fJYmo" },
  });
  const announcementPost = data?.post?.result;

  const dialoguesTooltip = <div>
    <p>Dialogues between a small group of users.</p>
  </div>

  const myDialoguesTooltip = <div>
    <p>These are the dialoges you are involved in (both drafts and published)</p>
  </div>

  return <AnalyticsContext pageContext="DialoguesPage">
    <SingleColumnSection>
      {renderMyDialogues && <AnalyticsContext pageSectionContext="MyDialoguesList">
          <SectionTitle
              title={<LWTooltip placement="top-start" title={myDialoguesTooltip}>
                My Dialogues (Drafts & Published)
              </LWTooltip>}
            />
          {myDialogues?.map((post: PostsListWithVotes, i: number) =>
            <PostsItem
              key={post._id} post={post}
              showBottomBorder={i < myDialogues.length-1}
            />
          )}
          <SectionFooter>
            <LoadMore {...myDialoguesLoadMoreProps}/>
          </SectionFooter>
        </AnalyticsContext>}

      <AnalyticsContext pageSectionContext="DialoguesList">
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
      </AnalyticsContext>
   </SingleColumnSection>
  </AnalyticsContext>
}

export default registerComponent('DialoguesPage', DialoguesPage, {
  hocs: [withErrorBoundary]
});



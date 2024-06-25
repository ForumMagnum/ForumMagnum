import React, { useRef } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import { useSingle } from '../../../lib/crud/withSingle';
import mapValues from 'lodash/mapValues';
import type { SideCommentMode } from '../../dropdowns/posts/SetSideCommentVisibility';
import { getVotingSystemByName } from '../../../lib/voting/votingSystems';
import type { ContentItemBody, ContentReplacedSubstringComponentInfo } from '../../common/ContentItemBody';
import { hasSideComments, inlineReactsHoverEnabled } from '../../../lib/betas';
import { VotingProps } from '@/components/votes/votingProps';

const enableInlineReactsOnPosts = inlineReactsHoverEnabled;

const PostBody = ({post, html, sideCommentMode, voteProps}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  html: string,
  sideCommentMode?: SideCommentMode,
  voteProps: VotingProps<PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes>
}) => {
  const includeSideComments =
    hasSideComments &&
    sideCommentMode &&
    sideCommentMode !== "hidden";

  const { document } = useSingle({
    documentId: post._id,
    collectionName: "Posts",
    fragmentName: 'PostSideComments',
    skip: !includeSideComments,
  });
  
  const votingSystemName = post.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  
  const { ContentItemBody, SideCommentIcon, InlineReactSelectionWrapper } = Components;
  const nofollow = (post.user?.karma || 0) < nofollowKarmaThreshold.get();
  const contentRef = useRef<ContentItemBody>(null);
  let content: React.ReactNode
  
  let highlights: Record<string,ContentReplacedSubstringComponentInfo>|undefined = undefined;
  if (votingSystem.getPostHighlights) {
    highlights = votingSystem.getPostHighlights({post, voteProps});
  }

  if (includeSideComments && document?.sideComments) {
    const htmlWithIDs = document.sideComments.html;
    const sideComments = sideCommentMode==="highKarma"
      ? document.sideComments.highKarmaCommentsByBlock
      : document.sideComments.commentsByBlock;
    const sideCommentsMap = mapValues(sideComments, commentIds => <SideCommentIcon post={post} commentIds={commentIds}/>)

    content = <ContentItemBody
      dangerouslySetInnerHTML={{__html: htmlWithIDs}}
      ref={contentRef}
      key={`${post._id}_${sideCommentMode}`}
      description={`post ${post._id}`}
      nofollow={nofollow}
      replacedSubstrings={highlights}
      idInsertions={sideCommentsMap}
    />
  } else {
    content = <ContentItemBody
      dangerouslySetInnerHTML={{__html: html}}
      ref={contentRef}
      description={`post ${post._id}`}
      nofollow={nofollow}
      replacedSubstrings={highlights}
    />
  }
  
  if (enableInlineReactsOnPosts) {
    return <InlineReactSelectionWrapper
      commentBodyRef={contentRef}
      voteProps={voteProps}
      styling="post"
    >
      {content}
    </InlineReactSelectionWrapper>
  } else {
    return <>{content}</>;
  }
}

const PostBodyComponent = registerComponent('PostBody', PostBody);

declare global {
  interface ComponentTypes {
    PostBody: typeof PostBodyComponent
  }
}

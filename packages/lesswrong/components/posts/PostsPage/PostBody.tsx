import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import { useSingle } from '../../../lib/crud/withSingle';
import mapValues from 'lodash/mapValues';
import { SideItemVisibilityContext } from '../../dropdowns/posts/SetSideItemVisibility';
import { getVotingSystemByName } from '../../../lib/voting/getVotingSystem';
import type { ContentItemBodyInner, ContentReplacedSubstringComponentInfo } from '../../common/ContentItemBody';
import { hasSideComments, inlineReactsHoverEnabled } from '../../../lib/betas';
import { VotingProps } from '@/components/votes/votingProps';
import { jargonTermsToTextReplacements } from '@/components/jargon/JargonTooltip';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { useTracking } from '@/lib/analyticsEvents';

const enableInlineReactsOnPosts = inlineReactsHoverEnabled;

function useDisplayGlossary(post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes) {
  const { captureEvent } = useTracking();
  const [showAllTerms, setShowAllTerms] = useState(false);

  const postHasGlossary = 'glossary' in post;

  useGlobalKeydown((e) => {
    const G_KeyCode = 71;
    if (e.altKey && e.shiftKey && e.keyCode === G_KeyCode) {
      e.preventDefault();
      if (postHasGlossary) {
        setShowAllTerms(!showAllTerms);
        captureEvent('toggleShowAllTerms', { newValue: !showAllTerms, source: 'hotkey' });
      }
    }
  });

  const wrappedSetShowAllTerms = useCallback((e: React.MouseEvent, showAllTerms: boolean, source: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAllTerms(showAllTerms);
    captureEvent('toggleShowAllTerms', { newValue: showAllTerms, source });
  }, [setShowAllTerms, captureEvent]);

  if (!postHasGlossary) {
    return { showAllTerms: false, setShowAllTerms: () => {}, termsToHighlight: [], unapprovedTermsCount: 0, approvedTermsCount: 0 };
  }

  const approvedTerms = post.glossary.filter(term => term.approved && !term.deleted);
  
  // Right now we could just derive displayTermCount from termsToHighlight, but the implementations might not always be coupled
  const termsToHighlight = showAllTerms ? post.glossary : approvedTerms;
  const approvedTermsCount = approvedTerms.length;
  const unapprovedTermsCount = post.glossary.length - approvedTermsCount;
  
  return { showAllTerms, setShowAllTerms: wrappedSetShowAllTerms, termsToHighlight, unapprovedTermsCount, approvedTermsCount };
}

const PostBodyInner = ({post, html, isOldVersion, voteProps}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  html: string,
  isOldVersion: boolean
  voteProps: VotingProps<PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes>
}) => {

  const { showAllTerms, setShowAllTerms, termsToHighlight, unapprovedTermsCount, approvedTermsCount } = useDisplayGlossary(post);

  const sideItemVisibilityContext = useContext(SideItemVisibilityContext);
  const sideCommentMode= isOldVersion ? "hidden" : (sideItemVisibilityContext?.sideCommentMode ?? "hidden")
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
  
  const { ContentItemBody, SideCommentIcon, InlineReactSelectionWrapper, GlossarySidebar } = Components;
  const nofollow = (post.user?.karma || 0) < nofollowKarmaThreshold.get();
  const contentRef = useRef<ContentItemBodyInner>(null);
  let content: React.ReactNode
  
  const highlights = votingSystem.getPostHighlights
    ? votingSystem.getPostHighlights({post, voteProps})
    : []
  const glossaryItems: ContentReplacedSubstringComponentInfo[] = ('glossary' in post)
    ? jargonTermsToTextReplacements(termsToHighlight)
    : [];
  const replacedSubstrings = [...highlights, ...glossaryItems];
  const glossarySidebar = 'glossary' in post && <GlossarySidebar post={post} showAllTerms={showAllTerms} setShowAllTerms={setShowAllTerms} unapprovedTermsCount={unapprovedTermsCount} approvedTermsCount={approvedTermsCount} />
    
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
      replacedSubstrings={replacedSubstrings}
      idInsertions={sideCommentsMap}
    />
  } else {
    content = <ContentItemBody
      dangerouslySetInnerHTML={{__html: html}}
      ref={contentRef}
      description={`post ${post._id}`}
      nofollow={nofollow}
      replacedSubstrings={replacedSubstrings}
    />
  }
  
  if (enableInlineReactsOnPosts) {
    return <InlineReactSelectionWrapper
      contentRef={contentRef}
      voteProps={voteProps}
      styling="post"
    >
      {glossarySidebar}
      {content}
    </InlineReactSelectionWrapper>
  } else {
    return <>
      {glossarySidebar}
      {content}
    </>;
  }
}

export const PostBody = registerComponent('PostBody', PostBodyInner);

declare global {
  interface ComponentTypes {
    PostBody: typeof PostBody
  }
}

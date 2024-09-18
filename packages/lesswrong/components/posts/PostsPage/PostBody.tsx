import React, { useContext, useRef } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import { useSingle } from '../../../lib/crud/withSingle';
import mapValues from 'lodash/mapValues';
import { SideCommentMode, SideItemVisibilityContext } from '../../dropdowns/posts/SetSideItemVisibility';
import { getVotingSystemByName } from '../../../lib/voting/votingSystems';
import type { ContentItemBody, ContentReplacedSubstringComponentInfo } from '../../common/ContentItemBody';
import { hasSideComments, inlineReactsHoverEnabled } from '../../../lib/betas';
import { VotingProps } from '@/components/votes/votingProps';

const enableInlineReactsOnPosts = inlineReactsHoverEnabled;

const PostBody = ({post, html, isOldVersion, voteProps}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  html: string,
  isOldVersion: boolean
  voteProps: VotingProps<PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes>
}) => {
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
  
  const { ContentItemBody, SideCommentIcon, InlineReactSelectionWrapper } = Components;
  const nofollow = (post.user?.karma || 0) < nofollowKarmaThreshold.get();
  const contentRef = useRef<ContentItemBody>(null);
  let content: React.ReactNode
  
  let highlights: Record<string,ContentReplacedSubstringComponentInfo>|undefined = undefined;
  if (votingSystem.getPostHighlights) {
    highlights = votingSystem.getPostHighlights({post, voteProps});
  }
  
  const glossary: Record<string, ContentReplacedSubstringComponentInfo> = {
    "AI": {
      componentName: "JargonTooltip",
      props: {
        term: "AI",
        definition: "Artificial Intelligence: The simulation of human intelligence processes by machines, especially computer systems.",
      },
    },
    "ML": {
      componentName: "JargonTooltip",
      props: {
        term: "ML",
        definition: "Machine Learning: A subset of AI that enables systems to learn and improve from experience without being explicitly programmed.",
      },
    }, 
    "DL": {
      componentName: "JargonTooltip",
      props: {
        term: "DL",
        definition: "Deep Learning: A subset of ML based on artificial neural networks with multiple layers that progressively extract higher-level features from raw input.",
      },
    },
    "NLP": {
      componentName: "JargonTooltip",
      props: {
        term: "NLP",
        definition: "Natural Language Processing: A branch of AI that focuses on the interaction between computers and humans using natural language.",
      },
    },
    "RNN": {
      componentName: "JargonTooltip",
      props: {
        term: "RNN",
        definition: "Recurrent Neural Network: A type of neural network designed to recognize patterns in sequences of data, such as text, genomes, handwriting, or numerical time series data.",
      },
    },
  }

  // result[quote] = {
  //   componentName: 'InlineReactHoverableHighlight',
  //   props: {
  //     quote,
  //     reactions: reactionsByQuote[quote],
  //   }
  // };

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
      glossary={glossary}
    />
  } else {
    content = <ContentItemBody
      dangerouslySetInnerHTML={{__html: html}}
      ref={contentRef}
      description={`post ${post._id}`}
      nofollow={nofollow}
      replacedSubstrings={highlights}
      glossary={glossary}
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

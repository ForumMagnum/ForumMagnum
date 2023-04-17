import React, { useCallback, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import { useSingle } from '../../../lib/crud/withSingle';
import { useCurrentUser } from '../../common/withUser';
import mapValues from 'lodash/mapValues';
import type { SideCommentMode } from '../PostActions/SetSideCommentVisibility';
import { useLocation } from '../../../lib/routeUtil';
import ReactDOMServer from 'react-dom/server';

const PostBody = ({post, html, sideCommentMode}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  html: string,
  sideCommentMode?: SideCommentMode
}) => {
  const currentUser = useCurrentUser();
  const { pathname } = useLocation();
  const includeSideComments = sideCommentMode && sideCommentMode!=="hidden";

  const { document, loading } = useSingle({
    documentId: post._id,
    collectionName: "Posts",
    fragmentName: 'PostSideComments',
    skip: !includeSideComments,
  });
  
  const { ContentItemBody, SideCommentIcon, StrawPollLoggedOut } = Components;
  const nofollow = (post.user?.karma || 0) < nofollowKarmaThreshold.get();
  
  const replaceStrawPollEmbed = useCallback((htmlString, isLoggedIn, pathname) => {
    if (!isLoggedIn) {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(htmlString, "text/html");
      const strawpollEmbeds = htmlDoc.getElementsByClassName("strawpoll-embed");

      for (const embed of Array.from(strawpollEmbeds)) {
        if (embed && embed.parentNode) {
          const replacementDiv = ReactDOMServer.renderToString(<StrawPollLoggedOut pathname={pathname} />);
          const tempDiv = htmlDoc.createElement("div");
          tempDiv.innerHTML = replacementDiv;

          if (!tempDiv.firstElementChild) continue;

          embed.parentNode.replaceChild(tempDiv.firstElementChild, embed);
        }
      }

      return htmlDoc.documentElement.outerHTML;
    }

    return htmlString;
  }, [StrawPollLoggedOut]);

  const cleanedHtml = useMemo(() => replaceStrawPollEmbed(html, !!currentUser, pathname), [currentUser, html, pathname, replaceStrawPollEmbed]);
  const cleanedSideCommentHtml = useMemo(() => replaceStrawPollEmbed(document?.sideComments?.html || "", !!currentUser, pathname), [currentUser, document?.sideComments?.html, pathname, replaceStrawPollEmbed]);
  
  if (includeSideComments && document?.sideComments) {
    const htmlWithIDs = cleanedSideCommentHtml;
    const sideComments = sideCommentMode==="highKarma"
      ? document.sideComments.highKarmaCommentsByBlock
      : document.sideComments.commentsByBlock;
    const sideCommentsMap = mapValues(sideComments, commentIds => <SideCommentIcon post={post} commentIds={commentIds}/>)

    return <ContentItemBody
      dangerouslySetInnerHTML={{__html: htmlWithIDs}}
      key={`${post._id}_${sideCommentMode}`}
      description={`post ${post._id}`}
      nofollow={nofollow}
      idInsertions={sideCommentsMap}
    />
  }
  
  return <ContentItemBody
    dangerouslySetInnerHTML={{__html: cleanedHtml}}
    description={`post ${post._id}`}
    nofollow={nofollow}
  />
}

const PostBodyComponent = registerComponent('PostBody', PostBody);

declare global {
  interface ComponentTypes {
    PostBody: typeof PostBodyComponent
  }
}

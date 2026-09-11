import type { UltraFeedResolverType, UserOrClientId } from "@/components/ultraFeed/ultraFeedTypes";
import type { UltraFeedEventInsertData } from "../resolvers/ultraFeedResolverHelpers";
import { randomId } from "@/lib/random";

export const createUltraFeedEvents = (
  results: UltraFeedResolverType[],
  userOrClientId: UserOrClientId,
  sessionId: string,
  offset: number
): UltraFeedEventInsertData[] => {
  const eventsToCreate: UltraFeedEventInsertData[] = [];
  const userId = userOrClientId.id;
  const isLoggedOut = userOrClientId.type === 'client';

  results.forEach((item, index) => {
    const actualItemIndex = offset + index;

    if (item.type === "feedSpotlight" && item.feedSpotlight?.spotlight?._id) {
      const servedEventId = item.feedSpotlight.spotlightMetaInfo.servedEventId;
      eventsToCreate.push({
        _id: servedEventId,
        userId,
        eventType: "served",
        collectionName: "Spotlights",
        documentId: item.feedSpotlight.spotlight._id,
        event: { sessionId, itemIndex: actualItemIndex, sources: ["spotlights"], ...(isLoggedOut ? { loggedOut: true } : {}) }
      });
    } else if (item.type === "feedCommentThread" && (item.feedCommentThread?.comments?.length ?? 0) > 0) {
        const exposureId = randomId();
        const threadData = item.feedCommentThread;
        const comments = threadData?.comments;
        const commentMetaInfos = threadData?.commentMetaInfos;
        const sources = threadData?.commentMetaInfos?.[comments?.[0]?._id ?? ""]?.sources ?? [];
        comments?.forEach((comment: DbComment, commentIndex) => {
          if (comment?._id) {
            const displayStatus = commentMetaInfos?.[comment._id]?.displayStatus;
            const servedEventId = commentMetaInfos?.[comment._id]?.servedEventId;
            if (servedEventId) {
              eventsToCreate.push({
                 _id: servedEventId,
                 userId,
                 eventType: "served",
                 collectionName: "Comments",
                 documentId: comment._id,
                 event: {
                  sessionId,
                  exposureId,
                  itemIndex: actualItemIndex,
                  commentIndex,
                  displayStatus,
                  sources,
                  ...(isLoggedOut ? { loggedOut: true } : {})
                }
                });
            }
          }
        });
    } else if (item.type === "feedPost" && item.feedPost?.post?._id) {
      const feedItem = item.feedPost;
      const servedEventId = feedItem.postMetaInfo?.servedEventId;
      const sources = feedItem.postMetaInfo?.sources ?? [];
      if (feedItem.post._id && servedEventId) {
        eventsToCreate.push({
          _id: servedEventId,
          userId,
          eventType: "served",
          collectionName: "Posts",
          documentId: feedItem.post._id,
          event: { sessionId, itemIndex: actualItemIndex, sources, ...(isLoggedOut ? { loggedOut: true } : {}) }
        });
      }
    }
  });

  return eventsToCreate;
};

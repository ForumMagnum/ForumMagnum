import { createNotifications } from "../notificationCallbacksHelpers";

export async function sendAlignmentSubmissionApprovalNotifications(newDocument: DbPost|DbComment, oldDocument: DbPost|DbComment, context: ResolverContext) {
  const newlyAF = newDocument.af && !oldDocument.af
  const userSubmitted = oldDocument.suggestForAlignmentUserIds && oldDocument.suggestForAlignmentUserIds.includes(oldDocument.userId)
  const reviewed = !!newDocument.reviewForAlignmentUserId
  
  const documentType = newDocument.hasOwnProperty("answer") ? 'comment' : 'post'
  
  if (newlyAF && userSubmitted && reviewed) {
    await createNotifications({ context, userIds: [newDocument.userId], notificationType: "alignmentSubmissionApproved", documentType, documentId: newDocument._id})
  }
}

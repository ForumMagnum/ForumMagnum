import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import { AI_DIGEST_UTM_PARAMS, parseAiDigestUtmContent } from "@/server/emailComponents/aiDigestEmailLinks";
import AiDigestItemClicksRepo from "@/server/repos/AiDigestItemClicksRepo";

/**
 * Records a click on a digest item from the post-view event of the page its
 * link opened. Only the issue's recipient's clicks count.
 */
export async function recordAiDigestItemClick(event: DbLWEvent): Promise<void> {
  const { utmCampaign, utmContent } = event.properties ?? {};
  if (event.name !== "post-view" || !event.userId || utmCampaign !== AI_DIGEST_UTM_PARAMS.utm_campaign || typeof utmContent !== "string") {
    return;
  }
  const { issueId, sectionKind, itemIndex } = parseAiDigestUtmContent(utmContent);
  const issue = await AiDigestIssues.findOne({ _id: issueId, recipientId: event.userId }, {}, { spec: 1 });
  const section = issue?.spec.sections.find((candidate) => candidate.kind === sectionKind);
  if (!section?.items[itemIndex]) {
    return;
  }
  await new AiDigestItemClicksRepo().recordClick({ issueId, sectionKind: section.kind, itemIndex, clickedAt: event.createdAt });
}

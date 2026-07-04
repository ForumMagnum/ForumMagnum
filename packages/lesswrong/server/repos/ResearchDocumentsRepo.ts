import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import ResearchDocuments from "../collections/researchDocuments/collection";

class ResearchDocumentsRepo extends AbstractRepo<"ResearchDocuments"> {
  constructor() {
    super(ResearchDocuments);
  }

  /**
   * Assign `sortOrder = position in orderedIds` to each document, in one
   * statement. Scoped to the given project and owner, so ids outside the
   * project (or not owned by the user) are ignored.
   */
  async reorderDocuments(projectId: string, userId: string, orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;
    await this.none(`
      -- ResearchDocumentsRepo.reorderDocuments
      UPDATE "ResearchDocuments" d
      SET "sortOrder" = ids.ord - 1
      FROM unnest($(orderedIds)::text[]) WITH ORDINALITY AS ids(id, ord)
      WHERE d."_id" = ids.id
        AND d."projectId" = $(projectId)
        AND d."userId" = $(userId)
    `, { orderedIds, projectId, userId });
  }
}

recordPerfMetrics(ResearchDocumentsRepo);

export default ResearchDocumentsRepo;

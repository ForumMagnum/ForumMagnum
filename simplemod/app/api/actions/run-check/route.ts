import type { NextRequest } from 'next/server';
import { rerunLlmCheck } from '@/server/collections/automatedContentEvaluations/helpers';
import { handleActionRequest, requireCollectionName, requireString } from '../../../../src/server/actionRoute';
import type { RunCheckResponse } from '../../../../src/lib/types';

export const dynamic = 'force-dynamic';

function toRunCheckResponse(ace: DbAutomatedContentEvaluation, alreadyExisted: boolean): RunCheckResponse {
  return {
    pangramScore: ace.pangramScore,
    pangramFractionAi: ace.pangramFractionAi,
    pangramPrediction: ace.pangramPrediction,
    pangramWindowScores: ace.pangramWindowScores,
    alreadyExisted,
  };
}

// Runs a Pangram evaluation only when the latest revision doesn't already have
// one — existing scores are never re-rolled from SimpleMod.
export async function POST(req: NextRequest) {
  return handleActionRequest(req, async ({ context }, body) => {
    const collectionName = requireCollectionName(body);
    const documentId = requireString(body, 'documentId');

    const document = collectionName === 'Posts'
      ? await context.Posts.findOne(documentId)
      : await context.Comments.findOne(documentId);
    if (!document) {
      throw new Error(`Invalid ${collectionName} ID`);
    }
    if (document.contents_latest) {
      const existing = await context.AutomatedContentEvaluations.findOne(
        { revisionId: document.contents_latest },
        { sort: { createdAt: -1 } },
      );
      if (existing?.pangramScore !== null && existing?.pangramScore !== undefined) {
        return toRunCheckResponse(existing, true);
      }
    }

    const ace = await rerunLlmCheck(documentId, collectionName, context);
    return toRunCheckResponse(ace, false);
  });
}

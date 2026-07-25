/* eslint-disable no-console */
import React from "react";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getUserEmail } from "@/lib/collections/users/helpers";
import { isDevelopment } from "@/lib/executionEnvironment";
import { AiDigestEmail } from "@/server/emailComponents/AiDigestEmail";
import type { AiDigestSpec } from "@/server/emailComponents/AiDigestSpec";
import type { EmailContextType } from "@/server/emailComponents/emailContext";
import { wrapAndRenderEmail } from "@/server/emails/renderEmail";
import {
  generateAiDigestPostSelection,
  humanizeAiDigestModelId,
} from "@/server/aiDigest/aiDigestPostSelection";
import Users from "@/server/collections/users/collection";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

function digestEmailBody(spec: AiDigestSpec) {
  return function renderDigestEmail(emailContext: EmailContextType) {
    return <AiDigestEmail spec={spec} emailContext={emailContext} />;
  };
}

/**
 * Generate an HTML/JSON post-selection preview for a developer-owned dev user.
 *
 * Run with:
 * yarn repl dev lw packages/lesswrong/server/scripts/generateAiDigestPostSelectionPreview.tsx \
 *   'generateAiDigestPostSelectionPreview("user-slug")'
 *
 * Optional: force personal instructions for a smoke test without persisting them:
 *   'generateAiDigestPostSelectionPreview("user-slug", undefined, "no AI content this week")'
 */
export async function generateAiDigestPostSelectionPreview(
  userSlug: string,
  selectionModelOverride?: string,
  personalInstructionsOverride?: string,
) {
  if (!isDevelopment) {
    throw new Error("AI digest previews may only be generated in development");
  }
  const user = await Users.findOne({ slug: userSlug });
  if (!user) {
    throw new Error(`No user found for slug ${userSlug}`);
  }
  const email = getUserEmail(user);
  if (!email) {
    throw new Error(`User ${userSlug} has no email address`);
  }
  const context = computeContextFromUser({
    user,
    isSSR: false,
  });
  const selectionUser = personalInstructionsOverride !== undefined
    ? {
      ...user,
      aiDigestPersonalInstructions: personalInstructionsOverride,
    }
    : user;
  const result = await generateAiDigestPostSelection({
    user: selectionUser,
    context,
    options: {
      // Don't persist smoke-test runs that override instructions in-memory only.
      ...(personalInstructionsOverride !== undefined ? { persistIssue: false } : {}),
      ...(selectionModelOverride
        ? {
          selectionModelId: selectionModelOverride,
          selectionModelLabel: humanizeAiDigestModelId(selectionModelOverride),
        }
        : {}),
    },
  });
  // AiDigestEmail uses the user-scoped resolver context, not the client-shaped currentUser fragment.
  const emailContext: EmailContextType = {
    resolverContext: context,
    stylesUsed: new Set(),
    currentUser: null,
  };
  const renderedEmail = await wrapAndRenderEmail({
    user,
    to: email,
    subject: result.spec.subject,
    body: digestEmailBody(result.spec),
    emailContext,
  });
  const artifactDirectory = path.resolve("tmp/ai-digest");
  const artifactBaseName = `${user.slug}-post-selection`;
  const jsonPath = path.join(artifactDirectory, `${artifactBaseName}.json`);
  const htmlPath = path.join(artifactDirectory, `${artifactBaseName}.html`);
  await mkdir(artifactDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      jsonPath,
      `${JSON.stringify({
        issueId: result.issueId,
        metadata: result.metadata,
        selectedTitles: result.selectedCandidates.map((candidate) => candidate.title),
        selectedRetrievalSources: result.selectedCandidates.map(
          (candidate) => candidate.retrievalProvenance.source,
        ),
        personalInstructionsOverride: personalInstructionsOverride ?? null,
        spec: result.spec,
      }, null, 2)}\n`,
      "utf8",
    ),
    writeFile(htmlPath, renderedEmail.html, "utf8"),
  ]);

  console.log(`HTML: ${htmlPath}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(
    `Sources: ${result.metadata.candidateCount} candidates, ${result.metadata.evidenceCount} evidence signals, `
    + `${result.metadata.reusedSummaryCount} cached summaries, ${result.metadata.generatedSummaryCount} generated summaries, `
    + `${result.metadata.skippedPostCount} skipped posts, `
    + `${result.metadata.historyIssueCount} prior issues`,
  );
  console.log(
    `Tools: ${result.metadata.toolCallCount} calls, ${result.metadata.searchCount} searches, `
    + `${result.metadata.readPostCount} reads, ${result.metadata.discoveredCandidateCount} discovered`,
  );
  console.log(`Persisted issue: ${result.issueId}`);
  result.selectedCandidates.forEach((candidate, index) => {
    console.log(
      `${index + 1}. [${candidate.retrievalProvenance.source}] ${candidate.title}`,
    );
  });

  return { htmlPath, jsonPath, metadata: result.metadata };
}

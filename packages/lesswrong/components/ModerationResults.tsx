import React, { useMemo } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";

interface Post {
  _id: string;
  title: string;
  contents: { markdown: string };
  frontpageDate: string | null;
  rejected: boolean;
  decision?: "frontpage" | "personal" | "rejected" | "accepted";
  reason?: string;
}

interface ModerationResultsProps {
  moderationType: "frontpage" | "rejection";
  posts: Post[];
  processedCount: number;
  relevantPostsCount: number;
}

export const ModerationResults = ({
  moderationType,
  posts,
  processedCount,
  relevantPostsCount,
}: ModerationResultsProps) => {
  // Filter for posts that have been processed
  const processedPosts = useMemo(() => posts.filter((post) => post.reason !== undefined), [posts]);

  // Calculate disagreements based on moderation type
  const postsWithDisagreement = useMemo(() => {
    return posts.filter((post) => {
      if (!post.reason) return false;

      if (moderationType === "frontpage") {
        const llmDecidedToFrontpage = post.decision === "frontpage";
        const teamDecidedToFrontpage = post.frontpageDate !== null;
        const teamRejected = post.rejected;
        return !teamRejected && llmDecidedToFrontpage !== teamDecidedToFrontpage;
      } else {
        // rejection
        const llmDecidedToReject = post.decision === "rejected";
        const teamRejected = post.rejected;
        return llmDecidedToReject !== teamRejected;
      }
    });
  }, [posts, moderationType]);

  return (
    <div className="moderation-results">
      <h2>{moderationType === "frontpage" ? "Frontpage" : "Rejection"} Moderation Results</h2>
      <p>
        Processing status: {processedCount} of {relevantPostsCount} posts processed
      </p>
      <table>
        <thead>
          <tr>
            <th>False positive rate</th>
            <th>False negative rate</th>
            <th>Total disagreement rate</th>
            <th>Processed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {processedPosts.length > 0
                ? (moderationType === "frontpage"
                    ? processedPosts.filter((post) => post.decision === "frontpage" && !post.frontpageDate).length /
                      processedPosts.filter((post) => !post.rejected).length
                    : processedPosts.filter((post) => post.decision === "rejected" && !post.rejected).length /
                      processedPosts.length
                  ).toFixed(3)
                : "N/A"}
            </td>
            <td>
              {processedPosts.length > 0
                ? (moderationType === "frontpage"
                    ? processedPosts.filter((post) => post.decision === "personal" && post.frontpageDate).length /
                      processedPosts.filter((post) => !post.rejected).length
                    : processedPosts.filter((post) => post.decision !== "rejected" && post.rejected).length /
                      processedPosts.length
                  ).toFixed(3)
                : "N/A"}
            </td>
            <td>
              {processedPosts.length > 0
                ? (moderationType === "frontpage"
                    ? postsWithDisagreement.length / processedPosts.filter((post) => !post.rejected).length
                    : postsWithDisagreement.length / processedPosts.length
                  ).toFixed(3)
                : "N/A"}
            </td>
            <td>
              {processedCount} / {relevantPostsCount}
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Posts with Disagreement</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(postsWithDisagreement, null, 2)}</pre>
    </div>
  );
};

declare global {
  interface ComponentTypes {
    ModerationResults: typeof ModerationResults;
  }
}

registerComponent("ModerationResults", ModerationResults);

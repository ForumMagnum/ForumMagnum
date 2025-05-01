import React, { useMemo, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";

interface Post {
  _id: string;
  title: string;
  contents: { markdown: string };
  frontpageDate: string | null;
  rejected: boolean;
  decision?: "frontpage" | "personal" | "rejected" | "accepted";
  reason?: string;
  user: {
    displayName: string;
    createdAt: string;
    karma: number;
  };
}

interface ModerationResultsProps {
  moderationType: "frontpage" | "rejection";
  posts: Post[];
  processedCount: number;
  relevantPostsCount: number;
}

// Utility to derive true label & comparison outcome
const getClassificationInfo = (
  post: Post,
  moderationType: "frontpage" | "rejection",
): {
  trueLabel: string;
  predictedLabel: string;
  outcome: "correctPositive" | "correctNegative" | "falsePositive" | "falseNegative";
} => {
  if (moderationType === "frontpage") {
    const trueLabel = post.rejected ? "rejected" : post.frontpageDate ? "frontpage" : "personal";
    const predictedLabel = post.decision ?? "unknown";
    // Only evaluate correctness for non-rejected posts
    if (trueLabel === "rejected") {
      return { trueLabel, predictedLabel, outcome: "correctNegative" };
    }
    if (predictedLabel === trueLabel) {
      return {
        trueLabel,
        predictedLabel,
        outcome: predictedLabel === "frontpage" ? "correctPositive" : "correctNegative",
      };
    }
    if (predictedLabel === "frontpage" && trueLabel === "personal") {
      return { trueLabel, predictedLabel, outcome: "falsePositive" };
    }
    return { trueLabel, predictedLabel, outcome: "falseNegative" };
  }

  // rejection moderation
  const trueLabel = post.rejected ? "rejected" : "accepted";
  const predictedLabel = post.decision ?? "unknown";
  if (predictedLabel === trueLabel) {
    return {
      trueLabel,
      predictedLabel,
      outcome: predictedLabel === "rejected" ? "correctPositive" : "correctNegative",
    };
  }
  if (predictedLabel === "rejected" && trueLabel === "accepted") {
    return { trueLabel, predictedLabel, outcome: "falsePositive" };
  }
  return { trueLabel, predictedLabel, outcome: "falseNegative" };
};

export const ModerationResults = ({
  moderationType,
  posts,
  processedCount,
  relevantPostsCount,
}: ModerationResultsProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const processedPosts = useMemo(() => posts.filter((p) => p.reason !== undefined), [posts]);

  const tableRows = useMemo(() => {
    return processedPosts.map((post) => {
      const { trueLabel, predictedLabel, outcome } = getClassificationInfo(post, moderationType);
      return { post, trueLabel, predictedLabel, outcome };
    });
  }, [processedPosts, moderationType]);

  const outcomeCounts = useMemo(() => {
    return tableRows.reduce(
      (acc, row) => {
        acc[row.outcome]++;
        return acc;
      },
      { correctPositive: 0, correctNegative: 0, falsePositive: 0, falseNegative: 0 } as Record<string, number>,
    );
  }, [tableRows]);

  return (
    <div className="moderation-results">
      <h2>{moderationType === "frontpage" ? "Frontpage" : "Rejection"} Moderation Results</h2>
      <p>
        Processed {processedCount} / {relevantPostsCount} – Correct Positive: {outcomeCounts.correctPositive} – Correct Negative: {outcomeCounts.correctNegative} – FP: {outcomeCounts.falsePositive}
        – FN: {outcomeCounts.falseNegative}
      </p>

      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "12px" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "4px" }}>Title</th>
            <th style={{ border: "1px solid #ccc", padding: "4px" }}>Predicted</th>
            <th style={{ border: "1px solid #ccc", padding: "4px" }}>True</th>
            <th style={{ border: "1px solid #ccc", padding: "4px" }}>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map(({ post, predictedLabel, trueLabel, outcome }) => {
            const bgColor =
              outcome === "falsePositive"
                ? "#fff2cc"
                : outcome === "falseNegative"
                ? "#fddede"
                : "#e9fce9";
            return (
              <React.Fragment key={post._id}>
                <tr
                  style={{ backgroundColor: bgColor, cursor: "pointer" }}
                  onClick={() => setExpandedId((id) => (id === post._id ? null : post._id))}
                >
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{post.title}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{predictedLabel}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{trueLabel}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{outcome}</td>
                </tr>
                {expandedId === post._id && (
                  <tr>
                    <td colSpan={4} style={{ border: "1px solid #ccc", padding: "4px", whiteSpace: "pre-wrap" }}>
                      <strong>Author:</strong> {post.user.displayName}
                      {"\n\n"}
                      <strong>Karma:</strong> {post.user.karma}
                      {"\n\n"}
                      <strong>Created at:</strong> {post.user.createdAt}
                      {"\n\n"}
                      <strong>Reason:</strong> {post.reason}
                      {"\n\n"}
                      <strong>Content:</strong>
                      {"\n"}
                      {post.contents.markdown.slice(0, 1500)}
                      {post.contents.markdown.length > 1500 ? "…" : ""}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

declare global {
  interface ComponentTypes {
    ModerationResults: typeof ModerationResults;
  }
}

registerComponent("ModerationResults", ModerationResults);

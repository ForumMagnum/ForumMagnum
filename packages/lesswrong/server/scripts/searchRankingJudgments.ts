import type { EvaluationTarget } from "./searchRankingEvaluationData";

export interface RelevanceJudgment extends EvaluationTarget { grade: number; rationale: string }
export interface JudgedSearch {
  query: string;
  assessor: string;
  intent: string;
  judgments: RelevanceJudgment[];
  preferences: {preferred: EvaluationTarget; over: EvaluationTarget; rationale: string}[];
}

/**
 * Explicit exploratory content judgments, 2026-09-10, from indexed public text.
 * These are agent judgments for review, not labels inferred from click counts.
 * The biology essay has 28 karma in development; it is not a 300-karma example.
 */
export const judgedSearches: JudgedSearch[] = [{
  query: "lab automation",
  assessor: "Codex, public indexed text inspection, 2026-09-10",
  intent: "Useful writing about automating biological laboratory work",
  judgments: [
    {index: "posts", objectID: "FLApaycSw7gwf5vo3", grade: 3, rationale: "Discusses laboratory business bottlenecks, robotics, pipetting, the limitations of automation, and remote instrument access. Substantive biological-lab match despite an indirect title; indexed karma28."},
    {index: "posts", objectID: "ygFc4caQ6Nws62dSW", grade: 1, rationale: "Bioinfohazards discusses lab automation as a risk factor and distributed laboratory workflows, but is primarily about biological information hazards."},
    {index: "posts", objectID: "CceeaaArnQDjJqxq4", grade: 1, rationale: "Grant announcement explicitly includes scientific/lab automation, but contains limited technical content and an expired application deadline."},
    {index: "posts", objectID: "N2r9EayvsWJmLBZuF", grade: 0, rationale: "AI Lab Watch is a safety scorecard for AI companies, not biological laboratory automation; no automation discussion in indexed text. Indexed karma225."},
    {index: "posts", objectID: "2Gy9tfjmKwkYbF9BY", grade: 0, rationale: "Automation collapse concerns automated AI safety research and empirical validation, not laboratory equipment or biological workflows."},
    {index: "posts", objectID: "YTZAmJKydD5hdRSeG", grade: 0, rationale: "An AI escape and deployment-governance thought experiment; lab and automate refer to an AI organization automating intellectual work."},
    {index: "posts", objectID: "HBxe6wdjxK239zajf", grade: 0, rationale: "What failure looks like discusses AI alignment failure scenarios and automated institutions, not laboratory automation."},
    {index: "posts", objectID: "uFNgRumrDTpBfQGrs", grade: 0, rationale: "Discusses slowing down AI progress, not biological lab automation."},
    {index: "posts", objectID: "xLDwCemt5qvchzgHd", grade: 0, rationale: "Speculative AI progress narrative in which an AI lab automates AI research; different sense of lab automation."},
    {index: "posts", objectID: "KzXptMbuDsYLrppss", grade: 0, rationale: "Software engineering automation bottlenecks; different domain from biological laboratory automation."},
  ],
  preferences: [
    {preferred: {index: "posts", objectID: "FLApaycSw7gwf5vo3"}, over: {index: "posts", objectID: "N2r9EayvsWJmLBZuF"}, rationale: "Relevant 28-karma body content should beat a 225-karma title using lab in the AI-company sense."},
    {preferred: {index: "posts", objectID: "FLApaycSw7gwf5vo3"}, over: {index: "posts", objectID: "2Gy9tfjmKwkYbF9BY"}, rationale: "Substantive biological-lab content should beat an automation title about a different domain."},
  ],
}];

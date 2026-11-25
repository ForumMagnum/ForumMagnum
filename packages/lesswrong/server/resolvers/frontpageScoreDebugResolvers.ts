import gql from "graphql-tag";
import keyBy from "lodash/keyBy";
import type { FilterSettings } from "@/lib/filterSettings";
import { filteredScoreExpr, getFilteredScoreFormula, getRequestVisitorActivity, type FilteredScoreFormula } from "@/lib/collections/posts/views";
import { postAgeInHoursExpr, timeDecayExpr } from "@/lib/scoring";
import { getWithCustomLoader } from "@/lib/loaders";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";

export const frontpageScoreDebugGraphQLTypeDefs = gql`
  type FrontpageScoreTerm {
    label: String!
    value: Float!
  }
  type FrontpagePostScoreBreakdown {
    filteredScore: Float!
    additiveTerms: [FrontpageScoreTerm!]!
    multiplicativeTerms: [FrontpageScoreTerm!]!
    ageHours: Float!
    ageOffsetHours: Float!
    decayExponent: Float!
    decayDivisor: Float!
    activityFactor: Float
  }
  extend type Query {
    FrontpagePostScoreBreakdown(postId: String!, filterSettings: JSON!, activityFactorOverride: Float): FrontpagePostScoreBreakdown
  }
`;

interface ScoreTermValue {
  label: string
  value: number
}

interface FrontpagePostScoreBreakdown {
  filteredScore: number
  additiveTerms: ScoreTermValue[]
  multiplicativeTerms: ScoreTermValue[]
  ageHours: number
  ageOffsetHours: number
  decayExponent: number
  decayDivisor: number
  activityFactor: number|null
}

interface ScoreBreakdownRow extends DbPost {
  [syntheticField: string]: unknown
}

const additiveTermField = (index: number) => `scoreDebugAdditive${index}`;
const multiplicativeTermField = (index: number) => `scoreDebugMultiplicative${index}`;

function getScoreBreakdownSyntheticFields(formula: FilteredScoreFormula) {
  return {
    filteredScore: filteredScoreExpr(formula),
    scoreDebugAgeHours: postAgeInHoursExpr(),
    scoreDebugDecayDivisor: timeDecayExpr(formula.timeDecay),
    ...Object.fromEntries(formula.additiveTerms.map((term, i) => [additiveTermField(i), term.expr])),
    ...Object.fromEntries(formula.multiplicativeTerms.map((term, i) => [multiplicativeTermField(i), term.expr])),
  };
}

function getNumericField(row: ScoreBreakdownRow, field: string): number {
  const value = Number(row[field]);
  if (!Number.isFinite(value)) {
    throw new Error(`Score breakdown field ${field} for post ${row._id} is not a finite number: ${row[field]}`);
  }
  return value;
}

function rowToScoreBreakdown(row: ScoreBreakdownRow, formula: FilteredScoreFormula): FrontpagePostScoreBreakdown {
  return {
    filteredScore: getNumericField(row, "filteredScore"),
    additiveTerms: formula.additiveTerms.map(({ label }, i) => ({ label, value: getNumericField(row, additiveTermField(i)) })),
    multiplicativeTerms: formula.multiplicativeTerms.map(({ label }, i) => ({ label, value: getNumericField(row, multiplicativeTermField(i)) })),
    ageHours: getNumericField(row, "scoreDebugAgeHours"),
    ageOffsetHours: formula.timeDecay.ageOffsetHours,
    decayExponent: formula.timeDecay.exponent,
    decayDivisor: getNumericField(row, "scoreDebugDecayDivisor"),
    activityFactor: formula.timeDecay.activityFactor,
  };
}

async function getScoreBreakdowns(
  postIds: readonly string[],
  filterSettings: FilterSettings,
  activityFactorOverride: number|null,
  context: ResolverContext,
): Promise<(FrontpagePostScoreBreakdown|null)[]> {
  const visitorActivity = await getRequestVisitorActivity(context);
  const formula = getFilteredScoreFormula(
    filterSettings,
    { view: "magic", algoActivityFactor: activityFactorOverride ?? undefined },
    visitorActivity,
    context,
  );
  const rows: ScoreBreakdownRow[] = await context.Posts.aggregate([
    { $match: { _id: { $in: postIds } } },
    { $addFields: getScoreBreakdownSyntheticFields(formula) },
  ]).toArray();

  const visiblePosts = await accessFilterMultiple(context.currentUser, "Posts", rows, context);
  const visiblePostIds = new Set(visiblePosts.map(post => post._id));
  const visibleRowsById = keyBy(rows.filter(row => visiblePostIds.has(row._id)), row => row._id);

  return postIds.map(postId => {
    const row = visibleRowsById[postId];
    return row ? rowToScoreBreakdown(row, formula) : null;
  });
}

export const frontpageScoreDebugGraphQLQueries = {
  async FrontpagePostScoreBreakdown(
    _root: void,
    { postId, filterSettings, activityFactorOverride }: { postId: string, filterSettings: FilterSettings, activityFactorOverride: number|null },
    context: ResolverContext,
  ): Promise<FrontpagePostScoreBreakdown|null> {
    const loaderName = `FrontpagePostScoreBreakdown:${JSON.stringify([filterSettings, activityFactorOverride])}`;
    return await getWithCustomLoader(context, loaderName, postId,
      (postIds: readonly string[]) => getScoreBreakdowns(postIds, filterSettings, activityFactorOverride, context)
    );
  },
};

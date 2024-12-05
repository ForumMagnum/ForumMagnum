import { addGraphQLSchema } from '@/lib/vulcan-lib/graphql';
import { resolverOnlyField } from '../../utils/schemaUtils';

interface ArbitalLinkedPagesFieldOptions {
  collectionName: string;
}

addGraphQLSchema(`
  type ArbitalLinkedPages {
    faster: [Tag]
    slower: [Tag]
    moreTechnical: [Tag]
    lessTechnical: [Tag]
    requirements: [Tag]
    teaches: [Tag]
  }
`);

export function arbitalLinkedPagesField(options: ArbitalLinkedPagesFieldOptions) {
  const { collectionName } = options;

  return resolverOnlyField({
    type: 'ArbitalLinkedPages',
    canRead: ['guests'],
    resolver: async (doc: any, args: void, context: ResolverContext) => {
      // Check if the document is an Arbital import
      if (!doc.legacyData?.arbitalPageId) {
        return null;
      }

      const { Tags, ArbitalTagContentRels } = context;

      const docId = doc._id;

      // Step 1: Get faster and slower tag IDs
      const fasterSlowerTags = await Tags.find(
        { slug: { $in: ['low-speed-explanation', 'high-speed-explanation'] } },
        { projection: { _id: 1, slug: 1 } }
      ).fetch();

      const slowerTag = fasterSlowerTags.find((t) => t.slug === 'low-speed-explanation');
      const fasterTag = fasterSlowerTags.find((t) => t.slug === 'high-speed-explanation');

      const slowerTagId = slowerTag?._id;
      const fasterTagId = fasterTag?._id;

      // Step 2: Get page speeds
      let pageSpeeds: DbArbitalTagContentRel[] = [];
      if (slowerTagId || fasterTagId) {
        pageSpeeds = await ArbitalTagContentRels.find(
          {
            type: 'parent-is-tag-of-child',
            parentTagId: { $in: [slowerTagId, fasterTagId].filter((id) => id) },
          },
          { projection: { childTagId: 1, parentTagId: 1 } }
        ).fetch();
      }

      const tagSpeeds: Record<string, number> = {};
      pageSpeeds.forEach((rel) => {
        const speed = rel.parentTagId === slowerTagId ? -1 : 1;
        tagSpeeds[rel.childTagId] = speed;
      });

      // Step 3: Get subject pairs where the doc is involved
      const st1 = await ArbitalTagContentRels.find(
        {
          type: 'parent-taught-by-child',
          isStrong: true,
          childTagId: docId,
        },
        { projection: { parentTagId: 1, level: 1 } }
      ).fetch();

      const parentIds = st1.map((rel) => rel.parentTagId);

      const st2 = await ArbitalTagContentRels.find(
        {
          type: 'parent-taught-by-child',
          isStrong: true,
          parentTagId: { $in: parentIds },
          childTagId: { $ne: docId },
        },
        { projection: { parentTagId: 1, childTagId: 1, level: 1 } }
      ).fetch();

      // Build pairs of tags sharing the same parentTagId
      const subjectPairs = [];
      for (const rel1 of st1) {
        for (const rel2 of st2) {
          if (rel1.parentTagId === rel2.parentTagId) {
            subjectPairs.push({
              sourceTagId: rel1.childTagId,
              alternativeTagId: rel2.childTagId,
              level1: rel1.level,
              level2: rel2.level,
            });
          }
        }
      }

      // Remove duplicates
      const uniquePairs: Record<string, typeof subjectPairs[0]> = {};
      subjectPairs.forEach((pair) => {
        const key = `${pair.sourceTagId}-${pair.alternativeTagId}`;
        if (!uniquePairs[key]) {
          uniquePairs[key] = pair;
        }
      });
      const uniqueSubjectPairs = Object.values(uniquePairs);

      // Step 4: Compute alternatives
      const alternatives = uniqueSubjectPairs.map((pair) => {
        const speed1 = tagSpeeds[pair.sourceTagId] || 0;
        const speed2 = tagSpeeds[pair.alternativeTagId] || 0;

        return {
          ...pair,
          speed1,
          speed2,
        };
      });

      // Step 5: Compute computed alternatives
      const computedAlternatives = alternatives.map((alt) => {
        const isSourceDoc = alt.sourceTagId === docId;

        const otherTagId = isSourceDoc ? alt.alternativeTagId : alt.sourceTagId;
        const otherLevel = isSourceDoc ? alt.level2 : alt.level1;
        const currentLevel = isSourceDoc ? alt.level1 : alt.level2;
        const otherSpeed = isSourceDoc ? alt.speed2 : alt.speed1;
        const currentSpeed = isSourceDoc ? alt.speed1 : alt.speed2;

        return {
          otherTagId,
          otherLevel,
          currentLevel,
          otherSpeed,
          currentSpeed,
        };
      });

      // Step 6: Determine alternative types
      const alternativeResults = computedAlternatives
        .map((alt) => {
          let alternativeType: string | null = null;

          if (alt.otherLevel && alt.currentLevel && alt.otherLevel > alt.currentLevel) {
            alternativeType = 'moreTechnical';
          } else if (alt.otherLevel && alt.currentLevel && alt.otherLevel < alt.currentLevel) {
            alternativeType = 'lessTechnical';
          } else if (alt.otherSpeed > alt.currentSpeed) {
            alternativeType = 'faster';
          } else if (alt.otherSpeed < alt.currentSpeed) {
            alternativeType = 'slower';
          }

          return alternativeType
            ? {
                otherTagId: alt.otherTagId,
                alternativeType,
              }
            : null;
        })
        .filter((alt) => alt !== null) as { otherTagId: string; alternativeType: string }[];

      // Step 7: Group tags by alternative type
      const alternativeTypeMap: Record<string, string[]> = {
        faster: [],
        slower: [],
        moreTechnical: [],
        lessTechnical: [],
      };

      alternativeResults.forEach((alt) => {
        if (alternativeTypeMap[alt.alternativeType]) {
          alternativeTypeMap[alt.alternativeType].push(alt.otherTagId);
        }
      });

      // Helper function to fetch tags by IDs
      async function getTagsByIds(ids: string[]) {
        if (ids.length === 0) return [];
        const tags = await Tags.find(
          { _id: { $in: ids } },
          { projection: { _id: 1, name: 1, slug: 1 } }
        ).fetch();
        return tags;
      }

      // Step 9: Fetch requirements
      const requirementsRels = await ArbitalTagContentRels.find(
        {
          parentTagId: docId,
          type: 'parent-requires-child',
          isStrong: true,
        },
        { projection: { childTagId: 1 } }
      ).fetch();

      const requirementTagIds = requirementsRels.map((rel) => rel.childTagId);

      // Step 10: Fetch teachings
      const teachesRels = await ArbitalTagContentRels.find(
        {
          childTagId: docId,
          type: 'parent-taught-by-child',
          isStrong: true,
        },
        { projection: { parentTagId: 1 } }
      ).fetch();

      const teachesTagIds = teachesRels.map((rel) => rel.parentTagId);

      // Collect all unique tag IDs
      const allTagIds = new Set<string>([
        ...alternativeTypeMap.faster,
        ...alternativeTypeMap.slower,
        ...alternativeTypeMap.moreTechnical,
        ...alternativeTypeMap.lessTechnical,
        ...requirementTagIds,
        ...teachesTagIds,
      ]);

      const allTagsArray = await getTagsByIds(Array.from(allTagIds));
      const allTags = new Map(allTagsArray.map(tag => [tag._id, tag]));

      // Build arrays of tags for each category
      const fasterTags = alternativeTypeMap.faster.map(id => allTags.get(id)).filter(Boolean);
      const slowerTags = alternativeTypeMap.slower.map(id => allTags.get(id)).filter(Boolean);
      const moreTechnicalTags = alternativeTypeMap.moreTechnical.map(id => allTags.get(id)).filter(Boolean);
      const lessTechnicalTags = alternativeTypeMap.lessTechnical.map(id => allTags.get(id)).filter(Boolean);
      const requirementsTags = requirementTagIds.map(id => allTags.get(id)).filter(Boolean);
      const teachesTags = teachesTagIds.map(id => allTags.get(id)).filter(Boolean);

      // Return the ArbitalLinkedPages object
      return {
        faster: fasterTags,
        slower: slowerTags,
        moreTechnical: moreTechnicalTags,
        lessTechnical: lessTechnicalTags,
        requirements: requirementsTags,
        teaches: teachesTags,
      };
    },
    sqlResolver: ({ field }) => {
      const docId = field('_id');

      return `
      WITH doc_check AS (
        SELECT "legacyData"->>'arbitalPageId' IS NOT NULL AS is_arbital
        FROM "${collectionName}"
        WHERE _id = ${docId}
      )
      SELECT
        CASE 
          WHEN (SELECT is_arbital FROM doc_check) THEN (
            WITH faster_slower_tags AS (
              SELECT
                _id,
                slug,
                CASE
                  WHEN slug = 'low-speed-explanation' THEN 'slower'
                  WHEN slug = 'high-speed-explanation' THEN 'faster'
                  ELSE NULL
                END AS speed_type
              FROM "Tags"
              WHERE slug IN ('low-speed-explanation', 'high-speed-explanation')
            ),
            page_speeds AS (
              SELECT
                "childTagId" AS tagId,
                CASE
                  WHEN "parentTagId" = (SELECT _id FROM faster_slower_tags WHERE speed_type = 'slower') THEN -1
                  WHEN "parentTagId" = (SELECT _id FROM faster_slower_tags WHERE speed_type = 'faster') THEN 1
                  ELSE 0
                END AS speed
              FROM "ArbitalTagContentRels"
              WHERE "type" = 'parent-is-tag-of-child'
                AND "parentTagId" IN (SELECT _id FROM faster_slower_tags)
            ),
            subject_pairs AS (
              SELECT DISTINCT
                st1."childTagId" AS sourceTagId,
                st2."childTagId" AS alternativeTagId,
                st1."level" AS level1,
                st2."level" AS level2
              FROM "ArbitalTagContentRels" st1
              JOIN "ArbitalTagContentRels" st2 ON st1."parentTagId" = st2."parentTagId"
                AND st1."childTagId" != st2."childTagId"
              WHERE st1."type" = 'parent-taught-by-child'
                AND st2."type" = 'parent-taught-by-child'
                AND st1."isStrong" = TRUE
                AND st2."isStrong" = TRUE
                AND (st1."childTagId" = ${docId} OR st2."childTagId" = ${docId})
            ),
            alternatives AS (
              SELECT
                sp.*,
                COALESCE(ps1.speed, 0) AS speed1,
                COALESCE(ps2.speed, 0) AS speed2
              FROM subject_pairs sp
              LEFT JOIN page_speeds ps1 ON ps1.tagId = sp.sourceTagId
              LEFT JOIN page_speeds ps2 ON ps2.tagId = sp.alternativeTagId
            ),
            computed_alternatives AS (
              SELECT
                CASE
                  WHEN sourceTagId = ${docId} THEN alternativeTagId
                  ELSE sourceTagId
                END AS otherTagId,
                CASE
                  WHEN sourceTagId = ${docId} THEN level2
                  ELSE level1
                END AS otherLevel,
                CASE
                  WHEN sourceTagId = ${docId} THEN level1
                  ELSE level2
                END AS currentLevel,
                CASE
                  WHEN sourceTagId = ${docId} THEN speed2
                  ELSE speed1
                END AS otherSpeed,
                CASE
                  WHEN sourceTagId = ${docId} THEN speed1
                  ELSE speed2
                END AS currentSpeed
              FROM alternatives
            ),
            alternative_results AS (
              SELECT
                otherTagId,
                CASE
                  WHEN otherLevel > currentLevel THEN 'moreTechnical'
                  WHEN otherLevel < currentLevel THEN 'lessTechnical'
                  WHEN otherSpeed > currentSpeed THEN 'faster'
                  WHEN otherSpeed < currentSpeed THEN 'slower'
                  ELSE NULL
                END AS alternativeType
              FROM computed_alternatives
              WHERE (otherLevel != currentLevel) OR (otherSpeed != currentSpeed)
            ),
            requirements AS (
              SELECT
                "childTagId" AS otherTagId
              FROM "ArbitalTagContentRels"
              WHERE "parentTagId" = ${docId}
                AND "type" = 'parent-requires-child'
                AND "isStrong" = TRUE
            ),
            teachings AS (
              SELECT
                "parentTagId" AS otherTagId
              FROM "ArbitalTagContentRels"
              WHERE "childTagId" = ${docId}
                AND "type" = 'parent-taught-by-child'
                AND "isStrong" = TRUE
            )
            SELECT json_build_object(
              'faster', COALESCE(
                (SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
                 FROM alternative_results ar JOIN "Tags" t ON t._id = ar.otherTagId WHERE ar.alternativeType = 'faster'), '[]'::json),
              'slower', COALESCE(
                (SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
                 FROM alternative_results ar JOIN "Tags" t ON t._id = ar.otherTagId WHERE ar.alternativeType = 'slower'), '[]'::json),
              'moreTechnical', COALESCE(
                (SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
                 FROM alternative_results ar JOIN "Tags" t ON t._id = ar.otherTagId WHERE ar.alternativeType = 'moreTechnical'), '[]'::json),
              'lessTechnical', COALESCE(
                (SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
                 FROM alternative_results ar JOIN "Tags" t ON t._id = ar.otherTagId WHERE ar.alternativeType = 'lessTechnical'), '[]'::json),
              'requirements', COALESCE(
                (SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
                 FROM requirements req JOIN "Tags" t ON t._id = req.otherTagId), '[]'::json),
              'teaches', COALESCE(
                (SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
                 FROM teachings teach JOIN "Tags" t ON t._id = teach.otherTagId), '[]'::json)
            ) AS "arbitalLinkedPages";
          )
          ELSE NULL
        END AS "arbitalLinkedPages";
      `;
    },
  });
} 
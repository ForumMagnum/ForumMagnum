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
    graphQLtype: 'ArbitalLinkedPages',
    canRead: ['guests'],
    resolver: async (doc: any, args: void, context: ResolverContext) => {
      // Check if the document is an Arbital import
      if (!doc.legacyData?.arbitalPageId) {
        return null;
      }
      
      if (collectionName === 'MultiDocuments' && doc.fieldName !== 'description') {
        return null;
      }

      const { Tags, ArbitalTagContentRels, MultiDocuments } = context;

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
            parentDocumentId: { $in: [slowerTagId, fasterTagId].filter((id) => id) },
          },
          { projection: { childDocumentId: 1, parentDocumentId: 1 } }
        ).fetch();
      }

      const tagSpeeds: Record<string, number> = {};
      pageSpeeds.forEach((rel) => {
        const speed = rel.parentDocumentId === slowerTagId ? -1 : 1;
        tagSpeeds[rel.childDocumentId] = speed;
      });

      // Step 3: Get subject pairs where the doc is involved
      const st1 = await ArbitalTagContentRels.find(
        {
          type: 'parent-taught-by-child',
          isStrong: true,
          childDocumentId: docId,
        },
        { projection: { parentDocumentId: 1, level: 1 } }
      ).fetch();

      const parentIds = st1.map((rel) => rel.parentDocumentId);

      const st2 = await ArbitalTagContentRels.find(
        {
          type: 'parent-taught-by-child',
          isStrong: true,
          parentDocumentId: { $in: parentIds },
          childDocumentId: { $ne: docId },
        },
        { projection: { parentDocumentId: 1, childDocumentId: 1, level: 1 } }
      ).fetch();

      // Build pairs of tags sharing the same parentDocumentId
      const subjectPairs = [];
      for (const rel1 of st1) {
        for (const rel2 of st2) {
          if (rel1.parentDocumentId === rel2.parentDocumentId) {
            subjectPairs.push({
              sourceTagId: rel1.childDocumentId,
              alternativeTagId: rel2.childDocumentId,
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
      async function getDocumentsByIds(ids: string[]) {

        if (ids.length === 0) return [];

        const tags = await Tags.find(
          { _id: { $in: ids } },
          { projection: { _id: 1, name: 1, slug: 1 } }
        ).fetch();

        /*
        We want to return a record that looks like this when the id is "vK7taEyLQXxuN3FBj", confirming fieldName is "description":
        {
          _id: "vK7taEyLQXxuN3FBj",
          parentDocumentId: "Ka9CrdPZZvJn8veED",
          collectionName: "Tags",
          fieldName: "description",
        }
        */

        //do the same for MultiDocuments
        const multiDocs = await MultiDocuments.find(
          { _id: { $in: ids }, fieldName: 'description' },
          { projection: { parentDocumentId: 1, title: 1, slug: 1 } }
        ).fetch();

        //make new objects with the name field instead of title
        const multiDocsWithName = multiDocs.map((doc) => ({
          _id: doc.parentDocumentId,
          name: doc.title,
          slug: doc.slug,
        }));

        return [...tags, ...multiDocsWithName];
      }

      // Step 9: Fetch requirements
      const requirementsRels = await ArbitalTagContentRels.find(
        {
          childDocumentId: docId,
          type: 'parent-is-requirement-of-child',
          isStrong: true,
        },
        { projection: { parentDocumentId: 1 } }
      ).fetch();

      // console.log({
      //   // remove html fields
      //   document: {
      //     _id: doc._id,
      //     legacyData: doc.legacyData,
      //     slug: doc.slug,
      //     oldSlugs: doc.oldSlugs,
      //     name: doc.name,
      //   },
      //   requirementsRels,
      // });

      const requirementDocumentIds = requirementsRels.map((rel) => rel.parentDocumentId);

      // Step 10: Fetch teachings
      const teachesRels = await ArbitalTagContentRels.find(
        {
          childDocumentId: docId,
          type: 'parent-taught-by-child',
          isStrong: true,
        },
        { projection: { parentDocumentId: 1 } }
      ).fetch();


      const teachesDocumentIds = teachesRels.map((rel) => rel.parentDocumentId);

      // Collect all unique tag IDs
      const allDocumentIds = new Set<string>([
        // ...alternativeTypeMap.faster,
        // ...alternativeTypeMap.slower,
        // ...alternativeTypeMap.moreTechnical,
        // ...alternativeTypeMap.lessTechnical,
        ...requirementDocumentIds,
        // ...teachesDocumentIds,
      ]);

      const allDocumentsArray = await getDocumentsByIds(Array.from(allDocumentIds));
      const allDocuments = new Map(allDocumentsArray.map(doc => [doc._id, doc]));

      // Build arrays of tags for each category
      const fasterDocuments = alternativeTypeMap.faster.map(id => allDocuments.get(id)).filter(Boolean);
      const slowerDocuments = alternativeTypeMap.slower.map(id => allDocuments.get(id)).filter(Boolean);
      const moreTechnicalDocuments = alternativeTypeMap.moreTechnical.map(id => allDocuments.get(id)).filter(Boolean);
      const lessTechnicalDocuments = alternativeTypeMap.lessTechnical.map(id => allDocuments.get(id)).filter(Boolean);
      const requirementsDocuments = requirementDocumentIds.map(id => allDocuments.get(id)).filter(Boolean);
      const teachesDocuments = teachesDocumentIds.map(id => allDocuments.get(id)).filter(Boolean);

      console.log({
        document: {
          _id: doc._id,
          legacyData: doc.legacyData,
          slug: doc.slug,
          oldSlugs: doc.oldSlugs,
          name: doc.name,
        },
        requirementsRels,
        requirementDocumentIds,
        allDocumentIds,
        allDocuments,

        // fasterDocuments,
        // slowerDocuments,
        // moreTechnicalDocuments,
        // lessTechnicalDocuments,
        requirementsDocuments,
        // teachesDocuments,
      })

      // Return the ArbitalLinkedPages object
      return {
        faster: fasterDocuments,
        slower: slowerDocuments,
        moreTechnical: moreTechnicalDocuments,
        lessTechnical: lessTechnicalDocuments,
        requirements: requirementsDocuments,
        teaches: teachesDocuments,
      };
    },
    // sqlResolver: ({ field }) => {
    //   const docId = field('_id');
    //   // TODO: somehow skip when document is not an Arbital import
    //   return `(
    //   WITH faster_slower_tags AS (
    //     SELECT
    //       _id,
    //       slug,
    //       CASE
    //         WHEN slug = 'low-speed-explanation' THEN 'slower'
    //         WHEN slug = 'high-speed-explanation' THEN 'faster'
    //         ELSE NULL
    //       END AS speed_type
    //     FROM "Tags"
    //     WHERE slug IN ('low-speed-explanation', 'high-speed-explanation')
    //   ),
    //   page_speeds AS (
    //     SELECT
    //       "childTagId" AS tagId,
    //       CASE
    //         WHEN "parentTagId" = (SELECT _id FROM faster_slower_tags WHERE speed_type = 'slower') THEN -1
    //         WHEN "parentTagId" = (SELECT _id FROM faster_slower_tags WHERE speed_type = 'faster') THEN 1
    //         ELSE 0
    //       END AS speed
    //     FROM "ArbitalTagContentRels"
    //     WHERE "type" = 'parent-is-tag-of-child'
    //       AND "parentTagId" IN (SELECT _id FROM faster_slower_tags)
    //   ),
    //   st1 AS (
    //     SELECT
    //       "parentTagId",
    //       "level"
    //     FROM "ArbitalTagContentRels"
    //     WHERE "type" = 'parent-taught-by-child'
    //       AND "isStrong" = TRUE
    //       AND "childTagId" = ${docId}
    //   ),
    //   st2 AS (
    //     SELECT
    //       "parentTagId",
    //       "childTagId",
    //       "level"
    //     FROM "ArbitalTagContentRels"
    //     WHERE "type" = 'parent-taught-by-child'
    //       AND "isStrong" = TRUE
    //       AND "parentTagId" IN (SELECT "parentTagId" FROM st1)
    //       AND "childTagId" != ${docId}
    //   ),
    //   subject_pairs AS (
    //     SELECT DISTINCT
    //       ${docId} AS sourceTagId,
    //       st2."childTagId" AS alternativeTagId,
    //       st1."level" AS level1,
    //       st2."level" AS level2
    //     FROM st1
    //     JOIN st2 ON st1."parentTagId" = st2."parentTagId"
    //   ),
    //   alternatives AS (
    //     SELECT
    //       sp.*,
    //       COALESCE(ps1.speed, 0) AS speed1,
    //       COALESCE(ps2.speed, 0) AS speed2
    //     FROM subject_pairs sp
    //     LEFT JOIN page_speeds ps1 ON ps1.tagId = sp.sourceTagId
    //     LEFT JOIN page_speeds ps2 ON ps2.tagId = sp.alternativeTagId
    //   ),
    //   computed_alternatives AS (
    //     SELECT
    //       sp.alternativeTagId AS otherTagId,
    //       sp.level2 AS otherLevel,
    //       sp.level1 AS currentLevel,
    //       sp.speed2 AS otherSpeed,
    //       sp.speed1 AS currentSpeed
    //     FROM alternatives sp
    //   ),
    //   alternative_results AS (
    //     SELECT
    //       otherTagId,
    //       CASE
    //         WHEN otherLevel > currentLevel THEN 'moreTechnical'
    //         WHEN otherLevel < currentLevel THEN 'lessTechnical'
    //         WHEN otherSpeed > currentSpeed THEN 'faster'
    //         WHEN otherSpeed < currentSpeed THEN 'slower'
    //         ELSE NULL
    //       END AS alternativeType
    //     FROM computed_alternatives
    //     WHERE (otherLevel IS NOT NULL AND currentLevel IS NOT NULL AND otherLevel != currentLevel)
    //        OR (otherSpeed != currentSpeed)
    //   ),
    //   requirements AS (
    //     SELECT
    //       "parentTagId" AS otherTagId
    //     FROM "ArbitalTagContentRels"
    //     WHERE "childTagId" = ${docId}
    //       AND "type" = 'parent-is-requirement-of-child'
    //       AND "isStrong" = TRUE
    //   ),
    //   teachings AS (
    //     SELECT
    //       "parentTagId" AS otherTagId
    //     FROM "ArbitalTagContentRels"
    //     WHERE "childTagId" = ${docId}
    //       AND "type" = 'parent-taught-by-child'
    //       AND "isStrong" = TRUE
    //   )
    //   SELECT json_build_object(
    //     'faster', COALESCE(
    //       (
    //         SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
    //         FROM alternative_results ar
    //         JOIN "Tags" t ON t._id = ar.otherTagId
    //         WHERE ar.alternativeType = 'faster'
    //       ),
    //       '[]'::json
    //     ),
    //     'slower', COALESCE(
    //       (
    //         SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
    //         FROM alternative_results ar
    //         JOIN "Tags" t ON t._id = ar.otherTagId
    //         WHERE ar.alternativeType = 'slower'
    //       ),
    //       '[]'::json
    //     ),
    //     'moreTechnical', COALESCE(
    //       (
    //         SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
    //         FROM alternative_results ar
    //         JOIN "Tags" t ON t._id = ar.otherTagId
    //         WHERE ar.alternativeType = 'moreTechnical'
    //       ),
    //       '[]'::json
    //     ),
    //     'lessTechnical', COALESCE(
    //       (
    //         SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
    //         FROM alternative_results ar
    //         JOIN "Tags" t ON t._id = ar.otherTagId
    //         WHERE ar.alternativeType = 'lessTechnical'
    //       ),
    //       '[]'::json
    //     ),
    //     'requirements', COALESCE(
    //       (
    //         SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
    //         FROM requirements req
    //         JOIN "Tags" t ON t._id = req.otherTagId
    //       ),
    //       '[]'::json
    //     ),
    //     'teaches', COALESCE(
    //       (
    //         SELECT json_agg(json_build_object('_id', t._id, 'name', t.name, 'slug', t.slug))
    //         FROM teachings teach
    //         JOIN "Tags" t ON t._id = teach.otherTagId
    //       ),
    //       '[]'::json
    //     )
    //   )
    // // )`;
    // },
  });
} 

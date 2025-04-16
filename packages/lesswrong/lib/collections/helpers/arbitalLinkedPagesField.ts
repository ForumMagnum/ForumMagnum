import { getWithCustomLoader } from '@/lib/loaders';
import range from 'lodash/range';
import gql from 'graphql-tag';

interface ArbitalLinkedPagesFieldOptions<N extends CollectionNameString> {
  collectionName: N;
}

export const graphqlTypeDefs = gql`
  type ArbitalLinkedPage {
    _id: String!
    name: String!
    slug: String!
  }
  type ArbitalLinkedPages {
    faster: [ArbitalLinkedPage]
    slower: [ArbitalLinkedPage]
    moreTechnical: [ArbitalLinkedPage]
    lessTechnical: [ArbitalLinkedPage]
    requirements: [ArbitalLinkedPage]
    teaches: [ArbitalLinkedPage]
    parents: [ArbitalLinkedPage]
    children: [ArbitalLinkedPage]
  }
`;

export function getArbitalLinkedPagesFieldResolver<N extends CollectionNameString>(options: ArbitalLinkedPagesFieldOptions<N>) {
  const { collectionName } = options;

  return async function arbitalLinkedPagesFieldResolver(doc: any, _args: void, context: ResolverContext) {
    // Check if the document is an Arbital import
    if (!doc.legacyData?.arbitalPageId) {
      return null;
    }
    
    if (collectionName === 'MultiDocuments' && doc.fieldName !== 'description') {
      return null;
    }

    const { Tags, ArbitalTagContentRels, MultiDocuments, repos } = context;

    const docId = doc._id;

    // Step 1: Get the faster and slower tags along with all the tags that have a speed.
    // This is using a dumb hack with a custom loader to avoid running the query once for each document
    // fetched that has this field in the fragment.
    const fasterSlowerTags = await getWithCustomLoader(
      context,
      'fasterSlowerTags',
      'fixed-id',
      async (ids) => {
        const tags = await repos.tags.getTagSpeeds();
        return range(ids.length).map(() => tags);
      }
    )

    // Step 2: Build a map of tag ids to speeds
    const tagSpeeds: Record<string, number> = {};

    fasterSlowerTags.find((t) => t.slug === 'low-speed-explanation')?.tagIdsWithSpeed.forEach((id) => {
      tagSpeeds[id] = -1;
    });

    fasterSlowerTags.find((t) => t.slug === 'high-speed-explanation')?.tagIdsWithSpeed.forEach((id) => {
      tagSpeeds[id] = 1;
    });

    // Step 3: Get subject pairs where the doc is involved
    const subjectSiblingRelationships = await repos.tags.getTagSubjectSiblingRelationships(docId);

    // Build pairs of tags sharing the same parentDocumentId
    const subjectPairs = [];

    for (const subjectWithRelationships of subjectSiblingRelationships) {
      for (const relationship of subjectWithRelationships.relationships) {
        subjectPairs.push({
          sourceTagId: subjectWithRelationships.subjectTagId,
          alternativeTagId: relationship.tagId,
          level1: subjectWithRelationships.level,
          level2: relationship.level,
        });
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

      const [tags, multiDocs] = await Promise.all([
        Tags.find(
          { _id: { $in: ids } },
          undefined,
          { _id: 1, name: 1, slug: 1 }
        ).fetch(),
        MultiDocuments.find(
          { _id: { $in: ids }, fieldName: 'description' },
          undefined,
          { _id: 1, parentDocumentId: 1, title: 1, slug: 1 }
        ).fetch(),
      ]);

      //make new objects with the name field instead of title
      const multiDocsWithName = multiDocs.map((doc) => ({
        _id: doc._id,
        name: doc.title,
        slug: doc.slug,
      }));

      return [...tags, ...multiDocsWithName];
    }

    // Get requirement, subject, parent, and child relationships
    const [combinedParentRels, childRels] = await Promise.all([
      ArbitalTagContentRels.find(
        {
          childDocumentId: docId,
          type: { $in: [
            'parent-is-requirement-of-child',
            'parent-taught-by-child',
            'parent-is-parent-of-child'
          ]},
        },
        { projection: { parentDocumentId: 1, type: 1 } }
      ).fetch(),
      ArbitalTagContentRels.find(
        {
          parentDocumentId: docId,
          type: 'parent-is-parent-of-child',
        },
        { projection: { childDocumentId: 1 } }
      ).fetch()
    ]);

    // Separate the combined results by type
    const requirementsRels = combinedParentRels.filter(rel => rel.type === 'parent-is-requirement-of-child');
    const teachesRels = combinedParentRels.filter(rel => rel.type === 'parent-taught-by-child');
    const parentRels = combinedParentRels.filter(rel => rel.type === 'parent-is-parent-of-child');

    const requirementDocumentIds = requirementsRels.map(rel => rel.parentDocumentId);
    const teachesDocumentIds = teachesRels.map(rel => rel.parentDocumentId);
    const parentDocumentIds = parentRels.map(rel => rel.parentDocumentId);
    const childDocumentIds = childRels.map(rel => rel.childDocumentId);

    // Collect all unique tag IDs
    const allDocumentIds = new Set<string>([
      ...alternativeTypeMap.faster,
      ...alternativeTypeMap.slower,
      ...alternativeTypeMap.moreTechnical,
      ...alternativeTypeMap.lessTechnical,
      ...requirementDocumentIds,
      ...teachesDocumentIds,
      ...parentDocumentIds,
      ...childDocumentIds,
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
    const parentsDocuments = parentDocumentIds.map(id => allDocuments.get(id)).filter(Boolean);
    const childrenDocuments = childDocumentIds.map(id => allDocuments.get(id)).filter(Boolean);

    // Return the ArbitalLinkedPages object
    return {
      faster: fasterDocuments,
      slower: slowerDocuments,
      moreTechnical: moreTechnicalDocuments,
      lessTechnical: lessTechnicalDocuments,
      requirements: requirementsDocuments,
      teaches: teachesDocuments,
      parents: parentsDocuments,
      children: childrenDocuments,
    };
  }
}

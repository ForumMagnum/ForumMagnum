import React from 'react';
import SequencesPage from "./SequencesPage";
import { runQuery } from '@/server/vulcan-lib/query';
import Error404 from '../common/Error404';
import { gql } from '@/lib/generated/gql-codegen';
import { getResolverContextForServerComponent } from '@/server/pageMetadata/sharedMetadata';

const SequencesSingleQuery = gql(`
  query SequencesSingleQuery($idOrSlug: String!) {
    sequence(input: { selector: { idOrSlug: $idOrSlug } }, allowNull: true) {
      result {
        _id slug pageUrlRelative
      }
    }
  }
`);

export type SearchParamsForSequencePage = Record<string, string>;

export default async function SequencesSingle({idOrSlug, searchParams, redirectBehavior}: {
  idOrSlug: string,
  searchParams: Promise<SearchParamsForSequencePage>,
  redirectBehavior: "redirectToCanonical" | "noRedirect"
}) {
  const resolverContext = await getResolverContextForServerComponent(await searchParams);

  const { data } = await runQuery(SequencesSingleQuery, { idOrSlug }, resolverContext);
  const sequence = data?.sequence?.result;

  if (!sequence) {
    return <Error404 />
  }

  const canonicalUrl = sequence.pageUrlRelative;
  return <SequencesPage documentId={sequence._id} redirectBehavior={redirectBehavior ?? "redirectToCanonical"} canonicalUrl={canonicalUrl} />
};


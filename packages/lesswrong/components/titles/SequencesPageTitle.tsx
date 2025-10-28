"use client";

import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import { headerSubtitleStyles } from '../common/HeaderSubtitle';
import { Helmet } from '@/components/layout/Helmet';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { useStyles } from '../hooks/useStyles';

const SequencesPageTitleFragmentQuery = gql(`
  query SequencesPageTitle($documentId: String) {
    sequence(input: { selector: { documentId: $documentId } }, allowNull: true) {
      result {
        ...SequencesPageTitleFragment
      }
    }
  }
`);

export const SequencesPageTitle = ({isSubtitle, siteName}: {
  isSubtitle: boolean,
  siteName: string,
}) => {
  const classes = useStyles(headerSubtitleStyles);

  const { params: {_id} } = useLocation();
  
  const { loading, data } = useQuery(SequencesPageTitleFragmentQuery, {
    variables: { documentId: _id },
    fetchPolicy: 'cache-first',
  });
  const sequence = data?.sequence?.result;
  
  if (!sequence || loading) return null;
  const titleString = `${sequence.title} - ${siteName}`
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to={getCollectionOrSequenceUrl(sequence)}>
        {sequence.canonicalCollection?.title ?? sequence.title}
      </Link>
    </span>);
  } else {
    return <Helmet name="title">
      <title>{titleString}</title>
      <meta property='og:title' content={titleString}/>
    </Helmet>
  }
  
  // TODO: An earlier implementation of this had a special case for the core
  // collections. That special case didn't work, but maybe it's worth building
  // a version that does.
}


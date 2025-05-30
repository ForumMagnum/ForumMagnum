import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import { styles } from '../common/HeaderSubtitle';
import { Helmet } from '../common/Helmet';
import { defineStyles, useStyles } from '../hooks/useStyles';

const titleComponentStyles = defineStyles('SequencesPageTitle', styles);

export const SequencesPageTitle = ({isSubtitle, siteName}: {
  isSubtitle: boolean,
  siteName: string,
}) => {
  const classes = useStyles(titleComponentStyles);

  const { params: {_id} } = useLocation();
  
  const { document: sequence, loading } = useSingle({
    documentId: _id,
    collectionName: "Sequences",
    fragmentName: "SequencesPageTitleFragment",
    fetchPolicy: 'cache-only',
  });
  
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


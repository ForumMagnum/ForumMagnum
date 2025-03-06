import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import { styles } from '../common/HeaderSubtitle';
import { Helmet } from '../../lib/utils/componentsWithChildren';

const SequencesPageTitle = ({isSubtitle, siteName, classes}: {
  isSubtitle: boolean,
  siteName: string,
  classes: ClassesType<typeof styles>,
}) => {
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
    return <Helmet>
      <title>{titleString}</title>
      <meta property='og:title' content={titleString}/>
    </Helmet>
  }
  
  // TODO: An earlier implementation of this had a special case for the core
  // collections. That special case didn't work, but maybe it's worth building
  // a version that does.
}

const SequencesPageTitleComponent = registerComponent("SequencesPageTitle", SequencesPageTitle, {styles});

declare global {
  interface ComponentTypes {
    SequencesPageTitle: typeof SequencesPageTitleComponent
  }
}

export default SequencesPageTitleComponent;



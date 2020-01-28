import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import Sequences from '../../lib/collections/sequences/collection';
import { Helmet } from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../common/HeaderSubtitle';

const SequencesPageTitle = ({isSubtitle, siteName, classes}) => {
  const { params: {_id} } = useLocation();
  
  const { document: sequence, loading } = useSingle({
    documentId: _id,
    collection: Sequences,
    fragmentName: "SequencesPageFragment",
    fetchPolicy: 'cache-only',
    ssr: true,
  });
  
  if (!sequence || loading) return null;
  const titleString = `${sequence.title} - ${siteName}`
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to={Sequences.getPageUrl(sequence, false)}>
        {sequence.title}
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
registerComponent("SequencesPageTitle", SequencesPageTitle,
  withStyles(styles, {name: "SequencesPageTitle"})
);

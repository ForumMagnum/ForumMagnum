import React from 'react';
import { registerComponent, withDocument } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper';
import mapProps from 'recompose/mapProps';
import { withLocation } from '../../lib/routeUtil';
import Sequences from '../../lib/collections/sequences/collection.js';
import { Helmet } from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../common/HeaderSubtitle';

const SequencesPageTitle = ({location, isSubtitle, siteName, loading, document, classes}) => {
  if (!document || loading) return null;
  const sequence = document;
  
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to={Sequences.getPageUrl(sequence, false)}>
        {sequence.title}
      </Link>
    </span>);
  } else {
    return <Helmet><title>{`${sequence.title} - ${siteName}`}</title></Helmet>
  }
  
  // TODO: An earlier implementation of this had a special case for the core
  // collections. That special case didn't work, but maybe it's worth building
  // a version that does.
}
registerComponent("SequencesPageTitle", SequencesPageTitle,
  withLocation,
  mapProps((props) => {
    const {location} = props;
    const {params: {_id}} = location;
    return {
      documentId: _id,
      ...props
    }
  }),
  [withDocument, {
    collection: Sequences,
    fragmentName: "SequencesPageFragment",
    ssr: true,
  }],
  withStyles(styles, {name: "SequencesPageTitle"})
);

import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { useLocation } from '../../lib/routeUtil.js';
import getHeaderSubtitleData from '../../lib/modules/utils/getHeaderSubtitleData';
import { withApollo } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import { Link } from 'react-router-dom';

const styles = theme => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: 'uppercase',
    borderLeft: `1px solid ${grey[400]}`,
  },
});

const HeaderSubtitle = ({client, classes}) => {
  const { currentRoute, query, params } = useLocation({ subscribe: true });
  const { subtitleText = currentRoute?.title || "", subtitleLink = "" } = getHeaderSubtitleData(currentRoute?.name, query, params, client) || {};
  
  if (!subtitleLink)
    return null;
  
  return <span className={classes.subtitle}>
    <Link to={subtitleLink} className={classes.titleLink}>
      {subtitleText}
    </Link>
  </span>
}

registerComponent("HeaderSubtitle", HeaderSubtitle,
  withApollo,
  withStyles(styles, {name: "HeaderSubtitle"})
);
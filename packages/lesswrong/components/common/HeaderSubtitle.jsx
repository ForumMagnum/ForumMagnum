import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useSubscribedLocation } from '../../lib/routeUtil.js';
import { withApollo } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import { Link } from '../../lib/reactRouterWrapper';

export const styles = theme => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: 'uppercase',
    borderLeft: `1px solid ${grey[400]}`,
  },
});

const HeaderSubtitle = ({client, classes}) => {
  const { currentRoute } = useSubscribedLocation();
  if (!currentRoute) return null
  const SubtitleComponent = currentRoute.subtitleComponentName ? Components[currentRoute.subtitleComponentName] : null;
  const subtitleString = currentRoute.subtitle;
  const subtitleLink = currentRoute.subtitleLink;
  
  if (!SubtitleComponent && !subtitleString)
    return null;
  
  if (SubtitleComponent) {
    return <SubtitleComponent isSubtitle={true} />
  } else if (subtitleLink) {
    return <span className={classes.subtitle}>
      <Link to={subtitleLink}>{subtitleString}</Link>
    </span>
  } else if (subtitleString) {
    return <span className={classes.subtitle}>
      {subtitleString}
    </span>
  } else {
    return null;
  }
}

registerComponent("HeaderSubtitle", HeaderSubtitle,
  withApollo,
  withStyles(styles, {name: "HeaderSubtitle"})
);
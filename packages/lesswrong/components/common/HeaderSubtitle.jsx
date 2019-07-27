import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useSubscribedLocation } from '../../lib/routeUtil.js';
import { withApollo } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import { Link } from '../../lib/reactRouterWrapper';

const styles = theme => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: 'uppercase',
    borderLeft: `1px solid ${grey[400]}`,
  },
});

const HeaderSubtitle = ({client, classes}) => {
  const { currentRoute } = useSubscribedLocation();
  const SubtitleComponent = currentRoute.subtitleComponentName ? Components[currentRoute.subtitleComponentName] : null;
  const subtitleString = currentRoute.subtitle;
  const subtitleLink = currentRoute.subtitleLink;
  
  if (!SubtitleComponent && !subtitleString)
    return null;
  
  return <span className={classes.subtitle}>
    { SubtitleComponent
      ? <SubtitleComponent isSubtitle={true} />
      : (subtitleLink
        ? <Link to={subtitleLink}>{subtitleString}</Link>
        : {subtitleString}
      )
    }
  </span>
}

registerComponent("HeaderSubtitle", HeaderSubtitle,
  withApollo,
  withStyles(styles, {name: "HeaderSubtitle"})
);
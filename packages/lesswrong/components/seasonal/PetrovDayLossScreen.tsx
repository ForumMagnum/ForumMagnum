import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Link } from '../../lib/reactRouterWrapper';

// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100vh",
    zIndex: theme.zIndexes.petrovDayLoss,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "black url('../mushroomCloud.jpg') no-repeat fixed center",
    ...theme.typography.commentStyle
  },
  link: {
    textShadow: "0 0 15 rgba(0,0,0,.2)",
    color: "white"
  },
  title: {
    color: "white",
    marginBottom: theme.spacing.unit*5
  }
})

const PetrovDayLossScreen = ({classes}) => {
  return (
    <div className={classes.root}>
      <Typography variant="display3" className={classes.title}>
        <Link to={"/posts/QtyKq4BDyuJ3tysoK/9-26-is-petrov-day"}>Petrov Day</Link>
      </Typography>
      <Link className={classes.link} to={"/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019"}>What happened?</Link>
    </div>
  )
}

const PetrovDayLossScreenComponent = registerComponent('PetrovDayLossScreen', PetrovDayLossScreen, {styles});

declare global {
  interface ComponentTypes {
    PetrovDayLossScreen: typeof PetrovDayLossScreenComponent
  }
}


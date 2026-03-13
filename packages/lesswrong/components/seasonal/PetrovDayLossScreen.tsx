import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { petrovPostIdSetting } from '@/lib/instanceSettings';
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const styles = defineStyles('PetrovDayLossScreen', (theme: ThemeType) => ({
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
    marginBottom: 40
  }
}), { allowNonThemeColors: true })

const PetrovDayLossScreen = () => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <Typography variant="display3" className={classes.title}>
        <Link to={"/posts/QtyKq4BDyuJ3tysoK/9-26-is-petrov-day"}>Petrov Day</Link>
      </Typography>
      <Link className={classes.link} to={"/posts/" + petrovPostIdSetting.get()}>What happened?</Link>
    </div>
  )
}

export default PetrovDayLossScreen;


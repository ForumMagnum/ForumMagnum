import React from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import CloudinaryImage2 from "@/components/common/CloudinaryImage2";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { Link } from "@/lib/reactRouterWrapper";

const styles = defineStyles("PetrovStoryMobileBanner", (theme: ThemeType) => ({
  root: {
    display: "none",
    [theme.breakpoints.down(1400)]: {
      display: "block",
    },
  },
  link: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    height: 200,
    position: "relative",
    zIndex: 1,
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-end",
      marginTop: -20,
      height: 380,
    },
  },
  title: {
    ...theme.typography.headerStyle,
    textTransform: "uppercase",
    fontSize: 52,
    marginBottom: -20,
    [theme.breakpoints.down('sm')]: {
      marginBottom: -12,
      fontSize: 42,
    },
  },
  subtitle: {
    ...theme.typography.headerStyle,
    fontSize: 24,
    marginBottom: -10,
    [theme.breakpoints.down('sm')]: {
      fontSize: 20,
    },
  },
  imageColumn: {
    position: "fixed",
    top: 0,
    left: 0,
    right: -100,
    bottom: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "right",
    opacity: 0.5,
  },
}));

export default function PetrovStoryMobileBanner() {
  const classes = useStyles(styles);
  return <div className={classes.root}>
    <SingleColumnSection> 
      <Link to="/petrov/ceremony" className={classes.link}>
        <h1 className={classes.title}>Petrov Day</h1>
        <h1 className={classes.subtitle}>The Day the World Nearly Ended</h1>
      </Link>
    </SingleColumnSection>
    <div className={classes.imageColumn}>
      <CloudinaryImage2 
        loading="lazy"
        className={classes.image}
        publicId="petrovBig_cblm82"
        darkPublicId={"petrovBig_cblm82"}
      />
    </div>
  </div>
}
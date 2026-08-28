import React from 'react';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { CoreReadingCollection } from './LWCoreReading';
import { Typography } from "../common/Typography";
import LinkCard from "../common/LinkCard";
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const IMAGE_WIDTH = 42; // percent of the card covered by the image, on desktop

const styles = defineStyles('LibraryCollectionCard', (theme: ThemeType) => ({
  root: {
    position: "relative",
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    boxShadow: theme.palette.boxShadow.default,
    overflow: "hidden",
    height: "100%",
    transition: "box-shadow .2s ease",
    "&:hover": {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    },
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 2,
  },
  imageWrapper: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: `${IMAGE_WIDTH}%`,
    "& img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center right",
      display: "block",
    },
    // Fade the image into the card background so text stays readable
    "&:after": {
      content: "''",
      position: "absolute",
      top: 0,
      left: 0,
      width: "60%",
      height: "100%",
      background: `linear-gradient(to right, ${theme.palette.panelBackground.default}, transparent)`,
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      "&:after": {
        width: "100%",
        background: `linear-gradient(to right, ${theme.palette.panelBackground.default} 30%, ${theme.palette.panelBackground.translucent3})`,
      },
    },
  },
  content: {
    position: "relative",
    zIndex: 1,
    padding: "18px 20px 16px 22px",
    maxWidth: `${100 - IMAGE_WIDTH + 14}%`,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    [theme.breakpoints.down('xs')]: {
      maxWidth: "100%",
      paddingRight: 16,
    },
  },
  title: {
    ...theme.typography.headerStyle,
    ...theme.typography.smallCaps,
    fontSize: 22,
    lineHeight: 1.2,
    "& a:hover": {
      color: "inherit",
      textDecoration: "none",
    },
  },
  subtitle: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    fontStyle: "italic",
    color: theme.palette.text.dim,
    marginTop: 2,
  },
  description: {
    marginTop: 10,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    lineHeight: "1.55rem",
    '& p': {
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    '& p:first-child': {
      marginTop: 0,
    },
    '& p:last-child': {
      marginBottom: 0,
    },
  },
  large: {
    "& $title": {
      fontSize: 26,
    },
  },
}));

const LibraryCollectionCard = ({collection, large}: {
  collection: CoreReadingCollection,
  large?: boolean,
}) => {
  const classes = useStyles(styles);

  return <div className={classNames(classes.root, {[classes.large]: large})}>
    <LinkCard to={collection.url}>
      <div className={classes.accentBar} style={{background: collection.color}}/>
      {collection.imageUrl && <div className={classes.imageWrapper}>
        <img src={collection.imageUrl} alt="" loading="lazy"/>
      </div>}
      <div className={classes.content}>
        <Typography variant="title" className={classes.title}>
          <Link to={collection.url}>{collection.title}</Link>
        </Typography>
        {collection.subtitle && <div className={classes.subtitle}>
          {collection.subtitle}
        </div>}
        <ContentStyles contentType="postHighlight" className={classes.description}>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: collection.summary}}
            description={`collection ${collection.id}`}
          />
        </ContentStyles>
      </div>
    </LinkCard>
  </div>;
};

export default LibraryCollectionCard;

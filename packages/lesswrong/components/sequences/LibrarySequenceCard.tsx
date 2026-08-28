import React from 'react';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import { makeCloudinaryImageUrl } from '../common/cloudinaryHelpers';
import { defaultSequenceBannerIdSetting, isLWorAF } from '../../lib/instanceSettings';
import UsersName from "../users/UsersName";
import LinkCard from "../common/LinkCard";
import SequencesSummary from "./SequencesSummary";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LibrarySequenceCard', (theme: ThemeType) => ({
  root: {
    ...theme.typography.postStyle,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    boxShadow: theme.palette.boxShadow.default,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    transition: "box-shadow .2s ease",
    "&:hover": {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
      color: theme.palette.text.normal,
    },
    "&:hover $image img": {
      transform: "scale(1.04)",
    },
  },
  image: {
    height: 110,
    overflow: "hidden",
    backgroundColor: theme.palette.grey[200],
    position: "relative",
    "& img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      transition: "transform .3s ease",
    },
    [theme.breakpoints.down('xs')]: {
      height: 130,
    },
  },
  content: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    padding: "12px 14px 10px 14px",
  },
  title: {
    ...theme.typography.headerStyle,
    ...theme.typography.smallCaps,
    fontSize: 17,
    lineHeight: 1.25,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: 3,
    "&:hover": {
      color: "inherit",
      textDecoration: "none",
    },
  },
  draft: {
    textTransform: "uppercase",
    color: theme.palette.text.sequenceIsDraft,
  },
  author: {
    ...theme.typography.body2,
    color: theme.palette.text.dim,
    fontSize: "1.05rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  meta: {
    ...theme.typography.commentStyle,
    marginTop: "auto",
    paddingTop: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    color: theme.palette.grey[500],
    fontSize: "0.95rem",
  },
  readProgress: {
    color: theme.palette.primary.main,
  },
  progressTrack: {
    height: 3,
    marginTop: 6,
    borderRadius: 2,
    background: theme.palette.grey[200],
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    background: theme.palette.primary.light,
  },
}));

const LibrarySequenceCard = ({sequence, showAuthor=false}: {
  sequence: SequencesPageFragment,
  showAuthor?: boolean,
}) => {
  const classes = useStyles(styles);

  let imageId: string|null = sequence.gridImageId;
  if (!imageId) {
    // LW falls back to a specific image. Other sites fall back first to the
    // sequence banner image, and otherwise to their own site-specific image
    imageId = isLWorAF() ? "sequences/vnyzzznenju0hzdv6pqb.jpg" : (sequence.bannerImageId || defaultSequenceBannerIdSetting.get());
  }
  const imageUrl = imageId && makeCloudinaryImageUrl(imageId, {
    c: "fill",
    dpr: "2",
    g: "custom",
    h: "220",
    w: "500",
    q: "auto",
  });

  const postsCount = sequence.postsCount;
  const readPostsCount = sequence.readPostsCount;
  const showProgress = readPostsCount > 0 && postsCount > 0;

  return <LinkCard
    className={classes.root}
    to={getCollectionOrSequenceUrl(sequence)}
    tooltip={<SequencesSummary sequence={sequence} showAuthor={showAuthor}/>}
  >
    <div className={classes.image}>
      {imageUrl && <img src={imageUrl} alt="" loading="lazy"/>}
    </div>
    <div className={classes.content}>
      <div className={classes.title}>
        {sequence.draft && <span className={classes.draft}>[Draft] </span>}
        {sequence.title}
      </div>
      {showAuthor && sequence.user && <div className={classes.author}>
        by <UsersName user={sequence.user}/>
      </div>}
      <div className={classes.meta}>
        <span>{postsCount} {postsCount === 1 ? "post" : "posts"}</span>
        {showProgress && <span className={classes.readProgress}>
          {readPostsCount >= postsCount ? "Finished" : `${readPostsCount} read`}
        </span>}
      </div>
      {showProgress && <div className={classes.progressTrack}>
        <div
          className={classes.progressFill}
          style={{width: `${Math.min(100, Math.round(100 * readPostsCount / postsCount))}%`}}
        />
      </div>}
    </div>
  </LinkCard>;
};

export default LibrarySequenceCard;

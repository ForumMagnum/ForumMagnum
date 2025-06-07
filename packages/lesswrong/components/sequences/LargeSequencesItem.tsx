import React, { useState } from 'react';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import UsersName from "../users/UsersName";
import ContentStyles from "../common/ContentStyles";
import SequencesSmallPostLink from "./SequencesSmallPostLink";
import ContentItemTruncated from "../common/ContentItemTruncated";
import LWTooltip from "../common/LWTooltip";
import ChapterTitle from "./ChapterTitle";

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: 40,
    marginBottom: 40,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    width: "100%",
    overflow: "hidden",
    position: "relative"
  },
  text: {
    padding: 16,
    position: "relative",
    maxWidth: 600,
    marginTop: 90,
    marginBottom: 30,
    [theme.breakpoints.down('xs')]: {
      marginTop: 60,
      marginBottom: 0
    },
  },
  titleAndAuthor: {
    marginBottom: 12
  },
  title: {
    ...theme.typography.display0,
    ...theme.typography.postStyle,
    marginTop: 0,
    marginBottom: 2,
    ...theme.typography.smallCaps,
    color: theme.palette.grey[900],
    display: "block",
    textShadow: `0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}`,
    '&:hover': {
      opacity: 1,
      color: theme.palette.grey[600],
    }
  },
  eaTitle: {
    fontFamily: theme.typography.fontFamily,
    lineHeight: '1.4em',
    fontWeight: 600
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    marginBottom: 12
  },
  eaDescription: {
    fontSize: "1rem",
  },
  author: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.text.dim,
    fontStyle: "italic"
  },
  sequenceImage: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 125,
    width: "45%",
    opacity: .85,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },

    // Overlay a white-to-transparent gradient over the image
    "&:after": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      background: `linear-gradient(to top, ${theme.palette.panelBackground.default} 0%, ${theme.palette.panelBackground.translucent4} 50%, transparent 100%)`,
    }
  },
  sequenceImageImg: {
    width: "100%",
    height: 125,
    objectFit: "cover"
  },
  chapterTitle: {
    fontSize: `${isFriendlyUI ? "1.2rem" : "1.25rem"} !important`,
    margin: "8px 0 -8px 0 !important",
  },
  postIcon: {
    height: 12,
    width: 12,
    marginRight: 4,
    color: theme.palette.grey[500]
  },
  postTitle: {
    ...theme.typography.commentStyle,
    display: "block"
  },
  columns: {
    display: "flex",
    [theme.breakpoints.down('xs')]: {
      flexDirection: "column",
    }
  },
  left: {
    width: "45%",
    display: "flex",
    flexDirection: "column",
    justifyContent: isFriendlyUI ? "flex-start" : "center",
    maxHeight: 600,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      justifyContent: "flex-start"
    }
  },
  right: {
    width: "55%",
    padding: 20,
    paddingLeft: 40,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      paddingLeft: 16,
      paddingTop: 0
    }
  },
  wordcount: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[500],
    fontSize: "1rem"
  },
  imageLink: {
    '&:hover': {
      opacity: 1
    }
  }
});

export const LargeSequencesItem = ({sequence, showAuthor=false, showChapters=false, classes}: {
  sequence: SequencesPageWithChaptersFragment,
  showAuthor?: boolean,
  showChapters?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false)

  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()


  const posts = sequence.chapters.flatMap(chapter => chapter.posts)
  const [
    totalWordCount,
    totalReadTime,
  ] = posts.reduce(([wordCount, readTime], curr) => ([
    wordCount + (curr?.contents?.wordCount ?? 0),
    readTime + (curr?.readTimeMinutes ?? 0),
  ]), [0, 0]);

  const highlight = sequence.contents?.htmlHighlight || ""

  return <div className={classes.root} id={sequence._id}>

    <div className={classes.columns}>
      <div className={classes.left}>
        <Link className={classes.imageLink} to={`/s/${sequence._id}`}>
          <div className={classes.sequenceImage}>
            <img className={classes.sequenceImageImg}
              src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
                sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"
              }`}
              />
          </div>
        </Link>
        <div className={classes.text}>
          <div className={classes.titleAndAuthor}>
            <Link
              to={`/s/${sequence._id}`}
              className={classNames(classes.title, {[classes.eaTitle]: isFriendlyUI})}
            >
              {sequence.title}
            </Link>
          { showAuthor && sequence.user &&
            <div className={classes.author}>
              by <UsersName user={sequence.user} />
            </div>}
          </div>
          {(highlight.length > 0) && <ContentStyles
            contentType="postHighlight"
            className={classNames(classes.description, {[classes.eaDescription]: isFriendlyUI})}
          >
            <ContentItemTruncated
              maxLengthWords={100}
              graceWords={20}
              rawWordCount={sequence.contents?.wordCount || 0}
              expanded={expanded}
              getTruncatedSuffix={() => null}
              dangerouslySetInnerHTML={{__html: highlight}}
              description={`sequence ${sequence._id}`}
            />
          </ContentStyles>}
          <LWTooltip title={<div> ({totalWordCount.toLocaleString("en-US")} words)</div>}>
            <div className={classes.wordcount}>{totalReadTime} min read</div>
          </LWTooltip>
        </div>
      </div>
      <div className={classes.right}>
        {sequence.chapters.flatMap(({posts, title}, index) =>
          <React.Fragment key={index}>
            {title && <ChapterTitle title={title}/>}
            {posts.map((post) => (
              <SequencesSmallPostLink
                key={sequence._id + post._id}
                post={post}
                sequenceId={sequence._id}
              />
            ))}
          </React.Fragment>
        )}
      </div>
    </div>
  </div>
}

export default registerComponent('LargeSequencesItem', LargeSequencesItem, {styles});




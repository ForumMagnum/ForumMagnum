import { Components, registerComponent, } from '../../lib/vulcan-lib';
import NoSSR from 'react-no-ssr';
import React from 'react';
import { legacyBreakpoints } from '../../lib/utils/theme';
import classNames from 'classnames';
import Card from '@material-ui/core/Card';
import { postBodyStyles } from '../../themes/stylePiping';
import { POST_PREVIEW_WIDTH } from '../posts/PostsPreviewTooltip';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.postStyle,
    // width: "calc(33% - 5px)",
    boxShadow: theme.boxShadow,
    paddingBottom: 0,
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",

    "&:hover": {
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      color: "rgba(0,0,0,0.87)",
    },

    [legacyBreakpoints.maxSmall]: {
      width: "335px !important",
    },
    [legacyBreakpoints.maxTiny]: {
      width: "100% !important",
    },
  },

  previewCard: {
    ...postBodyStyles(theme),
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    width: POST_PREVIEW_WIDTH,
    padding: 12,
  },

  title: {
    fontSize: 16,
    lineHeight: 1.0,
    maxHeight: 32,
    paddingTop: 2,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    textOverflow: "ellipsis",
    overflow: "hidden",
    fontVariant: "small-caps",
    marginBottom: 0,
    "&:hover": {
      color: "inherit",
      textDecoration: "none",
    }
  },

  draft: {
    textTransform: "uppercase",
    color: "rgba(100, 169, 105, 0.9)",
  },

  author: {
    color: "rgba(0,0,0,0.5)",
  },

  meta: {
    paddingLeft: 12,
    paddingTop: 10,
    paddingRight: 8,
    paddingBottom: 5,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "white",
  },
  bookItemShadowStyle: {
    boxShadow: "none",
    '&:hover': {
      boxShadow: "none",
    }
  },
  bookItemContentStyle: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  hiddenAuthor: {
    paddingBottom: 8
  },
  image: {
    backgroundColor: "#eee",
    display: 'block',
    height: 95,
    [legacyBreakpoints.maxSmall]: {
      height: "124px !important",
    },
    "& img": {
      width: "100%",
      height: 95,
      [legacyBreakpoints.maxSmall]: {
        width: "335px !important",
        height: "124px !important",
      },
      [legacyBreakpoints.maxTiny]: {
        width: "100% !important",
      },
    }
  }
})

const SequencesGridItem = ({ sequence, showAuthor=false, classes, bookItemStyle }: {
  sequence: SequencesPageFragment,
  showAuthor?: boolean,
  classes: ClassesType,
  bookItemStyle?: boolean
}) => {
  const getSequenceUrl = () => {
    return '/s/' + sequence._id
  }
  const { LinkCard } = Components;
  const url = getSequenceUrl()

  const tooltipText = sequence.contents?.plaintextDescription?.slice(0, 750)

  return <LinkCard className={classNames(classes.root, {[classes.bookItemContentStyle]:bookItemStyle})} to={url} tooltip={tooltipText && <Card className={classes.previewCard}>
    <h3>{sequence.title}</h3>{tooltipText}</Card>}>
    <div className={classes.image}>
      <NoSSR>
        <Components.CloudinaryImage
          publicId={sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
          height={124}
          width={315}
        />
      </NoSSR>
    </div>
    <div className={classNames(classes.meta, {[classes.hiddenAuthor]:!showAuthor, [classes.bookItemContentStyle]: bookItemStyle})}>
      <div className={classes.title}>
        {sequence.draft && <span className={classes.draft}>[Draft] </span>}
        {sequence.title}
      </div>
      { showAuthor && sequence.user &&
        <div className={classes.author}>
          by <Components.UsersName user={sequence.user} />
        </div>}
    </div>
  </LinkCard>
}

const SequencesGridItemComponent = registerComponent('SequencesGridItem', SequencesGridItem, {styles});

declare global {
  interface ComponentTypes {
    SequencesGridItem: typeof SequencesGridItemComponent
  }
}


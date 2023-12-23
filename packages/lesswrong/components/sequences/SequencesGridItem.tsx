import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { NoSSR } from '../../lib/utils/componentsWithChildren';
import React from 'react';
import { legacyBreakpoints } from '../../lib/utils/theme';
import classNames from 'classnames';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.postStyle,

    boxShadow: theme.palette.boxShadow.default,
    paddingBottom: 0,
    display: "flex",
    flexDirection: "column",

    "&:hover": {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
      color: theme.palette.text.normal,
    },

    [legacyBreakpoints.maxSmall]: {
      width: "335px !important",
    },
    [legacyBreakpoints.maxTiny]: {
      width: "100% !important",
    },
  },

  title: {
    fontSize: 16,
    ...(isFriendlyUI
      ? {
        lineHeight: 1.25,
        maxHeight: 42,
        minHeight: 42,
      }
      : {
        lineHeight: 1.0,
        maxHeight: 32,
      }),
    paddingTop: 2,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    textOverflow: "ellipsis",
    overflow: "hidden",
    ...theme.typography.smallCaps,
    marginBottom: 0,
    "&:hover": {
      color: "inherit",
      textDecoration: "none",
    }
  },

  draft: {
    textTransform: "uppercase",
    color: theme.palette.text.sequenceIsDraft,
  },

  author: {
    color: theme.palette.text.dim,
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
    background: theme.palette.panelBackground.default,
    ...(isFriendlyUI
      ? {
        borderRadius: `0 0 ${theme.borderRadius.small}px ${theme.borderRadius.small}px`,
        fontFamily: theme.palette.fonts.sansSerifStack,
      }
      : {
      }),
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
    backgroundColor: theme.palette.grey[200],
    display: 'block',
    height: 95,
    borderRadius: isFriendlyUI
      ? `${theme.borderRadius.small}px ${theme.borderRadius.small}px 0 0`
      : undefined,
    [legacyBreakpoints.maxSmall]: {
      height: "124px !important",
    },
    "& img": {
      width: "100%",
      height: 95,
      borderRadius: isFriendlyUI
        ? `${theme.borderRadius.small}px ${theme.borderRadius.small}px 0 0`
        : undefined,
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
  const { LinkCard, SequencesHoverOver } = Components;

  // The hoverover is adjusted so that it's title lines up with where the SequencesGridItem title would have been, to avoid seeing the title twice
  let positionAdjustment = -35
  if (showAuthor) positionAdjustment -= 20
  if (sequence.title.length > 26) positionAdjustment -= 17

  return <div className={classNames(classes.root, {[classes.bookItemContentStyle]:bookItemStyle})}>
    <LinkCard to={getCollectionOrSequenceUrl(sequence)} tooltip={<div style={{marginTop:positionAdjustment}}><SequencesHoverOver sequence={sequence} showAuthor={showAuthor}/></div>}>
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
  </div>
}

const SequencesGridItemComponent = registerComponent('SequencesGridItem', SequencesGridItem, {styles});

declare global {
  interface ComponentTypes {
    SequencesGridItem: typeof SequencesGridItemComponent
  }
}


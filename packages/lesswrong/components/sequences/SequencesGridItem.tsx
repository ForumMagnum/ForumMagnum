import React from 'react';
import { legacyBreakpoints } from '../../lib/utils/theme';
import classNames from 'classnames';
import { getCollectionOrSequenceUrl } from '../../lib/collections/sequences/helpers';
import DeferRender from '../common/DeferRender';
import CloudinaryImage from "../common/CloudinaryImage";
import UsersName from "../users/UsersName";
import LinkCard from "../common/LinkCard";
import SequencesSummary from "./SequencesSummary";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SequencesGridItem', (theme: ThemeType) => ({
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
    lineHeight: 1.0,
    maxHeight: 32,
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
    background: theme.palette.panelBackground.default
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
}))

/** The image a sequence's card shows when it has no card image of its own. */
export const DEFAULT_SEQUENCE_CARD_IMAGE_ID = "sequences/vnyzzznenju0hzdv6pqb.jpg";

/**
 * A sequence's card, as shown in the Library grid: its card image, title and
 * (optionally) author, linking to the sequence with a summary on hover.
 * `linked={false}` shows the card without the link and hover summary, and
 * `image` replaces the card image; the sequence editor uses both to let the
 * author set the card image on a preview of the card.
 */
const SequencesGridItem = ({sequence, showAuthor=false, bookItemStyle, linked=true, image}: {
  sequence: SequencesPageFragment,
  showAuthor?: boolean,
  bookItemStyle?: boolean,
  linked?: boolean,
  image?: React.ReactNode,
}) => {
  const classes = useStyles(styles);

  // The hoverover is adjusted so that it's title lines up with where the SequencesGridItem title would have been, to avoid seeing the title twice
  let positionAdjustment = -35
  if (showAuthor) positionAdjustment -= 20
  if (sequence.title.length > 26) positionAdjustment -= 17

  const imageId = sequence.gridImageId || DEFAULT_SEQUENCE_CARD_IMAGE_ID;

  const contents = <>
    <div className={classes.image}>
      {image ?? <DeferRender ssr={false}>
        <CloudinaryImage
          publicId={imageId}
          height={124}
          width={315}
        />
      </DeferRender>}
    </div>
    <div className={classNames(classes.meta, {[classes.hiddenAuthor]:!showAuthor, [classes.bookItemContentStyle]: bookItemStyle})}>
      <div className={classes.title}>
        {sequence.draft && <span className={classes.draft}>[Draft] </span>}
        {sequence.title}
      </div>
      { showAuthor && sequence.user &&
        <div className={classes.author}>
          by <UsersName user={sequence.user} />
        </div>}
    </div>
  </>;

  return <div className={classNames(classes.root, {[classes.bookItemContentStyle]:bookItemStyle})}>
    {linked
      ? <LinkCard to={getCollectionOrSequenceUrl(sequence)} tooltip={
          <div style={{marginTop:positionAdjustment}}>
            <SequencesSummary sequence={sequence} showAuthor={showAuthor}/>
          </div>
        }>
          {contents}
        </LinkCard>
      : contents}
  </div>
}

export default SequencesGridItem;

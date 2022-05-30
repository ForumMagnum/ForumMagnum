import classNames from 'classnames';
import { ContentBlock } from 'draft-js';
import React, { useState } from 'react';
import NoSSR from 'react-no-ssr';
import { truncate } from '../../lib/editor/ellipsize';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    marginBottom: 20,
    background: "white",
    width: "100%",
    overflow: "hidden",
    position: "relative",
    maxHeight: 200
  },
  text: {
    padding: 12,
    position: "relative",
    maxWidth: 600
  },
  title: {
    ...theme.typography.display0,
    ...theme.typography.postStyle,
    marginTop: 0,
    marginBottom: 2,
    fontVariant: "small-caps",
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },
  author: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.text.dim,
    fontStyle: "italic",
    marginBottom: 10
  },
  sequenceImage: {
    position: "absolute",
    top: 0,
    right: 0,
    height: 200,
    width: 220,

    [theme.breakpoints.down('xs')]: {
      marginTop: 0,
      marginBottom: 0,
      position: "absolute",
      overflow: 'hidden',
      right: 0,
      bottom: 0,
      height: "100%",
    },

    // Overlay a white-to-transparent gradient over the image
    "&:after": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      background: `linear-gradient(to right, ${theme.palette.panelBackground.default} 0%, ${theme.palette.panelBackground.translucent2} 50%, transparent 100%)`,
    }
  },
  sequenceImageImg: {
    height: 200,
    width: 240,
    objectFit: "cover",
    [theme.breakpoints.down('xs')]: {
      height: "100%",
      width: 'auto'
    },
  },
});

export const SequencesRowItem = ({sequence, showAuthor=true, classes}: {
  sequence: SequencesPageFragment,
  showAuthor?: boolean,
  classes: ClassesType,
}) => {
  const { UsersName, ContentStyles, ContentItemBody, ContentItemTruncated, LinkCard } = Components
  
  const getSequenceUrl = () => {
    return '/s/' + sequence._id
  }
  const url = getSequenceUrl()
  const [expanded, setExpanded] = useState<boolean>(false)

  const truncatedDescription = truncate(sequence.contents?.htmlHighlight, 50, "words");

  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  return <LinkCard className={classes.root} to={'/s/' + sequence._id}>
      <div className={classes.sequenceImage}>
        <img className={classes.sequenceImageImg}
          src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
            sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"
          }`}
          />
      </div>
      <div className={classes.text}>
        <div className={classes.title}>{sequence.title}</div>
        { showAuthor && sequence.user &&
          <div className={classes.author}>
            by <UsersName user={sequence.user} />
          </div>}
        <ContentStyles contentType="postHighlight" className={classes.description}>
          <ContentItemTruncated
            maxLengthWords={50}
            graceWords={20}
            rawWordCount={sequence.contents?.wordCount || 0}
            expanded={expanded}
            getTruncatedSuffix={() => null}
            dangerouslySetInnerHTML={{__html: sequence.contents?.htmlHighlight || ""}}
            description={`sequence ${sequence._id}`}
          />
          {/* {truncatedDescription && <ContentItemBody dangerouslySetInnerHTML={{__html: truncatedDescription}} description={`sequence ${sequence._id}`}/>} */}
        </ContentStyles>

      </div>
  </LinkCard>
}

const SequencesRowItemComponent = registerComponent('SequencesRowItem', SequencesRowItem, {styles});

declare global {
  interface ComponentTypes {
    SequencesRowItem: typeof SequencesRowItemComponent
  }
}


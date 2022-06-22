import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';

const shadow = theme => `0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}, 0 0 25px ${theme.palette.panelBackground.default}`

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    marginBottom: 40,
    background: theme.palette.panelBackground.default,
    width: "100%",
    overflow: "hidden",
    position: "relative"
  },
  text: {
    padding: 16,
    position: "relative",
    maxWidth: 600,
    marginTop: 60,
    marginBottom: 60,
    [theme.breakpoints.down('xs')]: {
      marginTop: 60,
      marginBottom: 0
    }
  },
  title: {
    ...theme.typography.display0,
    ...theme.typography.postStyle,
    marginTop: 0,
    marginBottom: 2,
    fontVariant: "small-caps",
    color: theme.palette.grey[900],
    textShadow: shadow(theme)
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    textShadow: shadow(theme)
  },
  author: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.text.dim,
    fontStyle: "italic",
    marginBottom: 10,
    textShadow: shadow(theme)
  },
  sequenceImage: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 125,
    width: "calc(50% - 1px)",
    opacity: .6,
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
      background: `linear-gradient(to top, ${theme.palette.panelBackground.default} 0%, ${theme.palette.panelBackground.translucent2} 50%, transparent 100%)`,
    }
  },
  sequenceImageImg: {
    width: "100%",
    height: 125,
    objectFit: "cover"
  },
  postIcon: {
    height: 12,
    width: 12,
    marginRight: 4,
    color: theme.palette.grey[500]
  },
  postTitle: {
    ...theme.typography.smallFont,
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
    width: "50%",
    borderRight: theme.palette.border.faint,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    maxHeight: 600,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      borderRight: "unset",
      justifyContent: "flex-start",
    }
  },
  right: {
    width: "50%",
    background: theme.palette.panelBackground.default,
    padding: 16,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      paddingLeft: 16,
    }
  }
});

export const LargeSequencesItem = ({sequence, showAuthor=true, classes}: {
  sequence: SequencesPageFragment,
  showAuthor?: boolean,
  classes: ClassesType,
}) => {
  const { UsersName, ContentStyles, SequencesSmallPostLink, ContentItemTruncated } = Components
  
  const getSequenceUrl = () => {
    return '/s/' + sequence._id
  }
  const url = getSequenceUrl()
  const [expanded, setExpanded] = useState<boolean>(false)

  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  const { results: chapters } = useMulti({
    terms: {
      view: "SequenceChapters",
      sequenceId: sequence._id,
      limit: 100
    },
    collectionName: "Chapters",
    fragmentName: 'ChaptersFragment',
    enableTotal: false
  });

  return <div className={classes.root} >

    <div className={classes.columns}>
      <div className={classes.left}>
        <div className={classes.sequenceImage}>
          <img className={classes.sequenceImageImg}
            src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
              sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"
            }`}
            />
        </div>
        <div className={classes.text}>
          <Link to={'/s/' + sequence._id} className={classes.title}>{sequence.title}</Link>
          { showAuthor && sequence.user &&
            <div className={classes.author}>
              by <UsersName user={sequence.user} />
            </div>}
          <ContentStyles contentType="postHighlight" className={classes.description}>
            <ContentItemTruncated
              maxLengthWords={100}
              graceWords={20}
              rawWordCount={sequence.contents?.wordCount || 0}
              expanded={expanded}
              getTruncatedSuffix={() => null}
              dangerouslySetInnerHTML={{__html: sequence.contents?.htmlHighlight || ""}}
              description={`sequence ${sequence._id}`}
            />
          </ContentStyles>
        </div>
      </div>
      <div className={classes.right}>
        {chapters?.map((chapter) => <span key={chapter._id}>
            {chapter.posts?.map(post => <SequencesSmallPostLink 
                                          key={chapter._id + post._id} 
                                          post={post}
                                        />
            )}
          </span>
        )}
      </div>
    </div>
  </div>
}

const LargeSequencesItemComponent = registerComponent('LargeSequencesItem', LargeSequencesItem, {styles});

declare global {
  interface ComponentTypes {
    LargeSequencesItem: typeof LargeSequencesItemComponent
  }
}


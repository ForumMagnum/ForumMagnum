import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React, { useState } from 'react';
import {useNewEvents} from '../../../lib/events/withNewEvents';
import { useCurrentUser } from '../../common/withUser';
import { truncatise } from '../../../lib/truncatise';
import Edit from '@material-ui/icons/Edit';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useSingle } from '../../../lib/crud/withSingle';
import Tooltip from '@material-ui/core/Tooltip';
import { useDialog } from '../../common/withDialog'
import withErrorBoundary from '../../common/withErrorBoundary'
import { frontpageGuidelines, defaultGuidelines } from './ForumModerationGuidelinesContent'
import { commentBodyStyles } from '../../../themes/stylePiping'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: theme.spacing.unit*2,
    position:"relative"
  },
  assistance: {
    color: 'rgba(0,0,0,0.6)',
  },
  'easy-going': {
    color: 'rgba(100, 169, 105, 0.9)',
  },
  'norm-enforcing': {
    color: '#2B6A99',
  },
  'reign-of-terror': {
    color: 'rgba(179,90,49,.8)',
  },
  'editButton': {
    cursor: "pointer",
    position: 'absolute',
    right: 16,
    height: '0.8em'
  },
  collapse: {
    display:"flex",
    justifyContent:"flex-end",
    fontSize: 14,
    marginBottom: 4,
  },
  moderationGuidelines: {
    ...commentBodyStyles(theme),
    fontSize: "1.1rem",
    '& p, & ul': {
      marginTop: '.6em',
      marginBottom: '.6em'
    },
    '& li': {
      marginTop: '.4em',
      marginBottom: '.4em'
    }
  }
})

const getModerationGuidelines = (document: PostsList, classes: ClassesType) => {
  const moderationStyle = document.moderationStyle || (document.user?.moderationStyle || "")
  const truncatiseOptions = {
    TruncateLength: 300,
    TruncateBy: "characters",
    Suffix: "... <a>(Read More)</a>",
    Strict: false
  }
  const { html = "" } = document.moderationGuidelines || {}
  const userGuidelines = `${document.user ? `<p><em>${document.user.displayName + "'s commenting guidelines"}</em></p><p class="${classes[moderationStyle]}">${moderationStyleLookup[moderationStyle] || ""}</p>` : ""}
  ${html || ""}`

  const combinedGuidelines = `
    ${(html || moderationStyle) ? userGuidelines : ""}
    ${(html && document.frontpageDate) ? '<hr/>' : ''}
    ${document.frontpageDate ?
        frontpageGuidelines :
          (
            (html || moderationStyle) ?
              "" :
              defaultGuidelines
          )
     }
  `
  const truncatedGuidelines = truncatise(combinedGuidelines, truncatiseOptions)
  return { combinedGuidelines, truncatedGuidelines }
}

const ModerationGuidelinesBox = ({classes, post}: {
  classes: ClassesType,
  post: PostsMinimumInfo,
}) => {
  const {recordEvent} = useNewEvents();
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const [expanded, setExpanded] = useState(false)

  const { document: postWithDetails, loading } = useSingle({
    skip: !post,
    documentId: post?._id,
    collectionName: "Posts",
    fetchPolicy: "cache-first",
    fragmentName: "PostsList",
  });
  
  if (!post)
    return null
  if (loading)
    return <Components.Loading/>

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded(!expanded)
    if (currentUser) {
      const eventProperties = {
        userId: currentUser._id,
        important: false,
        intercom: true,
        documentId: postWithDetails?.userId,
        targetState: !expanded
      };
      recordEvent('toggled-user-moderation-guidelines', false, eventProperties);
    }
  }

  const openEditDialog = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openDialog({
      componentName: "ModerationGuidelinesEditForm",
      componentProps: {
        postId: post._id,
      }
    });
  }
  
  const { combinedGuidelines, truncatedGuidelines } = getModerationGuidelines(postWithDetails, classes)
  const displayedGuidelines = expanded ? combinedGuidelines : truncatedGuidelines

  const expandable = combinedGuidelines.trim().length !== truncatedGuidelines.trim().length

  return (
    <div className={classes.root} onClick={expandable ? handleClick : undefined}>
      { // FIXME: Users.canModeratePost depends on some fields that aren't always
        // reasonable to include in fragments, so on non-post pages the edit button
        // may be missing from moderation guidelines.
        // @ts-ignore
        userCanModeratePost(currentUser, post) &&
        <span onClick={openEditDialog}>
          <Tooltip title="Edit moderation guidelines">
            <Edit className={classes.editButton} />
          </Tooltip>
        </span>
      }
      <div className={classes.moderationGuidelines}>
        <div dangerouslySetInnerHTML={{__html: displayedGuidelines}}/>
        {expanded && expandable && <a className={classes.collapse}>(Click to Collapse)</a>}
      </div>
    </div>
  )
}

const moderationStyleLookup: Partial<Record<string,string>> = {
  'norm-enforcing': "Norm Enforcing - I try to enforce particular rules",
  'reign-of-terror': "Reign of Terror - I delete anything I judge to be counterproductive",
  'easy-going': "Easy Going - I just delete obvious spam and trolling."
}

const ModerationGuidelinesBoxComponent = registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBox, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    ModerationGuidelinesBox: typeof ModerationGuidelinesBoxComponent
  }
}

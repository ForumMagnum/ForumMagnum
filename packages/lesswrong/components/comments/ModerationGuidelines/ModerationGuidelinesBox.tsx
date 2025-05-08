import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import {useNewEvents} from '../../../lib/events/withNewEvents';
import { useCurrentUser } from '../../common/withUser';
import { truncatise } from '../../../lib/truncatise';
import Edit from '@/lib/vendor/@material-ui/icons/src/Edit';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useSingle } from '../../../lib/crud/withSingle';
import { useDialog } from '../../common/withDialog'
import withErrorBoundary from '../../common/withErrorBoundary'
import { frontpageGuidelines, defaultGuidelines } from './ForumModerationGuidelinesContent'
import { userCanModerateSubforum } from '../../../lib/collections/tags/helpers';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import { TooltipSpan } from '@/components/common/FMTooltip';

const styles = (theme: ThemeType) => ({
  root: {
    padding: theme.spacing.unit*2,
    position:"relative"
  },
  assistance: { //UNUSED
    color: theme.palette.text.normal,
  },
  'easy-going': {
    color: theme.palette.text.moderationGuidelinesEasygoing,
  },
  'norm-enforcing': {
    color: theme.palette.text.moderationGuidelinesNormEnforcing,
  },
  'reign-of-terror': {
    color: theme.palette.text.moderationGuidelinesReignOfTerror,
  },
  editButtonWrapper: {
    cursor: "pointer",
    position: 'absolute',
    right: 16,
  },
  editButton: {
    height: '0.8em'
  },
  collapse: {
    display:"flex",
    justifyContent:"flex-end",
    fontSize: 14,
    marginBottom: 4,
  },
  moderationGuidelines: {
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

const truncateGuidelines = (guidelines: string) => {
  return truncatise(guidelines, {
    TruncateLength: 300,
    TruncateBy: "characters",
    Suffix: `... <a>(${preferredHeadingCase("Read More")})</a>`,
    Strict: false
  });
}

const getPostModerationGuidelines = (
  post: PostsModerationGuidelines,
  classes: ClassesType<typeof styles>,
) => {
  const moderationStyle = post.moderationStyle || (post.user?.moderationStyle || "")
  const moderationStyleClass = (classes as AnyBecauseTodo)[moderationStyle];

  const { html = "" } = post.moderationGuidelines || {}
  const userGuidelines = `${post.user ? `<p><em>${post.user.displayName + "'s commenting guidelines"}</em></p><p class="${moderationStyleClass}">${moderationStyleLookup[moderationStyle] || ""}</p>` : ""}
  ${html || ""}`

  const combinedGuidelines = `
    ${(html || moderationStyle) ? userGuidelines : ""}
    ${(html && post.frontpageDate) ? '<hr/>' : ''}
    ${post.frontpageDate ?
        frontpageGuidelines :
          (
            (html || moderationStyle) ?
              "" :
              defaultGuidelines
          )
     }
  `
  const truncatedGuidelines = truncateGuidelines(combinedGuidelines)
  return { combinedGuidelines, truncatedGuidelines }
}

const getSubforumModerationGuidelines = (tag: TagFragment) => {
  const { html } = tag.moderationGuidelines || {}
  const combinedGuidelines = html ?? ''
  const truncatedGuidelines = truncateGuidelines(combinedGuidelines)
  return { combinedGuidelines, truncatedGuidelines }
}

const ModerationGuidelinesBoxInner = ({classes, commentType = "post", documentId}: {
  classes: ClassesType<typeof styles>,
  commentType?: "post" | "subforum",
  documentId: string,
}) => {
  const {recordEvent} = useNewEvents();
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const [expanded, setExpanded] = useState(false)
  const isPost = commentType === "post"

  const { document, loading } = useSingle({
    documentId,
    collectionName: isPost ? "Posts" : "Tags",
    fetchPolicy: "cache-first",
    fragmentName: isPost ? "PostsModerationGuidelines" : "TagFragment",
  });
  const isPostType = (
    document: PostsModerationGuidelines|TagFragment,
  ): document is PostsModerationGuidelines => isPost && !!document;

  if (!document || loading) return null

  const handleClick = (e: React.MouseEvent) => {
    // On click, toggle moderation-guidelines expansion. Event handler is only
    // attached if they're long enough for expand/collapse to be a thing. Note
    // that if the moderation guidelines contain a link, this could also be a
    // link-click, in which case it's important not to preventDefault or
    // stopPropagation.
    
    // Only toggle moderation-guidelines expansion on an unmodified left-click
    // (ie not if this is an open-new-tab on a link)
    if(e.altKey || e.shiftKey || e.ctrlKey || e.metaKey || e.button!==0) {
      return;
    }
    
    setExpanded(!expanded)
    
    if (currentUser) {
      const eventProperties = {
        userId: currentUser._id,
        important: false,
        intercom: true,
        documentId: document?.userId,
        commentType: commentType,
        targetState: !expanded
      };
      recordEvent('toggled-user-moderation-guidelines', false, eventProperties);
    }
  }

  const openEditDialog = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    openDialog({
      name: "ModerationGuidelinesEditForm",
      contents: ({onClose}) => <Components.ModerationGuidelinesEditForm
        onClose={onClose}
        commentType={commentType}
        documentId={documentId}
      />
    });
  }
  
  const { combinedGuidelines, truncatedGuidelines } = isPostType(document) ? getPostModerationGuidelines(document, classes) : getSubforumModerationGuidelines(document)
  const displayedGuidelines = expanded ? combinedGuidelines : truncatedGuidelines

  const expandable = combinedGuidelines.trim().length !== truncatedGuidelines.trim().length

  return (
    <div className={classes.root} onClick={expandable ? handleClick : undefined}>
      {
        !!(isPostType(document) ? userCanModeratePost(currentUser, document) : userCanModerateSubforum(currentUser, document)) &&
        <span onClick={openEditDialog}>
          <TooltipSpan
            title="Edit moderation guidelines"
            className={classes.editButtonWrapper}
          >
            <Edit className={classes.editButton}/>
          </TooltipSpan>
        </span>
      }
      <Components.ContentStyles contentType="comment" className={classes.moderationGuidelines}>
        <div dangerouslySetInnerHTML={{__html: displayedGuidelines}}/>
        {expanded && expandable && <a className={classes.collapse}>(Click to Collapse)</a>}
      </Components.ContentStyles>
    </div>
  )
}

const moderationStyleLookup: Partial<Record<string,string>> = {
  'norm-enforcing': "Norm Enforcing - I try to enforce particular rules",
  'reign-of-terror': "Reign of Terror - I delete anything I judge to be counterproductive",
  'easy-going': "Easy Going - I just delete obvious spam and trolling."
}

export const ModerationGuidelinesBox = registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBoxInner, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    ModerationGuidelinesBox: typeof ModerationGuidelinesBox
  }
}

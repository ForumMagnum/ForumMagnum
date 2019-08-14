import { registerComponent, withDocument } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Posts } from '../../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';
import withNewEvents from '../../../lib/events/withNewEvents.jsx';
import withUser from '../../common/withUser';
import truncatise from 'truncatise';
import Edit from '@material-ui/icons/Edit';
import Users from 'meteor/vulcan:users';
import Tooltip from '@material-ui/core/Tooltip';
import withDialog from '../../common/withDialog'
import withErrorBoundary from '../../common/withErrorBoundary'
import { frontpageGuidelines, defaultGuidelines } from './ForumModerationGuidelinesContent'
import classNames from 'classnames';

const styles = theme => ({
  moderationGuidelinesInner: {
    paddingTop: theme.spacing.unit*2,
    cursor: 'pointer',
    position:"relative",
    backgroundColor: "white",
    ...theme.typography.body2,
    ...theme.typography.commentStyle
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
    position: 'absolute',
    right: 16,
    top: -16,
    height: '0.8em'
  },
  collapse: {
    display:"flex",
    justifyContent:"flex-end",
    fontSize: 14,
    marginBottom: 4,
  },
  moderationGuidelines: {
    '& p, & li': {
      marginTop: '.6em',
      marginBottom: '.6em'
    },
    '& ul': {
      paddingInlineStart: '22px'
    },
    '& .dividerBlock': {
      marginTop: 0,
      marginBottom: 0,
    }
  },
  moderationOuterWrapper: {
    position: "absolute",
    [theme.breakpoints.up('md')]: {
      left: "calc(100% + 26px)",
      top: -66,
      width: 220,
    },
    [theme.breakpoints.down('sm')]: {
    }
  },
  moderationOutline: {
    border: `solid 2px ${theme.palette.lwTertiary.main}`,
    position: "absolute",
    height: "100%",
    width: "100%"
  },
  bigOutline: {
    top: -48,
    left: -13,
    height: "calc(100% + 61px)",
    width: "calc(100% + 26px)"
  }
})

class ModerationGuidelinesBox extends PureComponent {

  getModerationGuidelines = (document, classes) => {
    const moderationStyle = document.moderationStyle || (document.user && document.user.moderationStyle)
    const truncatiseOptions = {
      TruncateLength: 250,
      TruncateBy: "characters",
      Suffix: "... (Read More)",
      Strict: false
    }
    const { html = "" } = document.moderationGuidelines
    const userGuidelines = `${document.user ? `<p><em>${document.user.displayName + "'s commenting guidelines"}</em></p> <span class="${classes[moderationStyle]}">${moderationStyleLookup[moderationStyle] || ""}</span> <br/>` : ""}
    ${html || ""}`

    const combinedGuidelines = `
      ${(html || moderationStyle) ? userGuidelines : ""}
      ${(html && document.frontpageDate) ? '<hr class="dividerBlock"></hr>' : ''}
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

  openEditDialog = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const { document, openDialog } = this.props;
    openDialog({
      componentName: "ModerationGuidelinesEditForm",
      componentProps: {
        postId: document._id,
      }
    });
  }

  render() {
    const { document, classes, currentUser } = this.props;
    if (!document) return null
    
    const { combinedGuidelines } = this.getModerationGuidelines(document, classes)
    return (
      <div>
        <div className={classes.moderationOutline}></div>
        <div className={classes.moderationOuterWrapper}>
          <div className={classes.moderationGuidelinesInner} onClick={this.handleClick}>
            {Users.canModeratePost(currentUser, document) &&
              <span onClick={this.openEditDialog}>
                <Tooltip title="Edit moderation guidelines">
                  <Edit className={classes.editButton} />
                </Tooltip>
              </span>
            }
            <div className={classes.moderationGuidelines}>
              <div dangerouslySetInnerHTML={{__html: combinedGuidelines}}/>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const moderationStyleLookup = {
  'norm-enforcing': "<b>Norm Enforcing</b><br/> I try to enforce particular rules",
  'reign-of-terror': "<b>Reign of Terror</b><br/> I delete anything I judge to be counterproductive",
  'easy-going': "<b>Easy Going</b><br/> I just delete obvious spam and trolling."
}

const queryOptions = {
  collection: Posts,
  queryName: 'postsSingleQuery',
  fragmentName: 'PostsPage',
  enableTotal: false,
  enableCache: true,
};

registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBox, [withDocument, queryOptions], withStyles(styles, {name: 'ModerationGuidelinesBox'}),
  withNewEvents,
  withUser,
  withDialog,
  withErrorBoundary
);

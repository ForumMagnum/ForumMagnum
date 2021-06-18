/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { useEffect, useState } from 'react';
import { Link } from '../../lib/reactRouterWrapper'
import moment from 'moment';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import DoneIcon from '@material-ui/icons/Done';
import FlagIcon from '@material-ui/icons/Flag';
import SnoozeIcon from '@material-ui/icons/Snooze';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import OutlinedFlagIcon from '@material-ui/icons/OutlinedFlag';
import DescriptionIcon from '@material-ui/icons/Description'
import { useMulti } from '../../lib/crud/withMulti';
import MessageIcon from '@material-ui/icons/Message'
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import * as _ from 'underscore';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { Select, MenuItem } from '@material-ui/core';
import Input from '@material-ui/core/Input';
import { userCanDo } from '../../lib/vulcan-users/permissions';

export const defaultModeratorPMsTag = new DatabasePublicSetting<string>('defaultModeratorPMsTag', "HTSg8QDKop33L29oe") // ea-forum-look-here

export const getTitle = (s: string|null) => s ? s.split("\\")[0] : ""

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[50]
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  hoverPostIcon: {
    height: 16,
    color: theme.palette.grey[700],
    position: "relative",
    top: 3
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  disabled: {
    opacity: .2,
    cursor: "default"
  },
  bigDownvotes: {
    color: theme.palette.error.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
    border: `solid 2px ${theme.palette.error.dark}`
  },
  downvotes: {
    color: theme.palette.error.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    border: `solid 1px ${theme.palette.error.dark}`
  },
  upvotes: {
    color: theme.palette.primary.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    border: `solid 1px ${theme.palette.primary.dark}`
  },
  bigUpvotes: {
    color: theme.palette.primary.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
    border: `solid 2px ${theme.palette.primary.dark}`
  },
  votesRow: {
    marginTop: 12,
    marginBottom: 12
  },
  hr: {
    height: 0,
    borderTop: "none",
    borderBottom: "1px solid #ccc"
  },
  editIcon: {
    width: 20,
    color: theme.palette.grey[400]
  },
  notes: {
    border: "solid 1px rgba(0,0,0,.2)",
    borderRadius: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 8,
    marginBottom: 8
  },
  defaultMessage: {
    maxWidth: 500,
    backgroundColor: "white",
    padding:12,
    boxShadow: "0 0 10px rgba(0,0,0,0.5)"
  }
})
const SunshineNewUsersInfo = ({ user, classes, updateUser }: {
  user: SunshineUsersList,
  classes: ClassesType,
  updateUser?: any
}) => {
  const currentUser = useCurrentUser();

  const [notes, setNotes] = useState(user.sunshineNotes || "")

  const canReview = !!(user.maxCommentCount || user.maxPostCount)

  const handleNotes = () => {
    if (notes != user.sunshineNotes) {
      updateUser({
        selector: {_id: user._id},
        data: {
          sunshineNotes: notes
        }
      })
    }
  }

  useEffect(() => {
    return () => {
      handleNotes();
    }
  });

  const handleReview = () => {
    if (canReview) {
      updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser!._id,
          reviewedAt: new Date(),
          sunshineSnoozed: false,
          needsReview: false,
          sunshineNotes: notes
        }
      })
    }
  }

  const handleSnooze = () => {
    updateUser({
      selector: {_id: user._id},
      data: {
        sunshineFlagged: false,
        needsReview: false,
        reviewedAt: new Date(),
        reviewedByUserId: currentUser!._id,
        sunshineSnoozed: true,
        sunshineNotes: notes
      }
    })
  }

  const banMonths = 3

  const handleBan = async () => {
    if (confirm(`Ban this user for ${banMonths} months?`)) {
      await updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser!._id,
          voteBanned: true,
          needsReview: false,
          reviewedAt: new Date(),
          banned: moment().add(banMonths, 'months').toDate(),
          sunshineNotes: notes
        }
      })
    }
  }

  const handlePurge = async () => {
    if (confirm("Are you sure you want to delete all this user's posts, comments and votes?")) {
      await updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser!._id,
          nullifyVotes: true,
          voteBanned: true,
          deleteContent: true,
          needsReview: false,
          reviewedAt: new Date(),
          banned: moment().add(1000, 'years').toDate(),
          sunshineNotes: notes
        }
      })
    }
  }

  const handleFlag = () => {
    updateUser({
      selector: {_id: user._id},
      data: {
        sunshineFlagged: !user.sunshineFlagged,
        sunshineNotes: notes
      }
    })
  }

  const { results: posts, loading: postsLoading } = useMulti({
    terms:{view:"sunshineNewUsersPosts", userId: user._id},
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
    limit: 50
  });

  const { results: comments, loading: commentsLoading } = useMulti({
    terms:{view:"sunshineNewUsersComments", userId: user._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: 50
  });

  const { results: defaultResponses } = useMulti({
    terms:{view:"defaultModeratorResponses", tagId: defaultModeratorPMsTag.get()},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: 50
  });

  const commentKarmaPreviews = comments ? _.sortBy(comments, c=>c.baseScore) : []
  const postKarmaPreviews = posts ? _.sortBy(posts, p=>p.baseScore) : []

  const { CommentBody, MetaInfo, FormatDate, SunshineNewUserPostsList, SunshineNewUserCommentsList, CommentKarmaWithPreview, PostKarmaWithPreview, LWTooltip, Loading, NewConversationButton, Typography } = Components

  const hiddenPostCount = user.maxPostCount - user.postCount
  const hiddenCommentCount = user.maxCommentCount - user.commentCount

  if (!userCanDo(currentUser, "posts.moderate.all")) return null

  return (
      <div className={classes.root}>
        <Typography variant="body2">
          <MetaInfo>
            {user.reviewedAt ? <p><em>Reviewed <FormatDate date={user.reviewedAt}/> ago by {user.reviewedByUserId}</em></p> : null }
            {user.banned ? <p><em>Banned until <FormatDate date={user.banned}/></em></p> : null }
            <div>ReCaptcha Rating: {user.signUpReCaptchaRating || "no rating"}</div>
            <div dangerouslySetInnerHTML={{__html: user.htmlBio}}/>
            <div className={classes.notes}>
              <Input 
                value={notes} 
                fullWidth
                onChange={(e) => { setNotes(e.target.value)}} 
                disableUnderline 
                placeholder="Notes for other moderators"
                multiline
              />
            </div>
            <div className={classes.row}>
              <div className={classes.row}>
                <LWTooltip title="Approve">
                  <Button onClick={handleReview} className={canReview ? null : classes.disabled }>
                    <DoneIcon/>
                  </Button>
                </LWTooltip>
                <LWTooltip title="Snooze (approve all posts)">
                  <Button title="Snooze" onClick={handleSnooze}>
                    <SnoozeIcon />
                  </Button>
                </LWTooltip>
                <LWTooltip title="Ban for 3 months">
                  <Button onClick={handleBan}>
                    <RemoveCircleOutlineIcon />
                  </Button>
                </LWTooltip>
                <LWTooltip title="Purge (delete and ban)">
                  <Button onClick={handlePurge}>
                    <DeleteForeverIcon />
                  </Button>
                </LWTooltip>
                <LWTooltip title={user.sunshineFlagged ? "Unflag this user" : <div>
                  <div>Flag this user for more review</div>
                  <div><em>(This will not remove them from sidebar)</em></div>
                </div>}>
                  <Button onClick={handleFlag}>
                    {user.sunshineFlagged ? <FlagIcon /> : <OutlinedFlagIcon />}
                  </Button>
                </LWTooltip>
              </div>
              <div className={classes.row}>
                {currentUser && <Select value={0} variant="outlined">
                  <MenuItem value={0}>Start a message</MenuItem>
                  {defaultResponses && defaultResponses.map((comment, i) => 
                    <div key={`template-${comment._id}`}>
                      <LWTooltip tooltip={false} placement="left" title={
                        <div className={classes.defaultMessage}>
                          <CommentBody comment={comment}/>
                        </div>} 
                      >
                        <MenuItem>
                          <NewConversationButton user={user} currentUser={currentUser} templateCommentId={comment._id}>
                            {getTitle(comment.contents?.plaintextMainText||null)}
                          </NewConversationButton>
                        </MenuItem>
                      </LWTooltip>
                    </div>)}
                </Select>}
                <Link to="/tag/moderator-default-responses/discussion"><EditIcon className={classes.editIcon}/></Link>
              </div>
            </div>
            <hr className={classes.hr}/>
            <div className={classes.votesRow}>
              <LWTooltip title="Big Upvotes">
                <span className={classes.bigUpvotes}>
                  { user.bigUpvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Upvotes">
                <span className={classes.upvotes}>
                  { user.smallUpvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Downvotes">
                <span className={classes.downvotes}>
                  { user.smallDownvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Big Downvotes">
                <span className={classes.bigDownvotes}>
                  { user.bigDownvoteCount || 0 }
                </span>
              </LWTooltip>
            </div>
            <div>
              <LWTooltip title="Post count">
                <span>
                  { user.postCount || 0 }
                  <DescriptionIcon className={classes.hoverPostIcon}/>
                </span> 
              </LWTooltip>
              {postKarmaPreviews.map(post => <PostKarmaWithPreview key={post._id} post={post}/>)}
              { hiddenPostCount ? <span> ({hiddenPostCount} deleted)</span> : null} 
            </div>
            {(commentsLoading || postsLoading) && <Loading/>}
            <div>
              <LWTooltip title="Comment count">
                { user.commentCount || 0 }
              </LWTooltip>
              <MessageIcon className={classes.icon}/> 
              {commentKarmaPreviews.map(comment => <CommentKarmaWithPreview key={comment._id} comment={comment}/>)}
              { hiddenCommentCount ? <span> ({hiddenCommentCount} deleted)</span> : null}
            </div>
            <SunshineNewUserPostsList posts={posts} user={user}/>
            <SunshineNewUserCommentsList comments={comments} user={user}/>
          </MetaInfo>
        </Typography>
      </div>
  )
}

const SunshineNewUsersInfoComponent = registerComponent('SunshineNewUsersInfo', SunshineNewUsersInfo, {
  styles,
  hocs: [
    withUpdate({
      collectionName: "Users",
      fragmentName: 'SunshineUsersList',
    }),
    withErrorBoundary,
  ]
});

declare global {
  interface ComponentTypes {
    SunshineNewUsersInfo: typeof SunshineNewUsersInfoComponent
  }
}

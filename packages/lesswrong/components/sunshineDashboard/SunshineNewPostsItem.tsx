import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import { postGetCommentCount, postGetCommentCountStr, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary';
import Button from '@material-ui/core/Button';
import PersonIcon from '@material-ui/icons/Person'
import HomeIcon from '@material-ui/icons/Home';
import ClearIcon from '@material-ui/icons/Clear';
import VisibilityOutlinedIcon from '@material-ui/icons/VisibilityOutlined';
import { useCreate } from '../../lib/crud/withCreate';
import { MANUAL_FLAG_ALERT } from '../../lib/collections/moderatorActions/schema';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  icon: {
    width: 14,
    marginRight: 4
  },
  robotIcon: {
    width: 14,
    marginLeft: 4,
  },
  buttonRow: {
    ...theme.typography.commentStyle
  },
  title: {
    borderTop: theme.palette.border.faint,
    paddingTop: 12,
    marginTop: 12
  },
  moderation: {
    marginBottom: 12
  },
  metaInfoRow: {
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  vote: {
    marginRight: 8
  }
})

const SunshineNewPostsItem = ({post, refetch, classes}: {
  post: SunshinePostsList,
  refetch: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const {eventHandlers, hover, anchorEl} = useHover();
  
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  const { create: createModeratorAction } = useCreate({
    collectionName: 'ModeratorActions',
    fragmentName: 'ModeratorActionsDefaultFragment'
  });
  
  const handlePersonal = () => {
    void updatePost({
      selector: { _id: post._id},
      data: {
        frontpageDate: null,
        reviewedByUserId: currentUser!._id,
        authorIsUnreviewed: false
      },
    })
  }

  const handlePromote = () => {
    void updatePost({
      selector: { _id: post._id},
      data: {
        frontpageDate: new Date(),
        reviewedByUserId: currentUser!._id,
        authorIsUnreviewed: false
      },
    })
  }
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      window.open(userGetProfileUrl(post.user), '_blank');
      void updatePost({
        selector: { _id: post._id},
        data: {
          draft: true,
        }
      })
    }
  }

  const lastManualUserFlag = post.user?.moderatorActions.find(action => action.type === MANUAL_FLAG_ALERT);
  const isUserAlreadyFlagged = post.user?.needsReview || lastManualUserFlag?.active;

  const handleFlagUser = async () => {
    if (isUserAlreadyFlagged) return;

    await createModeratorAction({
      data: {
        type: MANUAL_FLAG_ALERT,
        userId: post.userId,
      }
    });
    
    // We need to refetch to make sure the "Flag User" button gets disabled
    // The backend state only gets changed in a moderator action callback, so apollo doesn't handle it for us by updating the cache
    refetch();
  }

  const {
    MetaInfo,
    LinkPostMessage,
    ContentItemBody,
    SunshineListItem,
    SidebarHoverOver,
    SidebarInfo,
    FormatDate,
    FooterTagList,
    Typography,
    ContentStyles,
    SmallSideVote,
    ForumIcon
  } = Components;
  const { html: modGuidelinesHtml = "" } = post.moderationGuidelines || {}
  const { html: userGuidelinesHtml = "" } = post.user?.moderationGuidelines || {}

  const moderationSection = post.moderationStyle || post.user?.moderationStyle || modGuidelinesHtml || userGuidelinesHtml
  const autoFrontpage = post.autoFrontpage

  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <FooterTagList post={post} showCoreTags highlightAutoApplied />
          <div className={classes.buttonRow}>
            <Button onClick={handlePersonal}>
              <PersonIcon className={classes.icon} /> Personal {autoFrontpage === "hide" && <span className={classes.robotIcon}><ForumIcon icon="Robot" /></span>}
            </Button>
            {post.submitToFrontpage && <Button onClick={handlePromote}>
              <HomeIcon className={classes.icon} /> Frontpage {autoFrontpage === "show" && <span className={classes.robotIcon}><ForumIcon icon="Robot" /></span>}
            </Button>}
            <Button onClick={handleDelete}>
              <ClearIcon className={classes.icon} /> Draft
            </Button>
            <Button onClick={handleFlagUser} disabled={isUserAlreadyFlagged}>
              <VisibilityOutlinedIcon className={classes.icon} /> Flag User
            </Button>
          </div>
          <Typography variant="title" className={classes.title}>
            <Link to={postGetPageUrl(post)}>
              { post.title }
            </Link>
          </Typography>
          <div className={classes.metaInfoRow}>
            <span className={classes.vote}>
              <SmallSideVote document={post} collectionName="Posts"/>
            </span>
            <MetaInfo>
              <FormatDate date={post.postedAt}/>
            </MetaInfo>
            {postGetCommentCount(post) && <MetaInfo>
              <Link to={`${postGetPageUrl(post)}#comments`}>
                {postGetCommentCountStr(post)}
              </Link>
            </MetaInfo>}
          </div>
          {moderationSection && <div className={classes.moderation}>
            {(post.moderationStyle || post.user?.moderationStyle) && <div>
              <MetaInfo>
                <span>Mod Style: </span>
                { post.moderationStyle || post.user?.moderationStyle }
                {!post.moderationStyle && post.user?.moderationStyle && <span> (Default User Style)</span>}
              </MetaInfo>
            </div>}
            {(modGuidelinesHtml || userGuidelinesHtml) && <div>
              <MetaInfo>
                <span dangerouslySetInnerHTML={{__html: modGuidelinesHtml || userGuidelinesHtml}}/>
                {!modGuidelinesHtml && userGuidelinesHtml && <span> (Default User Guideline)</span>}
              </MetaInfo>
            </div>}
          </div>}
          <ContentStyles contentType="postHighlight">
            <LinkPostMessage post={post} />
            <ContentItemBody dangerouslySetInnerHTML={{__html: post.contents?.html || ""}} description={`post ${post._id}`}/>
          </ContentStyles>
        </SidebarHoverOver>
        <Link to={postGetPageUrl(post)}>
          {post.title}
        </Link>
        <div>
          <SidebarInfo>
            { post.baseScore }
          </SidebarInfo>
          <SidebarInfo>
            <Link to={userGetProfileUrl(post.user)}>
              {post.user && post.user.displayName}
            </Link>
          </SidebarInfo>
        </div>
      </SunshineListItem>
    </span>
  )
}

const SunshineNewPostsItemComponent = registerComponent('SunshineNewPostsItem', SunshineNewPostsItem, {styles, 
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineNewPostsItem: typeof SunshineNewPostsItemComponent
  }
}

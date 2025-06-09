import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { postGetCommentCount, postGetCommentCountStr, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person'
import HomeIcon from '@/lib/vendor/@material-ui/icons/src/Home';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import VisibilityOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/VisibilityOutlined';
import { MANUAL_FLAG_ALERT } from "@/lib/collections/moderatorActions/constants";
import { isFriendlyUI } from '../../themes/forumTheme';
import MetaInfo from "../common/MetaInfo";
import LinkPostMessage from "../posts/LinkPostMessage";
import { ContentItemBody } from "../contents/ContentItemBody";
import SunshineListItem from "./SunshineListItem";
import SidebarHoverOver from "./SidebarHoverOver";
import SidebarInfo from "./SidebarInfo";
import FormatDate from "../common/FormatDate";
import FooterTagList from "../tagging/FooterTagList";
import { Typography } from "../common/Typography";
import ContentStyles from "../common/ContentStyles";
import SmallSideVote from "../votes/SmallSideVote";
import ForumIcon from "../common/ForumIcon";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const PostsListUpdateMutation = gql(`
  mutation updatePostSunshineNewPostsItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const ModeratorActionsDefaultFragmentMutation = gql(`
  mutation createModeratorActionSunshineNewPostsItem($data: CreateModeratorActionDataInput!) {
    createModeratorAction(data: $data) {
      data {
        ...ModeratorActionsDefaultFragment
      }
    }
  }
`);

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
  
  const [updatePost] = useMutation(PostsListUpdateMutation);

  const [createModeratorAction] = useMutation(ModeratorActionsDefaultFragmentMutation);
  
  const handlePersonal = () => {
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          frontpageDate: null,
          reviewedByUserId: currentUser!._id,
          authorIsUnreviewed: false
        }
      }
    })
  }

  const handlePromote = () => {
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          frontpageDate: new Date(),
          reviewedByUserId: currentUser!._id,
          authorIsUnreviewed: false
        }
      }
    })
  }
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      window.open(userGetProfileUrl(post.user), '_blank');
      void updatePost({
        variables: {
          selector: { _id: post._id },
          data: {
            draft: true,
          }
        }
      })
    }
  }

  const lastManualUserFlag = post.user?.moderatorActions?.find(action => action.type === MANUAL_FLAG_ALERT);
  const isUserAlreadyFlagged = post.user?.needsReview || lastManualUserFlag?.active;

  const handleFlagUser = async () => {
    if (isUserAlreadyFlagged) return;

    await createModeratorAction({
      variables: {
        data: {
          type: MANUAL_FLAG_ALERT,
          userId: post.userId,
        }
      }
    });
    
    // We need to refetch to make sure the "Flag User" button gets disabled
    // The backend state only gets changed in a moderator action callback, so apollo doesn't handle it for us by updating the cache
    refetch();
  }
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
                <span dangerouslySetInnerHTML={{__html: (modGuidelinesHtml || userGuidelinesHtml) ?? ''}}/>
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

export default registerComponent('SunshineNewPostsItem', SunshineNewPostsItem, {styles, 
  hocs: [withErrorBoundary]
});



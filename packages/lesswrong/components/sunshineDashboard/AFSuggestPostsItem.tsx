import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import PlusOneIcon from '@/lib/vendor/@material-ui/icons/src/PlusOne';
import UndoIcon from '@/lib/vendor/@material-ui/icons/src/Undo';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import withErrorBoundary from '../common/withErrorBoundary'
import {DatabasePublicSetting} from "../../lib/publicSettings";
import SunshineListItem from "./SunshineListItem";
import SidebarHoverOver from "./SidebarHoverOver";
import ContentStyles from "../common/ContentStyles";
import SunshineSendMessageWithDefaults from "./SunshineSendMessageWithDefaults";
import { Typography } from "../common/Typography";
import PostsHighlight from "../posts/PostsHighlight";
import SidebarInfo from "./SidebarInfo";
import FormatDate from "../common/FormatDate";
import SidebarActionMenu from "./SidebarActionMenu";
import SidebarAction from "./SidebarAction";
import OmegaIcon from "../icons/OmegaIcon";
import { useMutation } from "@apollo/client";
<<<<<<< HEAD
import { gql } from "@/lib/generated/gql-codegen/gql";
import uniq from 'lodash/uniq';
import without from 'lodash/without';
=======
import { gql } from "@/lib/crud/wrapGql";
>>>>>>> origin/extract-mutations-with-codegen-clean

const SuggestAlignmentPostUpdateMutation = gql(`
  mutation updatePostAFSuggestPostsItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...SuggestAlignmentPost
      }
    }
  }
`);

export const defaultAFModeratorPMsTagSlug = new DatabasePublicSetting<string>('defaultAFModeratorPMsTagSlug', "af-default-moderator-responses")

export const afSubmissionHeader = (theme: ThemeType) => ({
  marginBottom: 24,
  display: "flex",
  flex: "flex-start",
  alignContent: "center",
  justifyContent: "space-between"
})

export const afSubmissionHeaderText = (theme: ThemeType) => ({
  fontStyle: 'italic',
})

const styles = (theme: ThemeType) => ({
  afSubmissionHeader: {
    ...afSubmissionHeader(theme)
  },
  afSubmissionHeaderText: {
    ...afSubmissionHeaderText(theme)
  }
})


const AFSuggestPostsItem = ({post, classes}: {
  post: SuggestAlignmentPost,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const { hover, anchorEl, eventHandlers } = useHover();
  
  const [updatePost] = useMutation(SuggestAlignmentPostUpdateMutation);

  const handleMoveToAlignment = () => {
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          reviewForAlignmentUserId: currentUser!._id,
          afDate: new Date(),
          af: true,
        }
      }
    })
  }

  const handleDisregardForAlignment = () => {
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          reviewForAlignmentUserId: currentUser!._id,
        }
      }
    })
  }

  if (!currentUser) return null;

  const userHasVoted = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)
  const userHasSelfSuggested = post.suggestForAlignmentUsers && post.userId && post.suggestForAlignmentUsers.map(user=>user._id).includes(post.userId)

  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          { userHasSelfSuggested && <ContentStyles contentType="comment" className={classes.afSubmissionHeader}>
            <ContentStyles contentType="comment" className={classes.afSubmissionHeaderText}>
              AF Submission
            </ContentStyles>
            <SunshineSendMessageWithDefaults user={post.user}/>
          </ContentStyles>}
          <Typography variant="title">
            <Link to={postGetPageUrl(post)}>
              { post.title }
            </Link>
          </Typography>
          <br/>
          <PostsHighlight post={post} maxLengthWords={600}/>
        </SidebarHoverOver>
        <Link to={postGetPageUrl(post)}
          className="sunshine-sidebar-posts-title">
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
          {post.postedAt && <SidebarInfo>
            <FormatDate date={post.postedAt}/>
          </SidebarInfo>}
        </div>
        <SidebarInfo>
          Endorsed by { post.suggestForAlignmentUsers && post.suggestForAlignmentUsers.map(user=>user.displayName).join(", ") }
        </SidebarInfo>
        { hover && <SidebarActionMenu>
          { userHasVoted ?
            <SidebarAction title="Unendorse for Alignment" onClick={() => (
              void updatePost({
                variables: {
                  selector: { _id: post._id },
                  data: { suggestForAlignmentUserIds: without(post.suggestForAlignmentUserIds, currentUser._id) }
                }
              })
            )}>
              <UndoIcon/>
            </SidebarAction>
            :
            <SidebarAction title="Endorse for Alignment" onClick={() => (
              void updatePost({
                variables: {
                  selector: { _id: post._id },
                  data: { suggestForAlignmentUserIds: uniq([...post.suggestForAlignmentUserIds, currentUser._id]) }
                }
              })
            )}>
              <PlusOneIcon/>
            </SidebarAction>
          }
          <SidebarAction title="Move to Alignment" onClick={handleMoveToAlignment}>
            <OmegaIcon/>
          </SidebarAction>
          <SidebarAction title="Remove from Alignment Suggestions" onClick={handleDisregardForAlignment}>
            <ClearIcon/>
          </SidebarAction>
        </SidebarActionMenu>}
      </SunshineListItem>
    </span>
  );
}

export default registerComponent('AFSuggestPostsItem', AFSuggestPostsItem, {
  styles,
  hocs: [withErrorBoundary]
});



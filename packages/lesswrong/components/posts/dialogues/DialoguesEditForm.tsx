// TODO: Import component in components.ts
import React from 'react';
import { Components, getFragment, registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import { useCurrentUser } from '../../common/withUser';
import { forumTypeSetting, isEAForum, isLW } from '../../../lib/instanceSettings';
import { isPostCategory, postDefaultCategory, postGetEditUrl, postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { useMessages } from '../../common/withMessages';
import { useLocation, useNavigation } from '../../../lib/routeUtil';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useDialog } from '../../common/withDialog';
import { useSingle } from '../../../lib/crud/withSingle';
import NoSSR from 'react-no-ssr';
import { userCanPost } from '../../../lib/collections/posts';
import { SubmitToFrontpageCheckboxProps } from '../SubmitToFrontpageCheckbox';
import { PostSubmitProps } from '../PostSubmit';
import { getPostEditorGuide } from '../PostsNewForm';
import { afNonMemberSuccessHandling } from '../../../lib/alignment-forum/displayAFNonMemberPopups';
import { SHARE_POPUP_QUERY_PARAM } from '../PostsPage/PostsPage';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { generateLinkSharingKey } from '../../../server/ckEditor/ckEditorCallbacks';

const styles = (theme: ThemeType): JssStyles => ({
  postForm: {
    maxWidth: 715,
    margin: "0 auto",

    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },

    "& .vulcan-form .input-draft, & .vulcan-form .input-frontpage": {
      margin: 0,
      [theme.breakpoints.down('xs')]: {
        width:125,
      },

      "& .form-group.row": {
        marginBottom:0,
      },

      "& .checkbox": {
        width: 150,
        margin: "0 0 6px 0",
        [theme.breakpoints.down('xs')]: {
          width: 150,
        }
      }
    },
    "& .document-new .input-frontpage .checkbox": {
      marginBottom: 12,
    },
    "& .document-new .input-draft .checkbox": {
      marginBottom: 12,
    },

    "& .vulcan-form .input-draft": {
      right:115,
      width:125,
      [theme.breakpoints.down('xs')]: {
        bottom: 50,
        right: 0,
        width: 100,

        "& .checkbox": {
          width: 100,
        }
      }
    },

    "& .vulcan-form .input-frontpage": {
      right: 255,
      width: 150,
      [theme.breakpoints.down('xs')]: {
        bottom: 50,
        right: 150,
        width: 100,
      }
    },

    "& .document-edit > div > hr": {
    // Ray Sept 2017:
    // This hack is necessary because SmartForm automatically includes an <hr/> tag in the "delete" menu:
    // path: /packages/vulcan-forms/lib/Form.jsx
      display: "none",
    },

    "& .form-submit": {
      textAlign: "right",
    },
    
    "& .form-input.input-url": {
      margin: 0,
      ...(isEAForum && {width: "100%"})
    },
    "& .form-input.input-contents": {
      marginTop: 0,
    },
  },
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: 20
  },
  collaborativeRedirectLink: {
    color:  theme.palette.secondary.main
  },
  modNote: {
    [theme.breakpoints.down('xs')]: {
      paddingTop: 20,
    },
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20
  },
  editorGuideOffset: {
    paddingTop: 100,
  },
  editorGuide: {
    display: 'flex',
    alignItems: 'center',
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 10,
    borderRadius: theme.borderRadius.default,
    color: theme.palette.primary.main,
    [theme.breakpoints.up('lg')]: {
      width: 'max-content',
      paddingLeft: 20,
      paddingRight: 20
    },
  },
  editorGuideIcon: {
    height: 40,
    width: 40,
    fill: theme.palette.primary.main,
    marginRight: -4
  },
  editorGuideLink: {}
});


const DialogueInviteButton = (_, { updateCurrentValues }: any) => {
  const currentUser = useCurrentUser();
  if (!currentUser) throw Error("must be logged in to post")

  return (
    <div style={{textAlign: "right"}}>
      <Button type="submit"
        onClick={() => updateCurrentValues({draft: true})}
      >
        Invite to Dialogue
      </Button>
    </div>
  );
}

export const DialoguesEditForm = ({classes}: {
  classes: ClassesType,
}) => {
  const { query } = useLocation();
  const { history } = useNavigation();
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { openDialog } = useDialog();
  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
  })
  
  const {
    SectionTitle, WrappedSmartForm, WrappedLoginForm, SubmitToFrontpageCheckbox,
    RecaptchaWarning, SingleColumnSection, Typography, Loading, PostsAcceptTos,
    NewPostModerationWarning, RateLimitWarning, DynamicTableOfContents,
  } = Components;
  const af = forumTypeSetting.get() === 'AlignmentForum'

  const {document: userWithRateLimit} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersCurrentPostRateLimit",
    fetchPolicy: "cache-and-network",
    skip: !currentUser
  });
  const rateLimitNextAbleToPost = userWithRateLimit?.rateLimitNextAbleToPost

  if (!currentUser) {
    return (<WrappedLoginForm />);
  }

  if (!userCanPost(currentUser)) {
    return (<SingleColumnSection>
      <Typography variant="display1">
        You don't have permission to post
      </Typography>
    </SingleColumnSection>);
  }

  // on LW, show a moderation message to users who haven't been approved yet
  const postWillBeHidden = isLW && !currentUser.reviewedByUserId

  return (
      <div className={classes.postForm}>
        <RecaptchaWarning currentUser={currentUser}>
          <PostsAcceptTos currentUser={currentUser} />
          {postWillBeHidden && <NewPostModerationWarning />}
          {rateLimitNextAbleToPost && <RateLimitWarning lastRateLimitExpiry={rateLimitNextAbleToPost.nextEligible} rateLimitMessage={rateLimitNextAbleToPost.rateLimitMessage}  />}
          <NoSSR>
            <WrappedSmartForm
              collectionName="Posts"
              mutationFragment={getFragment('PostsPage')}
              fields={['title', 'af', 'coauthorStatuses']}
              prefilledProps={{
                postCategory: "dialogue"
              }}
              successCallback={(post: any, options: any) => {
                history.push(postGetEditUrl(post._id));
              }}
              repeatErrors
              noSubmitOnCmdEnter
              formComponents={{
                FormSubmit: DialogueInviteButton
              }}
            />
          </NoSSR>
        </RecaptchaWarning>
      </div>
  );
}

const DialoguesEditFormComponent = registerComponent('DialoguesEditForm', DialoguesEditForm, {styles});

declare global {
  interface ComponentTypes {
    DialoguesEditForm: typeof DialoguesEditFormComponent
  }
}

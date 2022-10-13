import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { Posts, userCanPost } from '../../lib/collections/posts';
import { postGetPageUrl, postGetEditUrl } from '../../lib/collections/posts/helpers';
import pick from 'lodash/pick';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { useLocation, useNavigation } from '../../lib/routeUtil';
import NoSsr from '@material-ui/core/NoSsr';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { useDialog } from "../common/withDialog";
import { afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { useUpdate } from "../../lib/crud/withUpdate";
import { useSingle } from '../../lib/crud/withSingle';
import { groupLayoutStyles } from '../vulcan-forms/FormGroup';

// Also used by PostsEditForm
export const styles = (theme: ThemeType): JssStyles => ({
  postForm: {
    width:715,
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
    },
    "& .form-input.input-contents": {
      marginTop: 0,
    },
  },
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
  },
  collaborativeRedirectLink: {
    color:  theme.palette.secondary.main
  },
  tags: {
    ...groupLayoutStyles(theme).formSection,
    padding: 16,
    paddingBottom: 12
  }
})

const prefillFromTemplate = (template: PostsEdit) => {
  return pick(
    template,
    [
      "contents",
      "activateRSVPs",
      "location",
      "googleLocation",
      "onlineEvent",
      "globalEvent",
      "startTime",
      "endTime",
      "localStartTime",
      "localEndTime",
      "eventRegistrationLink",
      "joinEventLink",
      "website",
      "contactInfo",
      "isEvent",
      "eventImageId",
      "eventType",
      "types",
      "groupId",
      "group",
      "title",
      "coauthorStatuses",
      "hasCoauthorPermission",
    ]
  )
}

const PostsNewForm = ({classes}: {
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
  const templateId = query && query.templateId;
  
  // if we are trying to create an event in a group,
  // we want to prefill the "onlineEvent" checkbox if the group is online
  const { document: groupData } = useSingle({
    collectionName: "Localgroups",
    fragmentName: 'localGroupsIsOnline',
    documentId: query && query.groupId,
    skip: !query || !query.groupId
  });
  const { document: templateDocument, loading: templateLoading } = useSingle({
    documentId: templateId,
    collectionName: "Posts",
    fragmentName: 'PostsEdit',
    skip: !templateId,
  });
  
  const { PostSubmit, WrappedSmartForm, WrappedLoginForm, SubmitToFrontpageCheckbox, RecaptchaWarning, SingleColumnSection, Typography, Loading, CoreTagsChecklist } = Components
  const userHasModerationGuidelines = currentUser && currentUser.moderationGuidelines && currentUser.moderationGuidelines.originalContents
  const af = forumTypeSetting.get() === 'AlignmentForum'
  const prefilledProps = templateDocument ? prefillFromTemplate(templateDocument) : {
    isEvent: query && !!query.eventForm,
    activateRSVPs: true,
    onlineEvent: groupData?.isOnline,
    globalEvent: groupData?.isOnline,
    types: query && query.ssc ? ['SSC'] : [],
    meta: query && !!query.meta,
    af: af || (query && !!query.af),
    groupId: query && query.groupId,
    moderationStyle: currentUser && currentUser.moderationStyle,
    moderationGuidelines: userHasModerationGuidelines ? currentUser!.moderationGuidelines : undefined
  }
  const eventForm = query && query.eventForm

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

  if (templateId && templateLoading) {
    return <Loading />
  }

  const NewPostsSubmit = (props) => {
    return <div className={classes.formSubmit}>
      {!eventForm && <SubmitToFrontpageCheckbox {...props} />}
      <PostSubmit {...props} />
    </div>
  }

  return (
    <div className={classes.postForm}>
      <RecaptchaWarning currentUser={currentUser}>
        <NoSsr>
          <WrappedSmartForm
            collection={Posts}
            mutationFragment={getFragment('PostsPage')}
            prefilledProps={prefilledProps}
            successCallback={(post, options) => {
              if (!post.draft) afNonMemberSuccessHandling({currentUser, document: post, openDialog, updateDocument: updatePost});
              if (options?.submitOptions?.redirectToEditor) {
                history.push(postGetEditUrl(post._id));
              } else {
                history.push({pathname: postGetPageUrl(post)})
                flash({ messageString: "Post created.", type: 'success'});
              }
            }}
            eventForm={eventForm}
            repeatErrors
            noSubmitOnCmdEnter
            formComponents={{
              FormSubmit: NewPostsSubmit
            }}
          />
        </NoSsr>
      </RecaptchaWarning>
    </div>
  );
}

const PostsNewFormComponent = registerComponent('PostsNewForm', PostsNewForm, {styles});

declare global {
  interface ComponentTypes {
    PostsNewForm: typeof PostsNewFormComponent
  }
}

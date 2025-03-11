import { useMessages } from '../common/withMessages';
import Posts, { userCanPost } from '../../lib/collections/posts/collection';
import { postGetPageUrl, postGetEditUrl, isPostCategory, postDefaultCategory } from '../../lib/collections/posts/helpers';
import pick from 'lodash/pick';
import React, { useEffect, useRef } from 'react';
import { useCurrentUser } from '../common/withUser'
import { isAF, isEAForum, isLW, isLWorAF } from '../../lib/instanceSettings';
import { useDialog } from "../common/withDialog";
import { afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { useUpdate } from "../../lib/crud/withUpdate";
import { useSingle } from '../../lib/crud/withSingle';
import type { SubmitToFrontpageCheckboxProps } from './SubmitToFrontpageCheckbox';
import type { PostSubmitProps } from './PostSubmit';
import { SHARE_POPUP_QUERY_PARAM } from './PostsPage/PostsPage';
import { QuestionIcon } from '../icons/questionIcon';
import DeferRender from '../common/DeferRender';
import { userCanCreateAndEditJargonTerms } from '@/lib/betas';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { useStyles } from '../hooks/useStyles';
import { styles } from './PostsEditForm';
import { useCreate } from '@/lib/crud/withCreate';
import { getInsertableFields } from '@/lib/vulcan-forms/schema_utils';
import { getSchema } from '@/lib/utils/getSchema';

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

function getPostCategory(query: Record<string, string>, questionInQuery: boolean) {
  return isPostCategory(query.category)
    ? query.category
    : questionInQuery
      ? ("question" as const)
      : postDefaultCategory;
}

/**
 * This is to pre-hydrate the apollo cache for when we redirect to PostsEditForm after doing an autosave.
 * If we don't do that, the user will experience an unfortunate loading state.
 * The transition still isn't totally seamless because ckEditor needs to remount, but if you blink you can miss it.
 * We also use userWithRateLimit (UsersCurrentPostRateLimit) on both pages, but that's less critical.
 * 
 * We don't rely on fetching the document with the initial `useSingle`, but only on the refetch - this is basically a hacky way to imperatively run a query on demand
 */
function usePrefetchForAutosaveRedirect() {
  const { refetch: fetchAutosavedPostForEditPage } = useSingle({
    documentId: undefined,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
    skip: true,
  });

  const extraVariablesValues = { version: 'draft' };

  const { refetch: fetchAutosavedPostForEditForm } = useSingle({
    documentId: undefined,
    collectionName: "Posts",
    fragmentName: 'PostsEditQueryFragment',
    extraVariables: { version: 'String' },
    extraVariablesValues,
    fetchPolicy: 'network-only',
    skip: true,
  });

  const prefetchPostFragmentsForRedirect = (postId: string) => {
    return Promise.all([
      fetchAutosavedPostForEditPage({ input: { selector: { documentId: postId } } }),
      fetchAutosavedPostForEditForm({ input: { selector: { documentId: postId }, resolverArgs: extraVariablesValues }, ...extraVariablesValues })
    ]);
  };

  return prefetchPostFragmentsForRedirect;
}

const PostsNewForm = () => {
  const classes = useStyles(styles);
  const {
    PostSubmit, WrappedSmartForm, LoginForm, SubmitToFrontpageCheckbox,
    RecaptchaWarning, SingleColumnSection, Typography, Loading, PostsAcceptTos,
    NewPostModerationWarning, RateLimitWarning, DynamicTableOfContents,
  } = Components;

  const { query } = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { openDialog } = useDialog();

  const prefetchPostFragmentsForRedirect = usePrefetchForAutosaveRedirect();

  const templateId = query && query.templateId;
  const debateForm = !!(query && query.debate);
  const questionInQuery = query && !!query.question;
  const eventForm = query && query.eventForm

  const postCategory = getPostCategory(query, questionInQuery);

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
    fragmentName: 'PostsEditMutationFragment',
    skip: !templateId,
  });

  // `UsersCurrent` doesn't have the editable field with their originalContents for performance reasons, so we need to fetch them explicitly
  const { document: currentUserWithModerationGuidelines } = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersEdit",
    skip: !currentUser,
  });

  let prefilledProps = templateDocument ? prefillFromTemplate(templateDocument) : {
    isEvent: query && !!query.eventForm,
    question: (postCategory === "question") || questionInQuery,
    activateRSVPs: true,
    onlineEvent: groupData?.isOnline,
    globalEvent: groupData?.isOnline,
    types: query && query.ssc ? ['SSC'] : [],
    meta: query && !!query.meta,
    af: isAF || (query && !!query.af),
    groupId: query && query.groupId,
    moderationStyle: currentUser && currentUser.moderationStyle,
    moderationGuidelines: currentUserWithModerationGuidelines?.moderationGuidelines ?? undefined,
    generateDraftJargon: currentUser?.generateJargonForDrafts,
    debate: debateForm,
    postCategory
  }

  if (query?.subforumTagId || query?.tagId) {
    prefilledProps = {
      ...prefilledProps,
      subforumTagId: query.subforumTagId || query.tagId,
      tagRelevance: {[query.subforumTagId || query.tagId]: 1},
    }
  }

  const createPost = useCreate({
    collectionName: "Posts",
    fragmentName: "PostsEdit",
  });

  const attemptedToCreatePostRef = useRef(false);
  useEffect(() => {
    if (currentUser && currentUserWithModerationGuidelines && !templateLoading && userCanPost(currentUser) && !attemptedToCreatePostRef.current) {
      attemptedToCreatePostRef.current = true;
      (async () => {
        const insertableFields = getInsertableFields(getSchema(Posts), currentUser);
        const { data, errors } = await createPost.create({
          data: {
            title: "Untitled Draft",
            draft: true,
            ...pick(prefilledProps, insertableFields),
          },
        });
        if (data) {
          navigate(postGetEditUrl(data.createPost.data._id, false, data.linkSharingKey), {replace: true});
        }
      })();
    }
  }, [currentUser, currentUserWithModerationGuidelines, templateLoading, createPost, navigate, prefilledProps]);

  if (!currentUser) {
    return (<LoginForm />);
  }
  if (!currentUserWithModerationGuidelines) {
    return <Loading/>
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
  
  return <Loading/>
}

const PostsNewFormComponent = registerComponent('PostsNewForm', PostsNewForm);

declare global {
  interface ComponentTypes {
    PostsNewForm: typeof PostsNewFormComponent
  }
}

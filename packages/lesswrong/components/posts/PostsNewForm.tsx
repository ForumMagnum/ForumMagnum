import { postGetEditUrl, isPostCategory, postDefaultCategory, userCanEditCoauthors } from '@/lib/collections/posts/helpers';
import { userCanPost } from '@/lib/collections/users/helpers';
import pick from 'lodash/pick';
import React, { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '../common/withUser'
import { isAF } from '../../lib/instanceSettings';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { hasAuthorModeration } from '@/lib/betas';
import { useMutation } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { userIsMemberOf } from '@/lib/vulcan-users/permissions';
import { sanitizeEditableFieldValues } from '../tanstack-form-components/helpers';
import ErrorMessage from "../common/ErrorMessage";
import LoginForm from "../users/LoginForm";
import SingleColumnSection from "../common/SingleColumnSection";
import { Typography } from "../common/Typography";
import Loading from "../vulcan-core/Loading";

const PostsEditMutation = gql(`
  mutation createPostPostsNewForm($data: CreatePostDataInput!) {
    createPost(data: $data) {
      data {
        ...PostsEdit
      }
    }
  }
`);

const UsersEditQuery = gql(`
  query PostsNewForm4($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersEdit
      }
    }
  }
`);

const PostsEditMutationFragmentQuery = gql(`
  query PostsNewForm3($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsEditMutationFragment
      }
    }
  }
`);

const localGroupsIsOnlineQuery = gql(`
  query PostsNewForm2($documentId: String) {
    localgroup(input: { selector: { documentId: $documentId } }) {
      result {
        ...localGroupsIsOnline
      }
    }
  }
`);

const PostsEditQueryFragmentQuery = gql(`
  query PostsNewForm1($documentId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsEditQueryFragment
      }
    }
  }
`);

const PostsPageQuery = gql(`
  query PostsNewForm($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsPage
      }
    }
  }
`);

type EventTemplateFields =
  | "contents"
  | "activateRSVPs"
  | "location"
  | "googleLocation"
  | "onlineEvent"
  | "globalEvent"
  | "eventRegistrationLink"
  | "joinEventLink"
  | "website"
  | "contactInfo"
  | "isEvent"
  | "eventImageId"
  | "eventType"
  | "types"
  | "groupId"
  | "title"
  | "hasCoauthorPermission"
  | "coauthorStatuses";

type PrefilledPostFields =
  | "isEvent"
  | "question"
  | "activateRSVPs"
  | "onlineEvent"
  | "globalEvent"
  | "types"
  | "meta"
  | "groupId"
  | "moderationStyle"
  | "generateDraftJargon"
  | "postCategory";

type PrefilledEventTemplate = Pick<PostsEditMutationFragment, EventTemplateFields> & {
  startTime?: Date;
  endTime?: Date;
};

type PrefilledPostBase = Pick<PostsEditMutationFragment, PrefilledPostFields>;

type PrefilledPost = Partial<PrefilledEventTemplate | PrefilledPostBase> & {
  af?: boolean;
  subforumTagId?: string;
  tagRelevance?: Record<string, number>;
};

const prefillFromTemplate = (template: PostsEditMutationFragment, currentUser: UsersCurrent | null): PrefilledEventTemplate => {
  const { startTime, endTime, ...fields } = pick(
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
      "eventRegistrationLink",
      "joinEventLink",
      "website",
      "contactInfo",
      "isEvent",
      "eventImageId",
      "eventType",
      "types",
      "groupId",
      "title",
      "hasCoauthorPermission",
      ...(userCanEditCoauthors(currentUser) ? ["coauthorStatuses"] as const : []),
    ] as const
  );

  return {
    ...fields,
    ...(startTime && { startTime: new Date(startTime) }),
    ...(endTime && { endTime: new Date(endTime) }),
  }
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
  const { refetch: fetchAutosavedPostForEditPage, data: dataPost } = useQuery(PostsPageQuery, {
    variables: { documentId: undefined },
    skip: true,
  });
  const document = dataPost?.post?.result;

  const extraVariablesValues = { version: 'draft' };

  const { refetch: fetchAutosavedPostForEditForm, data: dataUser } = useQuery(PostsEditQueryFragmentQuery, {
    variables: { documentId: undefined },
    skip: true,
    fetchPolicy: 'network-only',
  });
  const documentUser = dataUser?.post?.result;

  const prefetchPostFragmentsForRedirect = (postId: string) => {
    return Promise.all([
      fetchAutosavedPostForEditPage({ documentId: postId }),
      fetchAutosavedPostForEditForm({ documentId: postId, ...extraVariablesValues })
    ]);
  };

  return prefetchPostFragmentsForRedirect;
}

const PostsNewForm = () => {
  const { query } = useLocation();
  const [error, setError] = useState<string|null>(null);
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const templateId = query && query.templateId;
  const questionInQuery = query && !!query.question;
  const eventForm = query && query.eventForm

  const postCategory = getPostCategory(query, questionInQuery);

  // if we are trying to create an event in a group,
  // we want to prefill the "onlineEvent" checkbox if the group is online
  const { data: dataGroup } = useQuery(localGroupsIsOnlineQuery, {
    variables: { documentId: query && query.groupId },
    skip: !query || !query.groupId,
  });
  const groupData = dataGroup?.localgroup?.result;

  const { loading: templateLoading, data: dataPost } = useQuery(PostsEditMutationFragmentQuery, {
    variables: { documentId: templateId },
    skip: !templateId,
  });
  const templateDocument = dataPost?.post?.result;

  // `UsersCurrent` doesn't have the editable field with their originalContents for performance reasons, so we need to fetch them explicitly
  const { data: dataUser } = useQuery(UsersEditQuery, {
    variables: { documentId: currentUser?._id },
    skip: !currentUser,
  });
  const currentUserWithModerationGuidelines = dataUser?.user?.result;

  let prefilledProps: PrefilledPost = templateDocument ? prefillFromTemplate(templateDocument, currentUser) : {
    isEvent: query && !!query.eventForm,
    question: (postCategory === "question") || questionInQuery,
    activateRSVPs: true,
    onlineEvent: groupData?.isOnline,
    globalEvent: groupData?.isOnline,
    types: query && query.ssc ? ['SSC'] : [],
    meta: query && !!query.meta,
    groupId: query && query.groupId,
    moderationStyle: currentUser && currentUser.moderationStyle,
    generateDraftJargon: currentUser?.generateJargonForDrafts,
    postCategory
  }

  if (userIsMemberOf(currentUser, 'alignmentForum')) {
    prefilledProps = {
      ...prefilledProps,
      af: isAF || (query && !!query.af),
    };
  }

  if (query?.subforumTagId || query?.tagId) {
    prefilledProps = {
      ...prefilledProps,
      subforumTagId: query.subforumTagId || query.tagId,
      tagRelevance: {[query.subforumTagId || query.tagId]: 1},
    }
  }

  const [createPost] = useMutation(PostsEditMutation);

  const attemptedToCreatePostRef = useRef(false);
  useEffect(() => {
    if (currentUser && currentUserWithModerationGuidelines && !templateLoading && userCanPost(currentUser) && !attemptedToCreatePostRef.current) {
      attemptedToCreatePostRef.current = true;
      void (async () => {
        const sanitizedPrefilledProps = 'contents' in prefilledProps
          ? sanitizeEditableFieldValues(prefilledProps, ['contents'])
          : prefilledProps;

        const moderationGuidelinesField = currentUserWithModerationGuidelines.moderationGuidelines?.originalContents && hasAuthorModeration
          ? { moderationGuidelines: sanitizeEditableFieldValues(currentUserWithModerationGuidelines, ['moderationGuidelines']).moderationGuidelines }
          : {};

        try {
          const { data } = await createPost({
            variables: {
              data: {
                title: "Untitled Draft",
                draft: true,
                ...sanitizedPrefilledProps,
                ...moderationGuidelinesField,
              }
            },
          });

          const createdPost = data?.createPost?.data;

          if (createdPost) {
            navigate(postGetEditUrl(createdPost._id, false, createdPost.linkSharingKey ?? undefined), {replace: true});
          }
        } catch(e) {
          setError(e.message);
        }
      })();
    }
  // Disable warning because lint doesn't know depending on JSON.stringify(prefilledProps) is the same as depending on prefilledProps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, currentUserWithModerationGuidelines, templateLoading, createPost, navigate, JSON.stringify(prefilledProps)]);

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

  if (error) {
    return <ErrorMessage message={error}/>
  } else {
    return <Loading/>
  }
}

export default registerComponent('PostsNewForm', PostsNewForm);



import { postGetEditUrl, isPostCategory, postDefaultCategory, userCanEditCoauthors } from '@/lib/collections/posts/helpers';
import { userCanPost } from '@/lib/collections/users/helpers';
import pick from 'lodash/pick';
import React, { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '../common/withUser'
import { isAF } from '../../lib/instanceSettings';
import { useSingle } from '../../lib/crud/withSingle';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { useCreate } from '@/lib/crud/withCreate';
import { hasAuthorModeration } from '@/lib/betas';
import { userIsMemberOf } from '@/lib/vulcan-users/permissions';
import { sanitizeEditableFieldValues } from '../tanstack-form-components/helpers';

type EventTemplateFields =
  | "contents"
  | "activateRSVPs"
  | "location"
  | "googleLocation"
  | "onlineEvent"
  | "globalEvent"
  | "startTime"
  | "endTime"
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

type PrefilledEventTemplate = Pick<PostsEditMutationFragment, EventTemplateFields>;
type PrefilledPostBase = Pick<PostsEditMutationFragment, PrefilledPostFields>;

type PrefilledPost = Partial<PrefilledEventTemplate | PrefilledPostBase> & {
  af?: boolean;
  subforumTagId?: string;
  tagRelevance?: Record<string, number>;
};

const prefillFromTemplate = (template: PostsEditMutationFragment, currentUser: UsersCurrent | null): PrefilledEventTemplate => {
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

const PostsNewFormInner = () => {
  const { LoginForm, SingleColumnSection, Typography, Loading } = Components;
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

  const createPost = useCreate({
    collectionName: "Posts",
    fragmentName: "PostsEdit",
  });

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
          const { data } = await createPost.create({
            data: {
              title: "Untitled Draft",
              draft: true,
              ...sanitizedPrefilledProps,
              ...moderationGuidelinesField,
            },
          });
          if (data) {
            navigate(postGetEditUrl(data.createPost.data._id, false, data.linkSharingKey), {replace: true});
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
    return <Components.ErrorMessage message={error}/>
  } else {
    return <Loading/>
  }
}

export const PostsNewForm = registerComponent('PostsNewForm', PostsNewFormInner);

declare global {
  interface ComponentTypes {
    PostsNewForm: typeof PostsNewForm
  }
}

import * as t from 'io-ts';
import { denormalizedFieldKeys } from "./denormalizedFields";

export const CrosspostTokenResponseValidator = t.strict({
  token: t.string
});

export const ConnectCrossposterRequestValidator = t.strict({
  token: t.string,
  localUserId: t.string
});

export const ConnectCrossposterPayloadValidator = t.strict({
  userId: t.string
});

export type ConnectCrossposterRequest = t.TypeOf<typeof ConnectCrossposterRequestValidator>;
export type ConnectCrossposterPayload = t.TypeOf<typeof ConnectCrossposterPayloadValidator>;

export const ConnectCrossposterResponseValidator = t.strict({
  foreignUserId: t.string,
  localUserId: t.string,
  status: t.literal('connected')
});

export type ConnectCrossposterResponse = t.TypeOf<typeof ConnectCrossposterResponseValidator>;

export type ConnectCrossposterArgs = {
  token: string,
}

export const UnlinkCrossposterRequestValidator = t.strict({
  token: t.string
});


export const UnlinkCrossposterPayloadValidator = t.strict({
  userId: t.string
}); 

export type UnlinkCrossposterRequest = t.TypeOf<typeof UnlinkCrossposterRequestValidator>;
export type UnlinkCrossposterPayload = t.TypeOf<typeof UnlinkCrossposterPayloadValidator>;

export const UnlinkedCrossposterResponseValidator = t.strict({
  status: t.literal('unlinked')
});

export type UnlinkedCrossposterResponse = t.TypeOf<typeof UnlinkedCrossposterResponseValidator>;

export const UpdateCrosspostRequestValidator = t.strict({
  token: t.string
});

export type UpdateCrosspostRequest = t.TypeOf<typeof UpdateCrosspostRequestValidator>;

export const UpdateCrosspostResponseValidator = t.strict({
  status: t.literal('updated')
});

const DenormalizedCrosspostValidator = t.strict({
  draft: t.boolean,
  deletedDraft: t.boolean,
  title: t.string,
  isEvent: t.boolean
});

export const UpdateCrosspostPayloadValidator = t.intersection([
  t.strict({
    postId: t.string,
  }),
  DenormalizedCrosspostValidator
]);

export type UpdateCrosspostResponse = t.TypeOf<typeof UpdateCrosspostResponseValidator>;
export type UpdateCrosspostPayload = t.TypeOf<typeof UpdateCrosspostPayloadValidator>;

export const CrosspostRequestValidator = t.strict({
  token: t.string
});

export type CrosspostRequest = t.TypeOf<typeof CrosspostRequestValidator>;

export const CrosspostResponseValidator = t.strict({
  postId: t.string,
  status: t.literal('posted')
});

export const CrosspostPayloadValidator = t.intersection([
  t.strict({
    localUserId: t.string,
    foreignUserId: t.string,
    postId: t.string,
  }),
  DenormalizedCrosspostValidator
]);

export type CrosspostResponse = t.TypeOf<typeof CrosspostResponseValidator>;
export type CrosspostPayload = t.TypeOf<typeof CrosspostPayloadValidator>;

export type Crosspost = Pick<DbPost, "_id" | "userId" | "fmCrosspost" | typeof denormalizedFieldKeys[number]>;

export const GetCrosspostRequestValidator = t.intersection([
  t.strict({
    documentId: t.string,
    collectionName: t.literal('Posts'),
    fragmentName: t.keyof({ 'PostsWithNavigation': null, 'PostsWithNavigationAndRevision': null }),
    extraVariables: t.strict({
      sequenceId: t.literal('String')
    }),
    extraVariablesValues: t.strict({
      sequenceId: t.union([t.string, t.null])
    }),
  }),
  t.partial({
    extraVariables: t.partial({
      version: t.literal('String')
    }),
    extraVariablesValues: t.partial({
      version: t.string
    })
  })
]);

export type GetCrosspostRequest = t.TypeOf<typeof GetCrosspostRequestValidator>;

interface PartialWithNullC<P extends t.Props>
  extends t.PartialType<
    P,
    {
      [K in keyof P]?: t.TypeOf<P[K]> | null
    },
    {
      [K in keyof P]?: t.OutputOf<P[K]> | null
    },
    unknown
  > {}

const partialWithNull = <P extends t.Props>(props: P): PartialWithNullC<P> => {
  return t.partial(Object.fromEntries(
    Object.entries(props).map(([key, validator]: [string, t.Type<any> | t.PartialType<any>]) => {
      if ('props' in validator) {
        return [key, t.union([t.null, partialWithNull(validator.props)])] as const;
      } else {
        return [key, t.union([t.null, validator])] as const;
      }
    })
  )) as unknown as PartialWithNullC<P>;
};

const CrosspostValidator = t.intersection([
  t.strict({
    _id: t.string,
    slug: t.string,  
  }),
  t.partial({
    isEvent: t.boolean,
  }),
  partialWithNull({
    __typename: t.literal('Post'),
    // tableOfContents: null,
    version: t.string,
    contents: t.partial({
      __typename: t.literal('Revision'),
      _id: t.string,
      version: t.string,
      updateType: t.keyof({ patch: null, minor: null, major: null, initial: null }),
      editedAt: t.string,
      userId: t.string,
      html: t.string,
      wordCount: t.number,
      htmlHighlight: t.string,
      plaintextDescription: t.string
    }),
    myEditorAccess: t.keyof({ none: null, read: null, comment: null, edit: null }),
    // linkSharingKey: null,
    // sequence: null,
    // prevPost: null,
    // nextPost: null,
    // canonicalSource: null,
    noIndex: t.boolean,
    // viewCount: null,
    socialPreviewImageUrl: t.string,
    // tagRelevance: {},
    // commentSortOrder: null,
    // collectionTitle: null,
    // canonicalPrevPostSlug: null,
    // canonicalNextPostSlug: null,
    // canonicalSequenceId: null,
    // canonicalBookId: null,
    // canonicalSequence: null,
    // canonicalBook: null,
    // canonicalCollection: null,
    // podcastEpisode: null,
    showModerationGuidelines: t.boolean,
    // bannedUserIds: null,
    // moderationStyle: null,
    // currentUserVote: null,
    // currentUserExtendedVote: null,
    // feedLink: null,
    // feed: null,
    // sourcePostRelations: [],
    // targetPostRelations: [],
    // rsvps: null,
    activateRSVPs: t.boolean,
    fmCrosspost: t.partial({
      isCrosspost: t.boolean,
      hostedHere: t.boolean,
      foreignPostId: t.string
    }),
    // podcastEpisodeId: null,
    readTimeMinutes: t.number,
    moderationGuidelines: t.partial({
      __typename: t.literal('Revision'),
      _id: t.string,
      html: t.string
    }),
    customHighlight: t.partial({
      __typename: t.literal('Revision'),
      _id: t.string,
      html: t.string
    }),
    // lastPromotedComment: null,
    // bestAnswer: null,
    // tags: [],
    // url: null,
    postedAt: t.string,
    // createdAt: null,
    sticky: t.boolean,
    metaSticky: t.boolean,
    stickyPriority: t.number,
    status: t.number,
    frontpageDate: t.string,
    meta: t.boolean,
    deletedDraft: t.boolean,
    // shareWithUsers: null,
    // sharingSettings: null,
    // coauthorStatuses: null,
    hasCoauthorPermission: t.boolean,
    commentCount: t.number,
    voteCount: t.number,
    baseScore: t.number,
    // extendedScore: null,
    unlisted: t.boolean,
    score: t.number,
    // lastVisitedAt: null,
    isFuture: t.boolean,
    isRead: t.boolean,
    lastCommentedAt: t.string,
    // lastCommentPromotedAt: null,
    // canonicalCollectionSlug: null,
    // curatedDate: null,
    // commentsLocked: null,
    // commentsLockedToAccountsCreatedAfter: null,
    question: t.boolean,
    hiddenRelatedQuestion: t.boolean,
    // originalPostRelationSourceId: null,
    userId: t.string,
    // location: null,
    // googleLocation: null,
    // onlineEvent: t.boolean,
    // globalEvent: t.boolean,
    // startTime: null,
    // endTime: null,
    // localStartTime: null,
    // localEndTime: null,
    // eventRegistrationLink: null,
    // joinEventLink: null,
    // facebookLink: null,
    // meetupLink: null,
    // website: null,
    // contactInfo: null,
    // eventImageId: null,
    // eventType: null,
    // types: [],
    // groupId: null,
    // reviewedByUserId: null,
    // suggestForCuratedUserIds: null,
    // suggestForCuratedUsernames: null,
    // reviewForCuratedUserId: null,
    authorIsUnreviewed: t.boolean,
    // afDate: null,
    // suggestForAlignmentUserIds: null,
    // reviewForAlignmentUserId: null,
    // afBaseScore: 1,
    // afExtendedScore: null,
    // afCommentCount: null,
    afLastCommentedAt: t.string,
    afSticky: t.boolean,
    hideAuthor: t.boolean,
    submitToFrontpage: t.boolean,
    shortform: t.boolean,
    onlyVisibleToLoggedIn: t.boolean,
    // reviewCount: null,
    // reviewVoteCount: null,
    // positiveReviewVoteCount: null,
    // reviewVoteScoreAllKarma: null,
    // reviewVotesAllKarma: null,
    // reviewVoteScoreHighKarma: null,
    // reviewVotesHighKarma: null,
    // reviewVoteScoreAF: null,
    // reviewVotesAF: null,
    // finalReviewVoteScoreHighKarma: null,
    // finalReviewVotesHighKarma: null,
    // finalReviewVoteScoreAllKarma: null,
    // finalReviewVotesAllKarma: null,
    // finalReviewVoteScoreAF: null,
    // finalReviewVotesAF: null,
    // group: null,
    // nominationCount2018: null,
    // reviewCount2018: null,
    // nominationCount2019: null,
    // reviewCount2019: null,
    user: t.partial({
      __typename: t.literal('User'),
      // biography: null,
      // profileImageId: null,
      // moderationStyle: null,
      // bannedUserIds: null,
      // moderatorAssistance: null,
      _id: t.string,
      slug: t.string,
      createdAt: t.string,
      username: t.string,
      displayName: t.string,
      // previousDisplayName: null,
      // fullName: null,
      // karma: null,
      // afKarma: null,
      // deleted: null,
      isAdmin: t.boolean,
      htmlBio: t.string,
      postCount: t.number,
      // commentCount: null,
      // sequenceCount: null,
      // afPostCount: null,
      afCommentCount: t.number,
      spamRiskScore: t.number,
      // tagRevisionCount: null
    }),
    coauthors: t.array(t.string),
    title: t.string,
    draft: t.boolean,
    hideCommentKarma: t.boolean,
    af: t.boolean,
    // currentUserReviewVote: null
  })
]);

export const GetCrosspostResponseValidator = t.strict({
  document: CrosspostValidator,
});


export type GetCrosspostResponse = t.TypeOf<typeof GetCrosspostResponseValidator>;

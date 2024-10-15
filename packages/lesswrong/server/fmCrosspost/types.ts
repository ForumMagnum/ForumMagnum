import * as t from 'io-ts';
import { crosspostFragments } from '../../components/hooks/useForeignCrosspost';

/**
 */
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

export const partialWithNull = <P extends t.Props>(props: P): PartialWithNullC<P> => {
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

type Writeable<T> = {
  -readonly [P in keyof T]: Writeable<T[P]>;
};

export type ReadonlyDenormalizedCrosspostData = t.TypeOf<typeof DenormalizedCrosspostValidator>;

export type DenormalizedCrosspostData = Writeable<ReadonlyDenormalizedCrosspostData>;

/**
 * In general, we try to keep a single source of truth for all post data that's
 * crossposted on the original server and let the foreign server make graphql
 * requests when it needs access to this.
 *
 * Some fields have to be denormalized across sites and these are defined here. In
 * general, a field needs to be denormalized if it's used by PostsList2 or
 * in database selectors (but these rules aren't strict).
 */
export const requiredDenormalizedFields = {
  draft: t.boolean,
  deletedDraft: t.boolean,
  title: t.string,
  isEvent: t.boolean,
  question: t.boolean,
} as const;

export const optionalDenormalizedFields = {
  url: t.string,
} as const;

export const DenormalizedCrosspostValidator = t.intersection([
  t.strict(requiredDenormalizedFields),
  partialWithNull(optionalDenormalizedFields),
]);

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


/**
 * Intersesction creates an intersection of types (i.e. type A & type B)
 */
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

/**
 * Intersesction creates an intersection of types (i.e. type A & type B)
 */
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

export type Crosspost = Pick<DbPost, "_id" | "userId" | "fmCrosspost" | "contents_latest"> & DenormalizedCrosspostData;

const getCrosspostFragmentsType = () => {
  const result: Partial<Record<FragmentName, null>> = {};
  for (const fragmentName of crosspostFragments) {
    result[fragmentName] = null;
  }
  return t.keyof(result);
}

/**
 * Intersesction creates an intersection of types (i.e. type A & type B)
 */
export const GetCrosspostRequestValidator = t.intersection([
  t.strict({
    documentId: t.string,
    collectionName: t.literal('Posts'),
    fragmentName: getCrosspostFragmentsType(),
  }),
  t.partial({
    extraVariables: t.strict({
      sequenceId: t.literal('String')
    }),
    extraVariablesValues: t.strict({
      sequenceId: t.union([t.string, t.null])
    }),
  })
]);

export type GetCrosspostRequest = t.TypeOf<typeof GetCrosspostRequestValidator>;


/**
 * Partial, in addition to treating all of the specified fields as optional, is permissive with respect to fields not specified
 * This means that all of the other fields not included in this validator but part of the requested fragment will still come back
 * i.e. tableOfContents, etc.  They simply won't be typed in the type extracted from the validator.
 */
// const CrosspostValidator = t.intersection([
//   // _id, slug, and isEvent are specified separately because `postGetPageUrl` requires those 3 fields to not have `null` as a possible value
//   t.strict({
//     _id: t.string,
//     slug: t.string,  
//   }),
//   t.partial({
//     isEvent: t.boolean,
//   }),
//   partialWithNull({
//     __typename: t.literal('Post'),
//     version: t.string,
//     contents: t.partial({
//       __typename: t.literal('Revision'),
//       _id: t.string,
//       version: t.string,
//       updateType: t.keyof({ patch: null, minor: null, major: null, initial: null }),
//       editedAt: t.string,
//       userId: t.string,
//       html: t.string,
//       wordCount: t.number,
//       htmlHighlight: t.string,
//       plaintextDescription: t.string
//     }),
//     myEditorAccess: t.keyof({ none: null, read: null, comment: null, edit: null }),
//     noIndex: t.boolean,
//     socialPreviewImageUrl: t.string,
//     activateRSVPs: t.boolean,
//     fmCrosspost: t.partial({
//       isCrosspost: t.boolean,
//       hostedHere: t.boolean,
//       foreignPostId: t.string
//     }),
//     readTimeMinutes: t.number,
//     moderationGuidelines: t.partial({
//       __typename: t.literal('Revision'),
//       _id: t.string,
//       html: t.string
//     }),
//     customHighlight: t.partial({
//       __typename: t.literal('Revision'),
//       _id: t.string,
//       html: t.string
//     }),
//     postedAt: t.string,
//     sticky: t.boolean,
//     metaSticky: t.boolean,
//     stickyPriority: t.number,
//     status: t.number,
//     frontpageDate: t.string,
//     meta: t.boolean,
//     deletedDraft: t.boolean,
//     hasCoauthorPermission: t.boolean,
//     commentCount: t.number,
//     voteCount: t.number,
//     baseScore: t.number,
//     unlisted: t.boolean,
//     score: t.number,
//     isFuture: t.boolean,
//     isRead: t.boolean,
//     lastCommentedAt: t.string,
//     question: t.boolean,
//     hiddenRelatedQuestion: t.boolean,
//     userId: t.string,
//     authorIsUnreviewed: t.boolean,
//     afLastCommentedAt: t.string,
//     afSticky: t.boolean,
//     hideAuthor: t.boolean,
//     submitToFrontpage: t.boolean,
//     shortform: t.boolean,
//     onlyVisibleToLoggedIn: t.boolean,
//     user: t.partial({
//       __typename: t.literal('User'),
//       _id: t.string,
//       slug: t.string,
//       createdAt: t.string,
//       username: t.string,
//       displayName: t.string,
//       isAdmin: t.boolean,
//       htmlBio: t.string,
//       postCount: t.number,
//       afCommentCount: t.number,
//       spamRiskScore: t.number,
//     }),
//     coauthors: t.array(t.string),
//     title: t.string,
//     draft: t.boolean,
//     hideCommentKarma: t.boolean,
//     af: t.boolean,
//   })
// ]);

export const GetCrosspostResponseValidator = t.strict({
  // document: CrosspostValidator,
  document: t.UnknownRecord
});


export type GetCrosspostResponse = t.TypeOf<typeof GetCrosspostResponseValidator>;

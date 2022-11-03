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
    extraVariableValues: t.strict({
      sequenceId: t.union([t.string, t.null])
    }),
  }),
  t.partial({
    extraVariables: t.partial({
      version: t.literal('String')
    }),
    extraVariableValues: t.partial({
      version: t.string
    })
  })
]);

export type GetCrosspostRequest = t.TypeOf<typeof GetCrosspostRequestValidator>;

export const GetCrosspostResponseValidator = t.strict({
  document: t.UnknownRecord,
});

export type GetCrosspostResponse = t.TypeOf<typeof GetCrosspostResponseValidator>;

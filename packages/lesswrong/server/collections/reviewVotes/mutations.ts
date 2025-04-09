
import schema from "@/lib/collections/reviewVotes/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { ensureUniqueVotes, positiveReviewVoteNotifications } from "@/server/callbacks/reviewVoteCallbacks";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";

type CreateReviewVoteDataInput = Partial<DbReviewVote>;
type UpdateReviewVoteDataInput = Partial<DbReviewVote>;

export async function createReviewVote({ data }: { data: CreateReviewVoteDataInput }, context: ResolverContext) {
  const { currentUser, ReviewVotes } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ReviewVotes', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  await ensureUniqueVotes(data, context);

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ReviewVotes', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ReviewVotes', documentWithId);

  await positiveReviewVoteNotifications(documentWithId, currentUser, ReviewVotes, afterCreateProperties);

  return documentWithId;
}

export async function updateReviewVote({ selector, data }: { selector: SelectorInput, data: UpdateReviewVoteDataInput }, context: ResolverContext) {
  const { currentUser, ReviewVotes } = context;

  const {
    documentSelector: reviewvoteSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ReviewVotes', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, ReviewVotes, reviewvoteSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ReviewVotes', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}



// This doesn't have CRUD mutations, the functions are used purely by `submitReviewVote`.

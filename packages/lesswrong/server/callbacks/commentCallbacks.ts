
import { DeleteCallbackProperties, getCollectionHooks } from '../mutationCallbacks';
import { commentsRemovePostCommenters, commentsRemoveChildrenComments } from './commentCallbackFunctions';

// TODO: what to do about these?  I don't see any deleteMutator calls on comments except in `commentsRemoveChildrenComments` itself
async function commentDeleteAsync(props: DeleteCallbackProperties<'Comments'>) {
  await commentsRemovePostCommenters(props);
  await commentsRemoveChildrenComments(props);

  // 12 countOfReferenceCallbacks
}


// getCollectionHooks('Comments').deleteAsync.add(commentDeleteAsync);

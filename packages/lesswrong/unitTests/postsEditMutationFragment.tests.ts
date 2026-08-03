import chai from 'chai';
import type { DocumentNode, FragmentDefinitionNode, SelectionSetNode } from 'graphql';
import { PostsEditMutationFragment, PostsListWithVotes } from '@/lib/collections/posts/fragments';

/**
 * Every field the fragment selects, as dot-separated paths ("user.displayName"),
 * with nested fragment spreads resolved against the document's own definitions.
 */
function getSelectedFieldPaths(document: DocumentNode, fragmentName: string): Set<string> {
  const fragments = new Map<string, FragmentDefinitionNode>();
  for (const definition of document.definitions) {
    if (definition.kind === 'FragmentDefinition') {
      fragments.set(definition.name.value, definition);
    }
  }

  const paths = new Set<string>();
  const collect = (selectionSet: SelectionSetNode, prefix: string) => {
    for (const selection of selectionSet.selections) {
      if (selection.kind === 'Field') {
        const path = prefix + selection.name.value;
        paths.add(path);
        if (selection.selectionSet) {
          collect(selection.selectionSet, `${path}.`);
        }
      } else if (selection.kind === 'InlineFragment') {
        collect(selection.selectionSet, prefix);
      } else {
        const spread = fragments.get(selection.name.value);
        if (spread) {
          collect(spread.selectionSet, prefix);
        }
      }
    }
  };

  const root = fragments.get(fragmentName);
  if (!root) throw new Error(`Fragment ${fragmentName} not found in document`);
  collect(root.selectionSet, '');
  return paths;
}

describe('PostsEditMutationFragment', () => {
  // PostsPageWrapper reads PostsListWithVotes out of the apollo cache so it can
  // render a post immediately. That read is all-or-nothing, so a single field
  // the save mutation doesn't write sends the freshly published post back to a
  // loading spinner. Adding a field to PostsList and forgetting PostsEdit is an
  // easy way to do that silently, hence this test rather than a comment.
  it('writes every field PostsListWithVotes reads back out of the cache', () => {
    const written = getSelectedFieldPaths(PostsEditMutationFragment, 'PostsEditMutationFragment');
    const read = getSelectedFieldPaths(PostsListWithVotes, 'PostsListWithVotes');

    const missing = [...read].filter((path) => !written.has(path));
    chai.assert.deepEqual(missing, [],
      `PostsEditMutationFragment is missing fields that PostsListWithVotes needs: ${missing.join(', ')}`);
  });
});

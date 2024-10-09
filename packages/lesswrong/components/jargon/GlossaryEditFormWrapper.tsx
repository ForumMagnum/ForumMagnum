import React from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useMutation, gql } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';
import Button from '@material-ui/core/Button';

const styles = (theme: ThemeType) => ({
  root: {

  },
  generateButton: {
    background: theme.palette.buttons.startReadingButtonBackground,

    // TODO: Pick typography for this button. (This is just the typography that
    // Material UI v0 happened to use.)
    fontWeight: 500,
    fontSize: "14px",
    fontFamily: "Roboto, sans-serif",
  },
});

export const GlossaryEditFormWrapper = (props: {
  classes: ClassesType<typeof styles>,
  document: PostsPage,
}) => {
  const { classes, document } = props;
  const { JargonEditorRow, LoadMore, Loading } = Components;

  const { results: glossary = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "jargonTerms",
      postId: document._id,
      limit: 100
    },
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
    ssr: true,
  })

  const sortedGlossary = [...glossary].sort((a, b) => {
    const termA = a.term.toLowerCase();
    const termB = b.term.toLowerCase();
    if (termA < termB) return -1;
    if (termA > termB) return 1;
    return 0;
  });

  const [getNewJargonTerms, { data, loading: mutationLoading, error }] = useMutation(gql`
    mutation getNewJargonTerms($postId: String!) {
      getNewJargonTerms(postId: $postId) {
        ...JargonTermsFragment
      }
      ${getFragment("JargonTermsFragment")}
    }
  `);

  const addNewJargonTerms = async () => { 
    try {
      const response = await getNewJargonTerms({
        variables: {
          postId: document._id,
        },
      });
      refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  return <div className={classes.root}>
    <div>
      <h1>Glossary</h1>
      <span>Beta feature! Select/edit terms below and readers of your post will be able to hover over them to read an explanation of the term.</span>
    </div>
    {!!sortedGlossary && <>{sortedGlossary.map((item: any) => !item.isAltTerm && <JargonEditorRow key={item._id} jargonTerm={item}/>)}</>}
    <LoadMore {...loadMoreProps} />
    <Button onClick={addNewJargonTerms} className={classes.generateButton}>Generate new terms</Button>
    {mutationLoading && <Loading/>}
  </div>;
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}

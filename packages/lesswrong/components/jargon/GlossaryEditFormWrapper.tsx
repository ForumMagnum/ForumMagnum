// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
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

  // Define the mutation at the top level of your component
  const [getNewJargonTerms, { data, loading: mutationLoading, error }] = useMutation(gql`
    mutation getNewJargonTerms($postId: String!) {
      getNewJargonTerms(postId: $postId) {
        term
        contents {
          originalContents {
            data
            type
          }
        }
        altTerms
      }
    }
  `);

  // Event handler function
  const addNewJargonTerms = async () => { 
    try {
      const response = await getNewJargonTerms({
        variables: {
          postId: document._id,
        },
      });
      refetch();
      // Handle the response data as needed
    } catch (err) {
      // Handle the error as needed
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  return <div className={classes.root}>
    {/* {!glossary && <GlossaryEditForm postId={document._id} />} */}
    <div>
      <h1>Glossary</h1>
      <span>Beta feature! Select/edit terms below and readers of your post will be able to hover over them to read an explanation of the term.</span>
    </div>
    {!!glossary && <>{glossary.map((item: any) => !item.isAltTerm && <JargonEditorRow key={item._id} jargonTerm={item}/>)}</>}
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

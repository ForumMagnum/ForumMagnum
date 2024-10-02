// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMutation, gql } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: {

  },
});

export const GlossaryEditFormWrapper = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsPage,
}) => {

  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { GlossaryEditForm, JargonEditorRow, ToggleSwitch } = Components;

  // const [glossary, setGlossary] = React.useState(() => {
  //   const savedGlossary = localStorage.getItem(`glossary-${post._id}`);
  //   return savedGlossary ? JSON.parse(savedGlossary) : null;
  // });

  const { results: glossary = [], loading } = useMulti({
    terms: {
      view: "jargonTerms",
      postId: post._id,
      rejected: false,
      forLaTeX: false,
    },
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
  })

  console.log({glossary});

  // Define the mutation at the top level of your component
  const [makeNewJargonTerms, { data, loading: mutationLoading, error }] = useMutation(gql`
    mutation makeNewJargonTerms($postId: String!) {
      makeNewJargonTerms(postId: $postId) {
        term
        contents
        altTerms
      }
    }
  `);

  // Event handler function
  const addNewJargonTerms = async () => {
    try {
      const response = await makeNewJargonTerms({
        variables: {
          postId: post._id,
        },
      });
      // Handle the response data as needed
      console.log(response.data);
    } catch (err) {
      // Handle the error as needed
      console.error(err);
    }
  };

  // React.useEffect(() => {
  //   if (glossary) {
  //     localStorage.setItem(`glossary-${post._id}`, JSON.stringify(glossary));
  //   }
  // }, [glossary, post._id]);

  // const handleTextChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setGlossary((prevGlossary: any) => ({
  //     ...prevGlossary,
  //   [key]: {
  //     ...prevGlossary[key],
  //     props: {
  //       ...prevGlossary[key].props,
  //       text: event.target.value,
  //     },
  //   },
  //   }));
  // };

 

  return <div className={classes.root}>
    {!glossary && <GlossaryEditForm postId={post._id} />}
    {!!glossary && <>{glossary.map((item: any) => !item.isAltTerm && <JargonEditorRow key={item} glossaryProps={item.props}/>)}</>}
    <div onClick={addNewJargonTerms}>Generate new terms</div>
  </div>;
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}

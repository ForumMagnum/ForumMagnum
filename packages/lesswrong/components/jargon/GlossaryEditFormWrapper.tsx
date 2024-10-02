// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { commentBodyStyles } from '@/themes/stylePiping';
import { userIsAdmin } from '@/lib/vulcan-users';
import { getLatestContentsRevision } from '@/lib/collections/revisions/helpers';
import { PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';
import { ContentReplacedSubstringComponentInfo } from '../common/ContentItemBody';
import { gql, useQuery } from '@apollo/client';
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

  const addNewJargonTerms = () => {
    const { data, refetch: refetchCount } = useQuery(gql`
      mutation GetNewJargonTerms {
        getNewJargonTerms(postId: "${post._id}") {
          term
          contents
          altTerms
          isAltTerm
        }
      }
    `, {
      ssr: true,
      variables: {
        postId: post._id,
        currentJargonTerms: glossary,
      }
    })
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
    {!!glossary && <>{glossary.map((item: any) => !item.isAltTerm && <JargonEditorRow key={item} glossaryProps={item.props}/>)}</>
    }
    <div onClick={addNewJargonTerms}>Generate new terms</div>
  </div>;
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}

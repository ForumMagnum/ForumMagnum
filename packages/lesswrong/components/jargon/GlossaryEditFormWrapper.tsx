// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { commentBodyStyles } from '@/themes/stylePiping';
import { userIsAdmin } from '@/lib/vulcan-users';
import { getLatestContentsRevision } from '@/lib/collections/revisions/helpers';
import { PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';
import { getAnthropicPromptCachingClientOrThrow } from '@/server/languageModels/anthropicClient';
import { jargonBotClaudeKey } from '@/lib/instanceSettings';
import { exampleJargonPost2, exampleJargonGlossary2 } from '@/server/resolvers/exampleJargonPost';
import { ContentReplacedSubstringComponentInfo } from '../common/ContentItemBody';

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

  const claudeKey = jargonBotClaudeKey.get()

  async function queryClaudeJailbreak(prompt: PromptCachingBetaMessageParam[], maxTokens: number, systemPrompt: string) {
    const client = getAnthropicPromptCachingClientOrThrow(claudeKey)
    return await client.messages.create({
      system: systemPrompt,
      model: "claude-3-5-sonnet-20240620",
      max_tokens: maxTokens,
      messages: prompt
    })
  }

  const [glossary, setGlossary] = React.useState(() => {
    const savedGlossary = localStorage.getItem(`glossary-${post._id}`);
    return savedGlossary ? JSON.parse(savedGlossary) : null;
  });

  React.useEffect(() => {
    if (glossary) {
      localStorage.setItem(`glossary-${post._id}`, JSON.stringify(glossary));
    }
  }, [glossary, post._id]);

  const handleTextChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setGlossary((prevGlossary: any) => ({
      ...prevGlossary,
    [key]: {
      ...prevGlossary[key],
      props: {
        ...prevGlossary[key].props,
        text: event.target.value,
      },
    },
    }));
  };

  const newJargonTerms = async () => {
    if (!userIsAdmin(context.currentUser)) {
      return null;
    }
  
    const initialGlossaryPrompt = `please provide a list of all the jargon terms in the text (technical terms, acronyms, words used unusually in this context) that are not common knowledge. It should also include every LateX term, and equation.The output should be a simple list of terms, with no other text. It should be extensive, covering all terms that might be difficult for an educated layman.
            
Separate the english terms from math terms.
            `
  
    const formatPrompt = `You’re a Glossary AI. Your goal is to make good explanations for both technical jargon terms, and math (LaTeX) terms and equations. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a layman. The glossary should contain the term and some text explaining it. Analyze this post and output in a JSON array of objects with keys: term: "term” (string), altTerms: string[], text: text (html string). The output should look like [{term: "term1", altTerms: ["term1s", "Term1"], text: "Term 1 explanation text"}, {term: "term2", altTerms: ["term2s", "Term2"], text: "term2 explanation text"}]. Do not return anything else.`
  
    const glossarySystemPrompt = `You’re a Glossary AI. Your goal is to make good explanations for both technical jargon terms, and math (LaTeX) terms and equations. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a smart, widely read layman. We're about to provide you with the text of an essay, followed by a list of jargon terms and math terms for that essay. For each term, provide:
  
The term itself (wrapped in a strong tag), followed by a concise one-line definition. Then, on a separate paragraph, explain how the term is used in this context. Include where the term is originally from (whether it's established from an academic field, new to LessWrong or this particular post, or something else. Note what year it was first used in this context if possible).

Ensure that your explanations are clear and accessible to someone who may not be familiar with the subject matter. Follow Strunk and White guidelines. 

Use your general knowledge as well as the post's specific explanations or definitions of the terms to find a good definition of each term. 

Include a set of altTerms that are slight variations of the term, such as plurals, different capitalizations that appear in the text, or alternate spellings. Make sure to include all variations that appear in the text.

Make sure to to include all technical terms, followed by all math terms.
`

    const contents = post.contents;
    const originalHtml = contents?.html ?? ""
    const html = (originalHtml.length < 200 * 1000) ? originalHtml : originalHtml.slice(0, 200 * 1000)

    const termsResponse = await queryClaudeJailbreak([
      {
        role: "user", 
        content: [{
          type: "text", 
          text: `${initialGlossaryPrompt} The text is: ${html}.
          
The jargon terms are:`
          }]
        }
    ], 5000, "You return a list of terms, with no other text.")

    console.log("termsResponse", termsResponse)

    if (!(termsResponse.content[0].type === "text")) return null
    
    const response = await queryClaudeJailbreak([
      {
        role: "user", 
        content: [{
          type: "text", 
          text: `${formatPrompt} The text is: ${exampleJargonPost2}`}]
      },
      { role: "assistant", 
        content: [{
          type: "text", 
          text: `${exampleJargonGlossary2}`
        }]
      },
      {
        role: "user",
        content: [{
          type: "text",
          text: `${formatPrompt} The text is: ${html}. The jargon and math terms are: ${termsResponse.content[0].text}`
        }]
      }, 
    ], 5000, glossarySystemPrompt)
    if (!(response.content[0].type === "text")) return null

    let jargonTerms: Array<{ term: string, altTerms: string[], text: string }> = []

    const text = response.content[0].text
    const jsonGuessMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/)
    if (jsonGuessMatch) {
      jargonTerms = JSON.parse(jsonGuessMatch[0])
    } else {
      jargonTerms = []
    }
    
    let glossary: Record<string, ContentReplacedSubstringComponentInfo> = {}

    for (const term of jargonTerms) {
      const allTerms = [term.term, ...(term.altTerms ?? [])]
      for (const t of allTerms) {
        glossary[t] = {
          componentName: "JargonTooltip",
          props: {
            term: t,
            text: term.text,
            altTerms: [term.term, ...(term.altTerms ?? [])],
            isAltTerm: term.altTerms.includes(t),
          },
        }
      }
    }
    console.log("glossary", glossary)
    return glossary
  }

  return <div className={classes.root}>
    {!glossary && <GlossaryEditForm postId={post._id} />}
    {!!glossary && <>{Object.keys(glossary).map((item: any) => !glossary[item].props.isAltTerm &&
      <JargonEditorRow key={item} glossaryProps={glossary[item].props}/>
    )}
    </>
    }
    <div onClick={newJargonTerms}>Generate new terms</div>
  </div>;
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}

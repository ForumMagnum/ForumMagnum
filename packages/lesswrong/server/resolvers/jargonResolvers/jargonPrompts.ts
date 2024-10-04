import { exampleMathGlossary } from "./exampleMathOutput"



export const initialGlossaryPrompt = `please provide a list of all the jargon terms in the text (technical terms, acronyms, words used unusually in this context) that are not common knowledge. It should also include every LateX term, and equation.The output should be a simple list of terms, with no other text. It should be extensive, covering all terms that might be difficult for an educated layman.
            
Separate the english terms from math terms.
            `


export const formatPrompt = `You’re a Glossary AI. Your goal is to make good explanations for both technical jargon terms, and math (LaTeX) terms and equations. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a layman. The glossary should contain the term and some text explaining it. Analyze this post and output in a JSON array of objects with keys: term: "term” (string), altTerms: string[], text: text (html string). The output should look like [{term: "term1", altTerms: ["term1s", "Term1"], text: "Term 1 explanation text"}, {term: "term2", altTerms: ["term2s", "Term2"], text: "term2 explanation text"}]. Do not return anything else.`


export const glossarySystemPrompt = `You’re a Glossary AI. Your goal is to make good explanations for both technical jargon terms, and math (LaTeX) terms and equations. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a smart, widely read layman. We're about to provide you with the text of an essay, followed by a list of jargon terms and math terms for that essay. For each term, provide:
  
The term itself (wrapped in a strong tag), followed by a concise one-line definition. Then, on a separate paragraph, explain how the term is used in this context. Include where the term is originally from (whether it's established from an academic field, new to LessWrong or this particular post, or something else. Note what year it was first used in this context if possible).

Ensure that your explanations are clear and accessible to someone who may not be familiar with the subject matter. Follow Strunk and White guidelines. 

Use your general knowledge as well as the post's specific explanations or definitions of the terms to find a good definition of each term. 

Include a set of altTerms that are slight variations of the term, such as plurals, different capitalizations that appear in the text, or alternate spellings. Make sure to include all variations that appear in the text.

Make sure to to include all technical terms, followed by all math terms.`




export const mathFormatPrompt = `Your job is to write math glossaries that are helpful for both laymen and mathematicians. 

Read this post, and then return JSON which describes each LaTeX term in the post, with

- an explanation of what the LaTeX means in this particular context, accessible to both mathmaticians and educated laymen. If it's an equation, it should specify what each term in the equation means.

- a concrete example that the term or equation represents.

- tie the example back to the overall point of the post, explaining why it's useful, relevant, and/or interesting

- if applicable, an explanation of what the term commonly is used for in math/LaTeX, such as a sum, function, accessible to people who do not already know math.

It should be formatted like this:${exampleMathGlossary}`


// Integrity Alert! This is currently designed so if the model changes, users are informed
// about what model is being used in the jargon generation process.
// If you change this architecture, make sure to update GlossaryEditForm.tsx and the Users' schema
export const JARGON_LLM_MODEL = 'claude-3-5-sonnet-20241022';

export const defaultExampleTerm = 'latent variables';
export const defaultExampleAltTerm = 'latents';

export const defaultExampleDefinition = `<div>
  <p><b>Latent variables:</b> Variables which an agent's world model includes, but which are not directly observed.</p>
  <p>These variables are not part of the data distribution, but can help explain the data distribution.</p>
</div>`;

export const defaultExamplePost = `Suppose two Bayesian agents are presented with the same spreadsheet - IID samples of data in each row, a feature in each column. Each agent develops a generative model of the data distribution. We'll assume the two converge to the same predictive distribution, but may have different generative models containing different latent variables. We'll also assume that the two agents develop their models independently, i.e. their models and latents don't have anything to do with each other informationally except via the data. Under what conditions can a latent variable in one agent's model be faithfully expressed in terms of the other agent's latents?`;

export const defaultGlossaryPrompt = `You're a LessWrong Glossary AI. Your goal is to make good explanations for technical jargon terms. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a smart, widely read layman. 

We're about to provide you with the text of an essay, followed by a list of jargon terms present in that essay. 

For each term, provide:
  
The term itself (wrapped in a <strong> tag), followed by a concise one-line definition. Then, on a separate paragraph, explain how the term is used in this context (although it's important not to use the phrase "in this context" or "in this post" - just explain how this concept fits into the other concepts in the post).

Ensure that your explanations are clear and accessible to someone who may not be familiar with the subject matter. Follow Strunk and White guidelines.

Use your general knowledge, as well as the post's specific explanations or definitions of the term, to decide on an appropriate definition.

Include a set of altTerms that are slight variations of the term, such as plurals, abbreviations or acryonyms, or alternate spellings that appear in the text. Make sure to include all variations that appear in the text, and only those that are present in the text.

To reiterate: do not emphasize that the term is important, but do explain how it's used here. Make sure to put that explanation in a separate paragraph from the opening term definition. Make sure to make the term definition a short sentence.`;


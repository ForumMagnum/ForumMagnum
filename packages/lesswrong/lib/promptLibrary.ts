/// REFACTOR THIS INTO SOMETHING SENSIBLE

export type Prompt = {
  title: string;
  description: string;
  prompt: string;
}



export const rightBranchingPrompt: Prompt = {
  title: "Right-branching Readability",
  description: "Improve readability by restructuring sentences to avoid taxing working memory.",
  prompt: `Given the following post, figure out which sentences are the most left-branching and difficult to follow, and then suggest edits to make them easier to understand.  

When suggesting edits, please write out a parse tree of the original text, using the edit's "reasoning" field.

Then, rewrite the text to be more right-branching, while changing as little of the vocabulary as possible.`
}

export const danglingSentencesPrompt: Prompt = {
  title: "Fix Dangling Sentences",
  description: "Identify dangling sentences and suggest fixes",
  prompt: `Given the following post, identify any sentences that are dangling, and leave suggestions with your best guess of how to finish the sentence, considering the context of the sentence and the author's voice`
}

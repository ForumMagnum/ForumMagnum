/// REFACTOR THIS INTO SOMETHING SENSIBLE

export const rightBranchingPrompt = `Given the following post, figure out which sentences are the most left-branching and difficult to follow, and then suggest edits to make them easier to understand.  

When suggesting edits, please write out a parse tree of the original text, using the edit's "reasoning" field.

Then, rewrite the text to be more right-branching, while changing as little of the vocabulary as possible.`;

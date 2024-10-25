export const initialGlossaryPrompt = `Please provide a list of all the jargon terms (technical terms, acronyms, words used unusually in this context) in the following post that are not common knowledge on LessWrong. The output should be an array of strings. It should be comprehensive, covering all terms that might be be unfamiliar to an educated layman, with particular focus on terms unique to the communities of LessWrong, AI Alignment, or Effective Altruism.

Avoid including terms that are 3+ word phrases unless it is a complete noun-phrase where all the words are an important part of the term.

Do not include any basic LessWrong terms such as 'LessWrong', 'Rationality', 'Effective Altruism', etc.
`

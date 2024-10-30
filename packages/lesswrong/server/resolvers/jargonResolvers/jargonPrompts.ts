export const initialGlossaryPrompt = `Please provide a list of all the jargon terms (technical terms, acronyms, words used unusually in this context) in the following post that are not common knowledge on LessWrong. The output should be an array of strings. It should be comprehensive, covering all terms that might be be unfamiliar to an educated layman.

Avoid including terms that are 3+ word phrases unless it is a complete noun-phrase where all the words are an important part of the term.

Then, return a second list of terms that are likely known to LessWrong readers.  It's fine if the second list is empty, if the first list is composed entirely of terms that are highly technical.`;

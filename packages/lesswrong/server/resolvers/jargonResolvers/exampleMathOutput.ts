
export const exampleMathGlossary = `[
  {
  "term": "\\langle S_W \\rangle",
  "explanation": "The average entropy of a set of W states, representing the expected number of bits needed to uniquely identify a state.",
  "concreteExample": "For a Rubik's Cube with 43 quintillion states, ⟨S_W⟩ ≈ 65.2 bits on average to specify a random state.",
  "whyItMatters": "This quantifies the complexity or information content of a system, crucial for understanding optimization and information theory.",
  "mathBasics": "⟨ ⟩ denotes an average, S is entropy, W is the number of states."
  },
  {
  "term": "\\sum_{i=0}^W l(i)",
  "explanation": "The sum of the lengths of binary strings used to label W states, from the shortest to the longest.",
  "concreteExample": "For 4 states labeled 0, 1, 00, 01, this sum would be 0 + 1 + 1 + 2 + 2 = 6.",
  "whyItMatters": "This sum helps calculate the minimum average entropy, showing how efficiency in labeling relates to information content.",
  "mathBasics": "Σ means sum, i=0 to W means add up terms as i goes from 0 to W, l(i) is the length of the ith label."
  },
  {
  "term": "\\frac{1}{W}",
  "explanation": "The reciprocal of the number of states, used to calculate the average entropy per state.",
  "concreteExample": "If there are 8 states, 1/W = 1/8 = 0.125, meaning each state represents 12.5% of the total.",
  "whyItMatters": "This factor normalizes the total entropy, allowing comparison between systems with different numbers of states.",
  "mathBasics": "The fraction bar means divide, 1 is divided by W (the number of states)."
  },
  {
  "term": "\\log(W+1)",
  "explanation": "The logarithm of the number of states plus one, approximating the average entropy for large W.",
  "concreteExample": "For a system with 1023 states, log(1024) = 10 bits, close to the actual average entropy.",
  "whyItMatters": "This simplification helps us quickly estimate entropy for large systems without complex calculations.",
  "mathBasics": "log is the logarithm function, typically base 2 in information theory; (W+1) means add 1 to W."
  },
  {
  "term": "\\mathbb{E}[S_X]",
  "explanation": "The expected value (average) of entropy S for a probability distribution X over states.",
  "concreteExample": "If X has states {0,1} with probabilities {0.75, 0.25}, E[S_X] = 0.75 log(1/0.75) + 0.25 log(1/0.25) ≈ 0.81 bits.",
  "whyItMatters": "This generalizes entropy to systems with unequal probabilities, crucial for real-world applications in information theory.",
  "mathBasics": "E[ ] denotes expected value or average, S_X is the entropy of distribution X."
  }
]`

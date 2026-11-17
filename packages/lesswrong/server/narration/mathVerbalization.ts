import { generateText, Output } from "ai";
import { z } from "zod";
import chunk from "lodash/chunk";

const MATH_VERBALIZATION_MODEL = "anthropic/claude-sonnet-5.5";
const EQUATIONS_PER_REQUEST = 25;

const MATH_VERBALIZATION_SYSTEM_PROMPT = `You prepare LaTeX math for a text-to-speech narrator who is reading a blog post aloud.

You'll be given a JSON array of equations. Each has an "id", the LaTeX source ("latex"), whether it is a display equation on its own line ("display"), and the text around it ("context", in which equations appear as $...$).

For each equation, write the words a careful human narrator would say when reading it aloud in an English audiobook. For example:
- x^2 becomes "x squared"
- P(A|B) becomes "the probability of A given B"
- \\frac{a}{b} becomes "a over b"
- \\sum_{i=1}^n x_i becomes "the sum from i equals 1 to n of x sub i"
- O(n \\log n) becomes "O of n log n"
- \\mathbb{R}^n becomes "R n"

Use the context to resolve notation that could be read more than one way, and to match what the author calls things.

Write plain words only: no LaTeX, no math symbols, no markdown, and no quotation marks around the reading. Spell out Greek letters and operators. Keep variable names as their letters. Read text inside \\text{} as it is written. Don't explain or comment on the math. If an equation has nothing to read aloud, give an empty string.

Give exactly one reading for each equation, labelled with that equation's id.`;

const mathVerbalizationSchema = z.object({
  readings: z.array(z.object({
    id: z.number(),
    reading: z.string(),
  })),
});

export interface EquationToVerbalize {
  latex: string
  display: boolean
  context: string
}

async function verbalizeEquationBatch(equations: EquationToVerbalize[]): Promise<string[]> {
  const result = await generateText({
    model: MATH_VERBALIZATION_MODEL,
    system: MATH_VERBALIZATION_SYSTEM_PROMPT,
    prompt: JSON.stringify(equations.map((equation, id) => ({ id, ...equation }))),
    output: Output.object({ schema: mathVerbalizationSchema }),
    maxOutputTokens: 16000,
  });
  const readingsById = new Map(result.output.readings.map(({ id, reading }) => [id, reading]));
  return equations.map((equation, id) => {
    const reading = readingsById.get(id);
    if (reading === undefined) {
      throw new Error(`Math verbalization returned no reading for equation: ${equation.latex}`);
    }
    return reading;
  });
}

/**
 * Converts equations to the words that should be spoken for them. Returns one
 * reading per equation, in the same order.
 */
export async function verbalizeEquations(equations: EquationToVerbalize[]): Promise<string[]> {
  const readingsByBatch = await Promise.all(chunk(equations, EQUATIONS_PER_REQUEST).map(verbalizeEquationBatch));
  return readingsByBatch.flat();
}

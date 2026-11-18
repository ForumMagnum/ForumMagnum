import { generateText, Output } from "ai";
import { z } from "zod";

export const NARRATION_READING_MODEL = "anthropic/claude-sonnet-5.5";

const readingsSchema = z.object({
  readings: z.array(z.object({
    id: z.number(),
    reading: z.string(),
  })),
});

/**
 * Asks a language model how each of a list of items should be read aloud. The
 * prompt must give each item an `id` from 0 to itemCount-1, and the system
 * prompt must ask for one reading per item, labelled with that id. Readings
 * are matched up by id rather than by position, because a model that drops or
 * merges one item would otherwise shift every reading after it.
 */
export async function generateReadings({ system, prompt, itemCount }: {
  system: string
  prompt: string
  itemCount: number
}): Promise<string[]> {
  const result = await generateText({
    model: NARRATION_READING_MODEL,
    system,
    prompt,
    output: Output.object({ schema: readingsSchema }),
    maxOutputTokens: 16000,
  });
  const readingsById = new Map(result.output.readings.map(({ id, reading }) => [id, reading]));
  return Array.from({ length: itemCount }, (_, id) => {
    const reading = readingsById.get(id);
    if (reading === undefined) {
      throw new Error(`The model returned no reading for item ${id} of: ${prompt.slice(0, 500)}`);
    }
    return reading;
  });
}

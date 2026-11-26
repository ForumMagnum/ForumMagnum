import chunk from "lodash/chunk";
import { generateReadings } from "./llmReadings";

const ROWS_PER_REQUEST = 40;

const TABLE_VERBALIZATION_SYSTEM_PROMPT = `You prepare tables for a text-to-speech narrator who is reading a blog post aloud. Listeners can't see the table, so what's said for each row has to make sense when heard.

You'll be given JSON with:
- "precedingText": the text that comes just before the table in the post
- "headers": the cells of the table's header rows, if it has any
- "rows": the rows to write readings for. Each has an "id", whether it is a header row ("isHeader"), and its "cells". Equations in cells appear as $...$ LaTeX.

For each row, write what the narrator should say for it, as natural sentences. Use the headers to say what each value is, and rephrase so that it reads as prose rather than as a list of cells: change word order, articles, tense and parts of speech as needed, but don't add anything that isn't in the table, and don't leave anything out. For example, with the headers "When" and "Feeling", the row "2024 | LLMs are toys" becomes "In 2024, LLMs were toys."

If a row is a grid of terse values such as numbers or yes/no, say each value with the name of its column: "For the baseline model, accuracy was 71 percent and recall was 64 percent."

For a header row, give an empty string if its headers are worked into the readings of the other rows. Otherwise give a short lead-in that names the columns.

Write plain words only: no markdown, no LaTeX (say equations in words), and nothing that can't be spoken. Skip empty cells. End each reading with a full stop.

Give exactly one reading for each row, labelled with that row's id.`;

export interface TableRowToVerbalize {
  isHeader: boolean
  cells: string[]
}

export interface TableToVerbalize {
  precedingText: string
  rows: TableRowToVerbalize[]
}

async function verbalizeTable({ precedingText, rows }: TableToVerbalize): Promise<string[]> {
  const headers = rows.filter(row => row.isHeader).map(row => row.cells);
  const readingsByBatch = await Promise.all(chunk(rows, ROWS_PER_REQUEST).map(batch => generateReadings({
    system: TABLE_VERBALIZATION_SYSTEM_PROMPT,
    prompt: JSON.stringify({
      precedingText,
      headers,
      rows: batch.map((row, id) => ({ id, ...row })),
    }),
    itemCount: batch.length,
  })));
  return readingsByBatch.flat();
}

/**
 * Converts tables to what should be spoken for them. Returns, for each table,
 * one reading per row; a reading can be empty, for a row (usually the header)
 * that shouldn't be read on its own.
 */
export function verbalizeTables(tables: TableToVerbalize[]): Promise<string[][]> {
  return Promise.all(tables.map(verbalizeTable));
}

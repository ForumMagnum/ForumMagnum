import {
  $getRoot,
  $setSelection,
  type LexicalEditor,
} from "lexical";
import {
  $createTableNodeWithDimensions,
  $createTableSelectionFrom,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellNode,
  TableNode,
} from "@lexical/table";
import {
  $deleteCompleteTableSelection,
  $getCompleteTableSelectionDeleteAction,
} from "@/components/editor/lexicalPlugins/tables/TablesPlugin";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { runEditorUpdate } from "./lexicalTestHelpers";

async function setupEditorWithTable(rows: number, columns: number): Promise<LexicalEditor> {
  const editor = createHeadlessEditor("tableKeyboardDelete.tests");
  await runEditorUpdate(editor, () => {
    const root = $getRoot();
    root.clear();
    root.append($createTableNodeWithDimensions(rows, columns, false));
  });
  return editor;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function $getOnlyTable(): TableNode {
  const table = $getRoot().getFirstChild();
  invariant($isTableNode(table), "Expected root to contain a table");
  return table;
}

function $getCell(table: TableNode, rowIndex: number, columnIndex: number): TableCellNode {
  const row = table.getChildAtIndex(rowIndex);
  invariant($isTableRowNode(row), `Expected row ${rowIndex}`);

  const cell = row.getChildAtIndex(columnIndex);
  invariant($isTableCellNode(cell), `Expected cell ${rowIndex},${columnIndex}`);
  return cell;
}

function $selectCells(startRow: number, startColumn: number, endRow: number, endColumn: number): void {
  const table = $getOnlyTable();
  const anchorCell = $getCell(table, startRow, startColumn);
  const focusCell = $getCell(table, endRow, endColumn);
  $setSelection($createTableSelectionFrom(table, anchorCell, focusCell));
}

function getTableDimensions(editor: LexicalEditor): { rows: number; columns: number } {
  let rows = 0;
  let columns = 0;
  editor.getEditorState().read(() => {
    const table = $getOnlyTable();
    const rowNodes = table.getChildren().filter($isTableRowNode);
    rows = rowNodes.length;
    const firstRow = rowNodes[0];
    columns = firstRow ? firstRow.getChildren().filter($isTableCellNode).length : 0;
  });
  return { rows, columns };
}

function hasTable(editor: LexicalEditor): boolean {
  let result = false;
  editor.getEditorState().read(() => {
    result = $isTableNode($getRoot().getFirstChild());
  });
  return result;
}

function getActionType(editor: LexicalEditor): string | null {
  let result: string | null = null;
  editor.getEditorState().read(() => {
    result = $getCompleteTableSelectionDeleteAction()?.type ?? null;
  });
  return result;
}

async function selectCellsAndDelete(
  editor: LexicalEditor,
  startRow: number,
  startColumn: number,
  endRow: number,
  endColumn: number,
): Promise<boolean> {
  let deleted = false;
  await runEditorUpdate(editor, () => {
    $selectCells(startRow, startColumn, endRow, endColumn);
    deleted = $deleteCompleteTableSelection();
  });
  return deleted;
}

describe("table keyboard deletion helpers", () => {
  it("deletes a complete selected row", async () => {
    const editor = await setupEditorWithTable(3, 3);

    await runEditorUpdate(editor, () => {
      $selectCells(1, 0, 1, 2);
    });
    expect(getActionType(editor)).toBe("rows");

    const deleted = await selectCellsAndDelete(editor, 1, 0, 1, 2);
    expect(deleted).toBe(true);
    expect(getTableDimensions(editor)).toEqual({ rows: 2, columns: 3 });
  });

  it("deletes a complete selected column", async () => {
    const editor = await setupEditorWithTable(3, 3);

    await runEditorUpdate(editor, () => {
      $selectCells(0, 1, 2, 1);
    });
    expect(getActionType(editor)).toBe("columns");

    const deleted = await selectCellsAndDelete(editor, 0, 1, 2, 1);
    expect(deleted).toBe(true);
    expect(getTableDimensions(editor)).toEqual({ rows: 3, columns: 2 });
  });

  it("does not structurally delete a partial rectangular selection", async () => {
    const editor = await setupEditorWithTable(3, 3);

    await runEditorUpdate(editor, () => {
      $selectCells(0, 0, 1, 1);
    });
    expect(getActionType(editor)).toBe(null);

    const deleted = await selectCellsAndDelete(editor, 0, 0, 1, 1);
    expect(deleted).toBe(false);
    expect(getTableDimensions(editor)).toEqual({ rows: 3, columns: 3 });
  });

  it("deletes the table when the whole table is selected", async () => {
    const editor = await setupEditorWithTable(2, 2);

    await runEditorUpdate(editor, () => {
      $selectCells(0, 0, 1, 1);
    });
    expect(getActionType(editor)).toBe("table");

    const deleted = await selectCellsAndDelete(editor, 0, 0, 1, 1);
    expect(deleted).toBe(true);
    expect(hasTable(editor)).toBe(false);
  });
});

import type { TableCellNode, TableRowNode } from '@lexical/table';
import type { NodeKey } from 'lexical';
import { createCommand } from 'lexical';

export type InsertTableCommandPayload = Readonly<{
  columns: string;
  rows: string;
  includeHeaders?: {
    rows: boolean;
    columns: boolean;
  };
  fullWidth?: boolean;
}>;

export const INSERT_TABLE_COMMAND = createCommand<InsertTableCommandPayload>('SUGGESTION_STUB_INSERT_TABLE_COMMAND');
export const INSERT_TABLE_ROW_COMMAND = createCommand<{ insertAfter: boolean }>('SUGGESTION_STUB_INSERT_TABLE_ROW_COMMAND');
export const INSERT_TABLE_COLUMN_COMMAND = createCommand<{ insertAfter: boolean }>(
  'SUGGESTION_STUB_INSERT_TABLE_COLUMN_COMMAND',
);
export const DUPLICATE_TABLE_ROW_COMMAND = createCommand<TableRowNode>('SUGGESTION_STUB_DUPLICATE_TABLE_ROW_COMMAND');
export const DUPLICATE_TABLE_COLUMN_COMMAND = createCommand<TableCellNode>(
  'SUGGESTION_STUB_DUPLICATE_TABLE_COLUMN_COMMAND',
);
export const DELETE_TABLE_COMMAND = createCommand<NodeKey>('SUGGESTION_STUB_DELETE_TABLE_COMMAND');
export const DELETE_TABLE_ROW_COMMAND = createCommand<TableRowNode>('SUGGESTION_STUB_DELETE_TABLE_ROW_COMMAND');
export const DELETE_TABLE_COLUMN_COMMAND = createCommand<TableCellNode>('SUGGESTION_STUB_DELETE_TABLE_COLUMN_COMMAND');

import type { TableCellNode, TableRowNode } from '@lexical/table';
import { createCommand, type NodeKey } from 'lexical';

export type InsertTableCommandPayload = Readonly<{
  columns: string;
  rows: string;
  includeHeaders?: {
    rows: boolean;
    columns: boolean;
  };
}>;

export const INSERT_TABLE_COMMAND = createCommand<InsertTableCommandPayload>('SUGGESTION_INSERT_TABLE_COMMAND');
export const INSERT_TABLE_ROW_COMMAND = createCommand<{ insertAfter: boolean }>('SUGGESTION_INSERT_TABLE_ROW_COMMAND');
export const INSERT_TABLE_COLUMN_COMMAND = createCommand<{ insertAfter: boolean }>('SUGGESTION_INSERT_TABLE_COLUMN_COMMAND');

export const DELETE_TABLE_COMMAND = createCommand<NodeKey>('SUGGESTION_DELETE_TABLE_COMMAND');
export const DELETE_TABLE_ROW_COMMAND = createCommand<TableRowNode>('SUGGESTION_DELETE_TABLE_ROW_COMMAND');
export const DELETE_TABLE_COLUMN_COMMAND = createCommand<TableCellNode>('SUGGESTION_DELETE_TABLE_COLUMN_COMMAND');

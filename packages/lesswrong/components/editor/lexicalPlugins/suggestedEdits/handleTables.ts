import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $createTableNodeWithDimensions, $insertTableColumnAtSelection, $insertTableRowAtSelection, $isTableNode } from '@lexical/table'
import { $insertNodeToNearestRoot, $insertFirst, $findMatchingParent } from '@lexical/utils'
import { generateUUID } from '@/lib/vendor/proton/generateUUID'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import type { NodeKey } from 'lexical'
import { $getNodeByKey, $isParagraphNode } from 'lexical'
import type { Logger } from '@/lib/vendor/proton/logger'
import type { InsertTableCommandPayload } from '@/components/editor/lexicalPlugins/suggestions/Table/Commands'

export function $insertNewTableAsSuggestion(
  { rows, columns, includeHeaders }: InsertTableCommandPayload,
  onSuggestionCreation: (id: string) => void,
): boolean {
  const tableNode = $createTableNodeWithDimensions(Number(rows), Number(columns), includeHeaders)
  const insertedTableNode = $insertNodeToNearestRoot(tableNode)
  const nextSibling = insertedTableNode.getNextSibling()

  // `$insertNodeToNearestRoot` inserts an empty paragraph after the
  // inserted node, we remove that.
  if ($isParagraphNode(nextSibling) && nextSibling.isEmpty()) {
    nextSibling.remove()
  }

  const tableRows = tableNode.getChildren<TableRowNode>()
  const tableCells = tableRows.map((row) => row.getChildren<TableCellNode>()).flat()
  if (tableCells.length < 1) {
    throw new Error('No table cells found')
  }

  const firstCell = tableCells[0]
  firstCell.selectStart()

  const suggestionID = generateUUID()
  for (const cell of tableCells) {
    $insertFirst(cell, $createSuggestionNode(suggestionID, 'insert-table'))
  }

  onSuggestionCreation(suggestionID)

  return true
}

export function $suggestTableDeletion(
  key: NodeKey,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  const table = $getNodeByKey<TableNode>(key)
  if (!table) {
    logger.info(`Could not find table with key ${key}`)
    return true
  }

  const tableRows = table.getChildren<TableRowNode>()
  const tableCells = tableRows.map((row) => row.getChildren<TableCellNode>()).flat()
  if (tableCells.length < 1) {
    throw new Error('No table cells found')
  }

  const firstCellChildren = tableCells[0].getChildren()
  const tableSuggestion = firstCellChildren.find(
    (node): node is ProtonNode => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow().endsWith('table'),
  )
  const tableSuggestionType = tableSuggestion?.getSuggestionTypeOrThrow()
  if (tableSuggestionType === 'insert-table') {
    table.remove()
  } else if (tableSuggestionType === 'delete-table') {
    return true
  }

  const suggestionID = generateUUID()
  for (const cell of tableCells) {
    $insertFirst(cell, $createSuggestionNode(suggestionID, 'delete-table'))
  }

  onSuggestionCreation(suggestionID)

  return true
}

export function $insertNewTableRowAsSuggestion(
  insertAfter: boolean,
  onSuggestionCreation: (id: string) => void,
): boolean {
  const insertedRow = $insertTableRowAtSelection(insertAfter)
  if (!insertedRow) {
    return true
  }

  const children = insertedRow.getChildren<TableCellNode>()
  if (children.length === 0) {
    throw new Error('Expected table row to have children')
  }

  const suggestionID = generateUUID()

  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    if (!child) {
      continue
    }

    const isFirstChild = index === 0
    if (isFirstChild) {
      child.selectStart()
    }

    const existingInsertTableSuggestion = child
      .getChildren()
      .find((node) => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'insert-table')
    if (existingInsertTableSuggestion) {
      return true
    }

    $insertFirst(child, $createSuggestionNode(suggestionID, 'insert-table-row'))
  }

  onSuggestionCreation(suggestionID)
  return true
}

function $moveSelectionToCell(cell: TableCellNode): void {
  const firstDescendant = cell.getFirstDescendant()
  if (firstDescendant == null) {
    cell.selectStart()
  } else {
    firstDescendant.getParentOrThrow().selectStart()
  }
}

export function $insertNewTableColumnAsSuggestion(
  insertAfter: boolean,
  onSuggestionCreation: (id: string) => void,
): boolean {
  const firstInsertedCell = $insertTableColumnAtSelection(insertAfter)
  if (!firstInsertedCell) {
    return true
  }

  $moveSelectionToCell(firstInsertedCell)

  const existingInsertTableSuggestion = firstInsertedCell
    .getChildren()
    .find((node) => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'insert-table')
  if (existingInsertTableSuggestion) {
    return true
  }

  const table = $findMatchingParent(firstInsertedCell, $isTableNode)
  if (!table) {
    throw new Error('Expected cell to have a parent table')
  }

  const suggestionID = generateUUID()

  const cellIndex = firstInsertedCell.getIndexWithinParent()
  for (const row of table.getChildren<TableRowNode>()) {
    const cellAtIndex = row.getChildAtIndex<TableCellNode>(cellIndex)
    if (!cellAtIndex) {
      continue
    }

    const suggestion = $createSuggestionNode(suggestionID, 'insert-table-column')
    $insertFirst(cellAtIndex, suggestion)
  }

  onSuggestionCreation(suggestionID)
  return true
}

export function $suggestTableRowDeletion(row: TableRowNode, onSuggestionCreation: (id: string) => void): boolean {
  const suggestionID = generateUUID()

  const cells = row.getChildren<TableCellNode>()
  if (cells.length === 0) {
    throw new Error('Expected row to have at least 1 cell')
  }

  const firstCellChildren = cells[0].getChildren()
  const existingInsertSuggestion = firstCellChildren.find((node): node is ProtonNode => {
    if (!$isSuggestionNode(node)) {
      return false
    }
    const type = node.getSuggestionTypeOrThrow()
    return type === 'insert-table' || type === 'insert-table-row'
  })
  if (existingInsertSuggestion) {
    row.remove()
    return true
  }

  for (const cell of cells) {
    $insertFirst(cell, $createSuggestionNode(suggestionID, 'delete-table-row'))
  }

  onSuggestionCreation(suggestionID)
  return true
}

export function $suggestTableColumnDeletion(cell: TableCellNode, onSuggestionCreation: (id: string) => void): boolean {
  const table = $findMatchingParent(cell, $isTableNode)
  if (!table) {
    throw new Error('Expected cell to have table parent')
  }

  const suggestionID = generateUUID()

  const cellIndex = cell.getIndexWithinParent()
  for (const row of table.getChildren<TableRowNode>()) {
    const currentCell = row.getChildAtIndex<TableCellNode>(cellIndex)
    if (!currentCell) {
      throw new Error('Could not find cell at index')
    }

    const cellChildren = currentCell.getChildren()
    const existingInsertSuggestion = cellChildren.find((node): node is ProtonNode => {
      if (!$isSuggestionNode(node)) {
        return false
      }
      const type = node.getSuggestionTypeOrThrow()
      return type === 'insert-table' || type === 'insert-table-column'
    })
    if (existingInsertSuggestion) {
      currentCell.remove()
      continue
    }

    $insertFirst(currentCell, $createSuggestionNode(suggestionID, 'delete-table-column'))
  }

  onSuggestionCreation(suggestionID)
  return true
}

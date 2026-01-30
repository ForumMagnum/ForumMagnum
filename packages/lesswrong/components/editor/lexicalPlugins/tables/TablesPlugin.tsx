"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
  $getNodeByKey,
  NodeKey,
} from 'lexical';
import {
  INSERT_TABLE_COMMAND,
  TableNode,
  TableCellNode,
  TableRowNode,
  $isTableNode,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
  $mergeCells,
  $unmergeCell,
  TableCellHeaderStates,
  $getTableCellNodeFromLexicalNode,
  $createTableNodeWithDimensions,
  $getTableNodeFromLexicalNodeOrThrow,
  $computeTableMapSkipCellCheck,
  $getTableCellNodeRect,
} from '@lexical/table';
import { mergeRegister, $findMatchingParent } from '@lexical/utils';
import TableDimensionSelector from './TableDimensionSelector';
import TableToolbarPanel, { TableToolbarActions, MergeCellCapabilities } from './TableToolbarPanel';

// Command to open the table dimension selector
export const OPEN_TABLE_SELECTOR_COMMAND: LexicalCommand<DOMRect | null> = createCommand(
  'OPEN_TABLE_SELECTOR_COMMAND'
);

// Command to open the table toolbar at a specific table
export const OPEN_TABLE_TOOLBAR_COMMAND: LexicalCommand<{ tableKey: NodeKey }> = createCommand(
  'OPEN_TABLE_TOOLBAR_COMMAND'
);

interface TableToolbarState {
  isOpen: boolean;
  tableElement: HTMLTableElement | null;
  tableKey: NodeKey | null;
  cellKey: NodeKey | null;
  mergeCapabilities: MergeCellCapabilities;
  hasMultipleCellsSelected: boolean;
  hasHeaderRow: boolean;
  hasHeaderColumn: boolean;
}

interface DimensionSelectorState {
  isOpen: boolean;
  anchorRect: DOMRect | null;
}

/**
 * Get adjacent cell in a specific direction from the table map
 */
function getAdjacentCell(
  tableMap: Array<Array<{ cell: TableCellNode; startRow: number; startColumn: number }>>,
  rowIndex: number,
  colIndex: number,
  direction: 'up' | 'down' | 'left' | 'right'
): TableCellNode | null {
  const numRows = tableMap.length;
  if (numRows === 0) return null;
  const numCols = tableMap[0].length;
  
  let targetRow = rowIndex;
  let targetCol = colIndex;
  
  switch (direction) {
    case 'up':
      targetRow = rowIndex - 1;
      break;
    case 'down':
      targetRow = rowIndex + 1;
      break;
    case 'left':
      targetCol = colIndex - 1;
      break;
    case 'right':
      targetCol = colIndex + 1;
      break;
  }
  
  if (targetRow < 0 || targetRow >= numRows || targetCol < 0 || targetCol >= numCols) {
    return null;
  }
  
  const mapEntry = tableMap[targetRow][targetCol];
  // Don't return the same cell (happens with merged cells)
  const currentCell = tableMap[rowIndex][colIndex].cell;
  if (mapEntry.cell === currentCell) {
    return null;
  }
  
  return mapEntry.cell;
}

function findCellCoordinates(
  tableMap: Array<Array<{ cell: TableCellNode; startRow: number; startColumn: number }>>,
  cellNode: TableCellNode
): { rowIndex: number; colIndex: number } | null {
  for (let row = 0; row < tableMap.length; row++) {
    for (let col = 0; col < tableMap[row].length; col++) {
      if (tableMap[row][col].cell === cellNode) {
        return { rowIndex: row, colIndex: col };
      }
    }
  }
  return null;
}

function getMergeTargetCell(
  tableMap: Array<Array<{ cell: TableCellNode; startRow: number; startColumn: number }>>,
  cellNode: TableCellNode,
  direction: 'up' | 'down' | 'left' | 'right'
): TableCellNode | null {
  const coords = findCellCoordinates(tableMap, cellNode);
  if (!coords) return null;

  const adjacentCell = getAdjacentCell(tableMap, coords.rowIndex, coords.colIndex, direction);
  if (!adjacentCell) return null;

  const cellRect = $getTableCellNodeRect(cellNode);
  const adjacentRect = $getTableCellNodeRect(adjacentCell);
  if (!cellRect || !adjacentRect) return null;

  if (direction === 'left' || direction === 'right') {
    const isSameRowBand =
      cellRect.rowIndex === adjacentRect.rowIndex &&
      cellRect.rowSpan === adjacentRect.rowSpan;
    if (!isSameRowBand) return null;

    if (
      (direction === 'right' &&
        adjacentRect.columnIndex !== cellRect.columnIndex + cellRect.colSpan) ||
      (direction === 'left' &&
        cellRect.columnIndex !== adjacentRect.columnIndex + adjacentRect.colSpan)
    ) {
      return null;
    }
  } else {
    const isSameColumnBand =
      cellRect.columnIndex === adjacentRect.columnIndex &&
      cellRect.colSpan === adjacentRect.colSpan;
    if (!isSameColumnBand) return null;

    if (
      (direction === 'down' &&
        adjacentRect.rowIndex !== cellRect.rowIndex + cellRect.rowSpan) ||
      (direction === 'up' &&
        cellRect.rowIndex !== adjacentRect.rowIndex + adjacentRect.rowSpan)
    ) {
      return null;
    }
  }

  return adjacentCell;
}

/**
 * TablesPlugin provides enhanced table functionality for the Lexical editor.
 */
export function TablesPlugin(): React.ReactElement {
  const [editor] = useLexicalComposerContext();
  
  const [dimensionSelector, setDimensionSelector] = useState<DimensionSelectorState>({
    isOpen: false,
    anchorRect: null,
  });
  
  const [toolbar, setToolbar] = useState<TableToolbarState>({
    isOpen: false,
    tableElement: null,
    tableKey: null,
    cellKey: null,
    mergeCapabilities: {
      canMergeUp: false,
      canMergeRight: false,
      canMergeDown: false,
      canMergeLeft: false,
      canSplitVertically: false,
      canSplitHorizontally: false,
    },
    hasMultipleCellsSelected: false,
    hasHeaderRow: false,
    hasHeaderColumn: false,
  });

  // Check if nodes are registered
  useEffect(() => {
    if (!editor.hasNodes([TableNode, TableCellNode, TableRowNode])) {
      throw new Error('TablesPlugin: Table nodes are not registered on the editor');
    }
  }, [editor]);

  // Handle opening the dimension selector
  const openDimensionSelector = useCallback((anchorRect: DOMRect | null) => {
    let resolvedRect = anchorRect;
    if (!resolvedRect && typeof window !== 'undefined') {
      const rootElement = editor.getRootElement();
      if (rootElement) {
        const rootRect = rootElement.getBoundingClientRect();
        resolvedRect = DOMRect.fromRect({
          x: rootRect.left + (rootRect.width / 2),
          y: rootRect.top + 8,
          width: 0,
          height: 0,
        });
      } else {
        resolvedRect = DOMRect.fromRect({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          width: 0,
          height: 0,
        });
      }
    }

    setDimensionSelector({
      isOpen: true,
      anchorRect: resolvedRect,
    });
  }, [editor]);

  const closeDimensionSelector = useCallback(() => {
    setDimensionSelector({
      isOpen: false,
      anchorRect: null,
    });
    editor.focus();
  }, [editor]);

  // Handle table insertion from dimension selector
  const handleDimensionSelect = useCallback((rows: number, cols: number) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const tableNode = $createTableNodeWithDimensions(rows, cols, false);
        selection.insertNodes([tableNode]);
        
        // Move selection to the first cell
        const firstRow = tableNode.getFirstChild();
        if ($isTableRowNode(firstRow)) {
          const firstCell = firstRow.getFirstChild();
          if ($isTableCellNode(firstCell)) {
            const firstParagraph = firstCell.getFirstChild();
            if (firstParagraph) {
              firstParagraph.selectStart();
            }
          }
        }
      }
    });
    closeDimensionSelector();
  }, [editor, closeDimensionSelector]);

  // Get merge capabilities for the current cell
  const getMergeCapabilities = useCallback((
    tableNode: TableNode,
    cellNode: TableCellNode
  ): MergeCellCapabilities => {
    const capabilities: MergeCellCapabilities = {
      canMergeUp: false,
      canMergeRight: false,
      canMergeDown: false,
      canMergeLeft: false,
      canSplitVertically: false,
      canSplitHorizontally: false,
    };
    
    // Check if cell can be split
    capabilities.canSplitVertically = cellNode.getColSpan() > 1;
    capabilities.canSplitHorizontally = cellNode.getRowSpan() > 1;
    
    // Get table map to check adjacents
    const [tableMap] = $computeTableMapSkipCellCheck(tableNode, cellNode, cellNode);

    capabilities.canMergeUp = getMergeTargetCell(tableMap, cellNode, 'up') !== null;
    capabilities.canMergeDown = getMergeTargetCell(tableMap, cellNode, 'down') !== null;
    capabilities.canMergeLeft = getMergeTargetCell(tableMap, cellNode, 'left') !== null;
    capabilities.canMergeRight = getMergeTargetCell(tableMap, cellNode, 'right') !== null;
    
    return capabilities;
  }, []);

  // Get table state for toolbar
  const getTableState = useCallback((
    tableNode: TableNode,
    cellNode: TableCellNode | null
  ): Partial<TableToolbarState> => {
    let hasHeaderRow = false;
    let hasHeaderColumn = false;
    
    const firstRow = tableNode.getFirstChild();
    if ($isTableRowNode(firstRow)) {
      const firstCellOfFirstRow = firstRow.getFirstChild();
      if ($isTableCellNode(firstCellOfFirstRow)) {
        hasHeaderRow = firstCellOfFirstRow.hasHeaderState(TableCellHeaderStates.ROW);
      }
    }
    
    const rows = tableNode.getChildren();
    if (rows.length > 0) {
      const firstRowNode = rows[0];
      if ($isTableRowNode(firstRowNode)) {
        const firstCell = firstRowNode.getFirstChild();
        if ($isTableCellNode(firstCell)) {
          hasHeaderColumn = firstCell.hasHeaderState(TableCellHeaderStates.COLUMN);
        }
      }
    }

    const mergeCapabilities = cellNode 
      ? getMergeCapabilities(tableNode, cellNode)
      : {
          canMergeUp: false,
          canMergeRight: false,
          canMergeDown: false,
          canMergeLeft: false,
          canSplitVertically: false,
          canSplitHorizontally: false,
        };

    return {
      hasHeaderRow,
      hasHeaderColumn,
      mergeCapabilities,
    };
  }, [getMergeCapabilities]);

  const syncToolbarState = useCallback((
    tableNode: TableNode,
    cellNode: TableCellNode | null,
    tableElement: HTMLTableElement,
    hasMultipleCellsSelected: boolean
  ) => {
    const state = getTableState(tableNode, cellNode);
    setToolbar(prev => {
      const nextState: TableToolbarState = {
        isOpen: true,
        tableElement,
        tableKey: tableNode.getKey(),
        cellKey: cellNode?.getKey() ?? null,
        mergeCapabilities: state.mergeCapabilities ?? prev.mergeCapabilities,
        hasMultipleCellsSelected,
        hasHeaderRow: state.hasHeaderRow ?? prev.hasHeaderRow,
        hasHeaderColumn: state.hasHeaderColumn ?? prev.hasHeaderColumn,
      };

      const isSame =
        prev.isOpen === nextState.isOpen &&
        prev.tableElement === nextState.tableElement &&
        prev.tableKey === nextState.tableKey &&
        prev.cellKey === nextState.cellKey &&
        prev.hasMultipleCellsSelected === nextState.hasMultipleCellsSelected &&
        prev.hasHeaderRow === nextState.hasHeaderRow &&
        prev.hasHeaderColumn === nextState.hasHeaderColumn &&
        prev.mergeCapabilities.canMergeUp === nextState.mergeCapabilities.canMergeUp &&
        prev.mergeCapabilities.canMergeRight === nextState.mergeCapabilities.canMergeRight &&
        prev.mergeCapabilities.canMergeDown === nextState.mergeCapabilities.canMergeDown &&
        prev.mergeCapabilities.canMergeLeft === nextState.mergeCapabilities.canMergeLeft &&
        prev.mergeCapabilities.canSplitVertically === nextState.mergeCapabilities.canSplitVertically &&
        prev.mergeCapabilities.canSplitHorizontally === nextState.mergeCapabilities.canSplitHorizontally;

      return isSame ? prev : nextState;
    });
  }, [getTableState]);

  // Open toolbar for a table
  const openToolbar = useCallback((
    tableKey: NodeKey,
    cellKey: NodeKey | null,
    tableElement: HTMLTableElement
  ) => {
    editor.getEditorState().read(() => {
      const tableNode = $getNodeByKey(tableKey);
      if (!$isTableNode(tableNode)) return;
      
      let cellNode: TableCellNode | null = null;
      if (cellKey) {
        const node = $getNodeByKey(cellKey);
        if ($isTableCellNode(node)) {
          cellNode = node;
        }
      }
      
      const selection = $getSelection();
      
      if (!cellNode) {
        if ($isRangeSelection(selection)) {
          cellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
        }
      }
      
      // Check if multiple cells are selected (TableSelection with > 1 cell)
      let hasMultipleCellsSelected = false;
      if ($isTableSelection(selection)) {
        const selectedNodes = selection.getNodes();
        const selectedCells = selectedNodes.filter($isTableCellNode);
        hasMultipleCellsSelected = selectedCells.length > 1;
      }
      
      syncToolbarState(tableNode, cellNode, tableElement, hasMultipleCellsSelected);
    });
  }, [editor, syncToolbarState]);

  const closeToolbar = useCallback(() => {
    setToolbar(prev => ({
      ...prev,
      isOpen: false,
      tableElement: null,
    }));
  }, []);

  // Merge cell in a specific direction
  const mergeCellInDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      
      const cellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      if (!cellNode) return;
      
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
      const [tableMap] = $computeTableMapSkipCellCheck(tableNode, cellNode, cellNode);
      const adjacentCell = getMergeTargetCell(tableMap, cellNode, direction);
      if (!adjacentCell) return;
      
      // Merge the two cells
      $mergeCells([cellNode, adjacentCell]);
    });
  }, [editor]);

  const toolbarActions: TableToolbarActions = {
    insertColumnLeft: useCallback(() => {
      editor.update(() => {
        $insertTableColumnAtSelection(false);
      });
    }, [editor]),
    
    insertColumnRight: useCallback(() => {
      editor.update(() => {
        $insertTableColumnAtSelection(true);
      });
    }, [editor]),
    
    deleteColumn: useCallback(() => {
      editor.update(() => {
        $deleteTableColumnAtSelection();
      });
    }, [editor]),
    
    insertRowAbove: useCallback(() => {
      editor.update(() => {
        $insertTableRowAtSelection(false);
      });
    }, [editor]),
    
    insertRowBelow: useCallback(() => {
      editor.update(() => {
        $insertTableRowAtSelection(true);
      });
    }, [editor]),
    
    deleteRow: useCallback(() => {
      editor.update(() => {
        $deleteTableRowAtSelection();
      });
    }, [editor]),
    
    mergeSelectedCells: useCallback(() => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isTableSelection(selection)) {
          const selectedNodes = selection.getNodes();
          const selectedCells = selectedNodes.filter($isTableCellNode);
          if (selectedCells.length > 1) {
            $mergeCells(selectedCells);
          }
        }
      });
    }, [editor]),
    
    mergeCellUp: useCallback(() => {
      mergeCellInDirection('up');
    }, [mergeCellInDirection]),
    
    mergeCellRight: useCallback(() => {
      mergeCellInDirection('right');
    }, [mergeCellInDirection]),
    
    mergeCellDown: useCallback(() => {
      mergeCellInDirection('down');
    }, [mergeCellInDirection]),
    
    mergeCellLeft: useCallback(() => {
      mergeCellInDirection('left');
    }, [mergeCellInDirection]),
    
    splitCellVertically: useCallback(() => {
      editor.update(() => {
        $unmergeCell();
      });
    }, [editor]),
    
    splitCellHorizontally: useCallback(() => {
      editor.update(() => {
        $unmergeCell();
      });
    }, [editor]),
    
    toggleHeaderRow: useCallback(() => {
      editor.update(() => {
        if (!toolbar.tableKey) return;
        const tableNode = $getNodeByKey(toolbar.tableKey);
        if (!$isTableNode(tableNode)) return;
        
        const firstRow = tableNode.getFirstChild();
        if (!$isTableRowNode(firstRow)) return;
        
        const cells = firstRow.getChildren();
        
        for (const cell of cells) {
          if ($isTableCellNode(cell)) {
            if (toolbar.hasHeaderRow) {
              cell.setHeaderStyles(
                cell.getHeaderStyles() & ~TableCellHeaderStates.ROW,
                TableCellHeaderStates.ROW
              );
            } else {
              cell.setHeaderStyles(
                cell.getHeaderStyles() | TableCellHeaderStates.ROW,
                TableCellHeaderStates.ROW
              );
            }
          }
        }
      });
      
      setToolbar(prev => ({
        ...prev,
        hasHeaderRow: !prev.hasHeaderRow,
      }));
    }, [editor, toolbar.tableKey, toolbar.hasHeaderRow]),
    
    toggleHeaderColumn: useCallback(() => {
      editor.update(() => {
        if (!toolbar.tableKey) return;
        const tableNode = $getNodeByKey(toolbar.tableKey);
        if (!$isTableNode(tableNode)) return;
        
        const rows = tableNode.getChildren();
        
        for (const row of rows) {
          if ($isTableRowNode(row)) {
            const firstCell = row.getFirstChild();
            if ($isTableCellNode(firstCell)) {
              if (toolbar.hasHeaderColumn) {
                firstCell.setHeaderStyles(
                  firstCell.getHeaderStyles() & ~TableCellHeaderStates.COLUMN,
                  TableCellHeaderStates.COLUMN
                );
              } else {
                firstCell.setHeaderStyles(
                  firstCell.getHeaderStyles() | TableCellHeaderStates.COLUMN,
                  TableCellHeaderStates.COLUMN
                );
              }
            }
          }
        }
      });
      
      setToolbar(prev => ({
        ...prev,
        hasHeaderColumn: !prev.hasHeaderColumn,
      }));
    }, [editor, toolbar.tableKey, toolbar.hasHeaderColumn]),
    
    deleteTable: useCallback(() => {
      editor.update(() => {
        if (toolbar.tableKey) {
          const tableNode = $getNodeByKey(toolbar.tableKey);
          if ($isTableNode(tableNode)) {
            tableNode.remove();
          }
        }
      });
      closeToolbar();
    }, [editor, toolbar.tableKey, closeToolbar]),
  };

  // Register commands
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        OPEN_TABLE_SELECTOR_COMMAND,
        (anchorRect) => {
          openDimensionSelector(anchorRect);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      
      editor.registerCommand(
        INSERT_TABLE_COMMAND,
        (payload) => {
          const { rows, columns, includeHeaders } = payload;
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const rowCount = parseInt(rows, 10);
              const colCount = parseInt(columns, 10);
              if (!isNaN(rowCount) && !isNaN(colCount) && rowCount > 0 && colCount > 0) {
                const tableNode = $createTableNodeWithDimensions(rowCount, colCount, includeHeaders ?? false);
                selection.insertNodes([tableNode]);
              }
            }
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      
      editor.registerCommand(
        OPEN_TABLE_TOOLBAR_COMMAND,
        ({ tableKey }) => {
          const element = editor.getElementByKey(tableKey) as HTMLTableElement | null;
          if (element) {
            openToolbar(tableKey, null, element);
          }
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, openDimensionSelector, openToolbar]);

  // Handle clicks on table cells to show/hide toolbar
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      
      const tableElement = target.closest('table') as HTMLTableElement | null;
      if (tableElement && rootElement && rootElement.contains(tableElement)) {
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) && !$isTableSelection(selection)) return;
          
          let anchorNode;
          if ($isRangeSelection(selection)) {
            anchorNode = selection.anchor.getNode();
          } else {
            anchorNode = selection.getNodes()[0];
          }
          
          const tableNode = $findMatchingParent(anchorNode, $isTableNode);
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
          
          if (tableNode) {
            openToolbar(tableNode.getKey(), cellNode?.getKey() ?? null, tableElement);
          }
        });
      } else {
        if (toolbar.isOpen) {
          closeToolbar();
        }
      }
    }

    rootElement.addEventListener('mouseup', handleClick);
    
    return () => {
      rootElement.removeEventListener('mouseup', handleClick);
    };
  }, [editor, toolbar.isOpen, openToolbar, closeToolbar]);

  // Update toolbar when selection changes (close if outside table, sync state)
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
          if (toolbar.isOpen) {
            closeToolbar();
          }
          return;
        }

        const anchorNode = selection.anchor.getNode();
        const tableNode = $findMatchingParent(anchorNode, $isTableNode);
        if (!tableNode) {
          if (toolbar.isOpen) {
            closeToolbar();
          }
          return;
        }

        const tableElement = editor.getElementByKey(tableNode.getKey()) as HTMLTableElement | null;
        if (!tableElement) return;

        const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
        const hasMultipleCellsSelected = $isTableSelection(selection)
          ? selection.getNodes().filter($isTableCellNode).length > 1
          : false;

        syncToolbarState(tableNode, cellNode, tableElement, hasMultipleCellsSelected);
      });
    });
  }, [editor, toolbar.isOpen, closeToolbar, syncToolbarState]);

  return (
    <>
      <TableDimensionSelector
        isOpen={dimensionSelector.isOpen}
        anchorRect={dimensionSelector.anchorRect}
        onSelect={handleDimensionSelect}
        onCancel={closeDimensionSelector}
      />
      <TableToolbarPanel
        isOpen={toolbar.isOpen}
        tableElement={toolbar.tableElement}
        actions={toolbarActions}
        onClose={closeToolbar}
        mergeCapabilities={toolbar.mergeCapabilities}
        hasMultipleCellsSelected={toolbar.hasMultipleCellsSelected}
        hasHeaderRow={toolbar.hasHeaderRow}
        hasHeaderColumn={toolbar.hasHeaderColumn}
      />
    </>
  );
}

export default TablesPlugin;

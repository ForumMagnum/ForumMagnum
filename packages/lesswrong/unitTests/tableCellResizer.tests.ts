import { calculateColumnWidthsAfterResize } from "../components/lexical/plugins/TableCellResizer";

describe("calculateColumnWidthsAfterResize", () => {
  test("uses measured widths for empty two-column tables with default stored widths", () => {
    expect(calculateColumnWidthsAfterResize({
      colWidths: [92, 92],
      measuredColWidths: [500, 500],
      columnIndex: 0,
      widthChange: -100,
      minColumnWidth: 92,
    })).toEqual([400, 600]);
  });

  test("transfers width to the adjacent column when dragging an internal divider right", () => {
    expect(calculateColumnWidthsAfterResize({
      colWidths: [300, 300],
      measuredColWidths: null,
      columnIndex: 0,
      widthChange: 75,
      minColumnWidth: 92,
    })).toEqual([375, 225]);
  });

  test("does not shrink either side of an internal divider below the minimum width", () => {
    expect(calculateColumnWidthsAfterResize({
      colWidths: [300, 120],
      measuredColWidths: null,
      columnIndex: 0,
      widthChange: 100,
      minColumnWidth: 92,
    })).toEqual([328, 92]);

    expect(calculateColumnWidthsAfterResize({
      colWidths: [120, 300],
      measuredColWidths: null,
      columnIndex: 0,
      widthChange: -100,
      minColumnWidth: 92,
    })).toEqual([92, 328]);
  });

  test("resizes the final column without requiring an adjacent column", () => {
    expect(calculateColumnWidthsAfterResize({
      colWidths: [300, 300],
      measuredColWidths: null,
      columnIndex: 1,
      widthChange: -250,
      minColumnWidth: 92,
    })).toEqual([300, 92]);
  });
});

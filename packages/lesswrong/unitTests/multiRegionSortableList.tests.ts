import {
  type SortableRegion,
  dropMove,
  moveItemBetweenRegions,
} from "@/components/form-components/multiRegionSortableList";

const regions: SortableRegion[] = [
  { id: "a", itemIds: ["p1", "p2", "p3"] },
  { id: "b", itemIds: ["p4"] },
  { id: "c", itemIds: [] },
];

describe("moveItemBetweenRegions", () => {
  it("moves an item into another region at the given index", () => {
    expect(moveItemBetweenRegions(regions, "p2", "b", 0)).toEqual([
      { id: "a", itemIds: ["p1", "p3"] },
      { id: "b", itemIds: ["p2", "p4"] },
      { id: "c", itemIds: [] },
    ]);
  });

  it("moves an item into an empty region", () => {
    expect(moveItemBetweenRegions(regions, "p4", "c", 0)[2]).toEqual({ id: "c", itemIds: ["p4"] });
  });

  it("clamps an index past the end to the end", () => {
    expect(moveItemBetweenRegions(regions, "p1", "b", 9)[1]).toEqual({ id: "b", itemIds: ["p4", "p1"] });
  });
});

describe("dropMove", () => {
  it("reports a reorder within a region, to the position of the item dropped on", () => {
    expect(dropMove(regions, regions, "p1", "p3")).toEqual({ itemId: "p1", fromRegionId: "a", toRegionId: "a", toIndex: 2 });
  });

  it("reports a move to another region, from where the preview put it", () => {
    const preview = moveItemBetweenRegions(regions, "p2", "b", 1);
    expect(dropMove(regions, preview, "p2", "p2")).toEqual({ itemId: "p2", fromRegionId: "a", toRegionId: "b", toIndex: 1 });
  });

  it("reports a move to an empty region dropped on the region itself", () => {
    const preview = moveItemBetweenRegions(regions, "p4", "c", 0);
    expect(dropMove(regions, preview, "p4", "c")).toEqual({ itemId: "p4", fromRegionId: "b", toRegionId: "c", toIndex: 0 });
  });

  it("follows the drop target into a region the preview hasn't caught up with", () => {
    // The preview has p2 in b, but it was dropped on p5 in c before the preview moved it there.
    const withC: SortableRegion[] = [regions[0], regions[1], { id: "c", itemIds: ["p5", "p6"] }];
    const preview = moveItemBetweenRegions(withC, "p2", "b", 1);
    expect(dropMove(withC, preview, "p2", "p5")).toEqual({ itemId: "p2", fromRegionId: "a", toRegionId: "c", toIndex: 0 });
  });

  it("puts the item at the end of a region the preview hasn't caught up with, when dropped on the region", () => {
    const preview = moveItemBetweenRegions(regions, "p2", "b", 1);
    expect(dropMove(regions, preview, "p2", "region:c")).toEqual({ itemId: "p2", fromRegionId: "a", toRegionId: "c", toIndex: 0 });
  });

  it("returns null when the item ends where it started", () => {
    expect(dropMove(regions, regions, "p2", "p2")).toBeNull();
  });
});

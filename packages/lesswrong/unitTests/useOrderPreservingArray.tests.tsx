/**
 * @jest-environment jsdom
 */
// The docstring above overrides the jest environment from node to jsdom
// because the jsdom env is required for compatibility with
// @testing-library/react, but other (server) code is incompatible with that
// environment. The docstring must be the first thing in the file.

import { renderHook } from "@testing-library/react";
import { useOrderPreservingArray } from "../components/hooks/useOrderPreservingArray";

describe("useOrderPreservingArray", () => {
  it("Prepends new elements when using prepend-new", () => {
    const initialArray = [{ _id: "a" }, { _id: "b" }, { _id: "c" }];
    const { result, rerender } = renderHook(
      (array: any[]) => useOrderPreservingArray(array, (elem) => elem._id, "prepend-new"),
      { initialProps: initialArray }
    );
    expect(result.current).toEqual(initialArray);

    rerender([{ _id: "d" }, ...initialArray, { _id: "e" }]);
    // should move new elements to the front but retain their order
    expect(result.current).toEqual([{ _id: "d" }, { _id: "e" }, { _id: "a" }, { _id: "b" }, { _id: "c" }]);

    // should move new element in the middle to the front, and update the contents of existing elements
    rerender([{ _id: "d", k: "abc" }, { _id: "a" }, { _id: "b" }, { _id: "f" }, { _id: "c" }, { _id: "e" }]);
    expect(result.current).toEqual([
      { _id: "f" },
      { _id: "d", k: "abc" },
      { _id: "e" },
      { _id: "a" },
      { _id: "b" },
      { _id: "c" },
    ]);
  });

  it("Appends new elements when using append-new", () => {
    const initialArray = [{ _id: "a" }, { _id: "b" }, { _id: "c" }];
    const { result, rerender } = renderHook(
      (array: any[]) => useOrderPreservingArray(array, (elem) => elem._id, "append-new"),
      { initialProps: initialArray }
    );
    expect(result.current).toEqual(initialArray);

    rerender([{ _id: "d" }, ...initialArray, { _id: "e" }]);
    // should move new elements to the end but retain their order
    expect(result.current).toEqual([{ _id: "a" }, { _id: "b" }, { _id: "c" }, { _id: "d" }, { _id: "e" }]);

    // should move new element in the middle to the end, and update the contents of existing elements
    rerender([{ _id: "d", k: "abc" }, { _id: "a" }, { _id: "c" }, { _id: "f" }, { _id: "b" }, { _id: "e" }]);
    expect(result.current).toEqual([
      { _id: "a" },
      { _id: "b" },
      { _id: "c" },
      { _id: "d", k: "abc" },
      { _id: "e" },
      { _id: "f" },
    ]);
  });

  it("Preserves order of existing elements when using interleave-new", () => {
    const initialArray = [{ _id: "a" }, { _id: "b" }, { _id: "c" }];
    const { result, rerender } = renderHook(
      (array: any[]) => useOrderPreservingArray(array, (elem) => elem._id, "interleave-new"),
      { initialProps: initialArray }
    );
    expect(result.current).toEqual(initialArray);

    rerender([{ _id: "c" }, { _id: "d" }, { _id: "a" }, { _id: "e" }, { _id: "b" }]);
    // a,b,c should be back in their original order, and d,e should be left in the same positions
    expect(result.current).toEqual([{ _id: "a" }, { _id: "d" }, { _id: "b" }, { _id: "e" }, { _id: "c" }]);

    rerender([{ _id: "c" }, { _id: "f" }, { _id: "h" }, { _id: "b" }]);
    // a has been removed, but b and c should remain in the same relative order, and f and h should be left in the same positions
    expect(result.current).toEqual([{ _id: "b" }, { _id: "f" }, { _id: "h" }, { _id: "c" }]);
  });

  it("Doesn't do any reordering when using no-reorder", () => {
    const initialArray = [{ _id: "a" }, { _id: "b" }, { _id: "c" }];
    const { result, rerender } = renderHook(
      (array: any[]) => useOrderPreservingArray(array, (elem) => elem._id, "no-reorder"),
      { initialProps: initialArray }
    );
    expect(result.current).toEqual(initialArray);

    rerender([{ _id: "c" }, { _id: "d" }, { _id: "a" }, { _id: "e" }, { _id: "b" }]);
    // everything is in the same order
    expect(result.current).toEqual([{ _id: "c" }, { _id: "d" }, { _id: "a" }, { _id: "e" }, { _id: "b" }]);
  });
});

import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";


// When adding a new year you'll need to run the server command to update the
// analytics views:
//   yarn repl dev packages/lesswrong/server/wrapped/triggerWrappedRefresh.ts "triggerWrappedRefresh()"
const wrappedYears = new TupleSet([2022, 2023, 2024] as const);

export type WrappedYear = UnionOf<typeof wrappedYears>;

export const isWrappedYear = (year: number): year is WrappedYear => wrappedYears.has(year);

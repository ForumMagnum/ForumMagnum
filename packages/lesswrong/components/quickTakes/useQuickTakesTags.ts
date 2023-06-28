import { useCallback, useState } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import type { ChecklistTag } from "../tagging/TagsChecklist";

const filterDefined = <T>(values: (T | null | undefined)[]): T[] =>
  values.filter((value) => value !== null && value !== undefined) as T[];

const FRONTPAGE_TAG_ID = "frontpage" as const;
const FRONTPAGE_DUMMY_TAG: ChecklistTag = {
  _id: FRONTPAGE_TAG_ID,
  name: "Frontpage",
  shortName: null,
} as const;

export type SelectedTag = {
  tagId: string,
  tagName: string,
  parentTagId?: string,
};

export type QuickTakesTag = ChecklistTag | TagFragment;

export type QuickTakesTags = {
  loading: true,
  frontpage?: never,
  selectedTagIds?: never,
  tags?: never,
  frontpageTagId?: never,
  onTagSelected?: never,
  onTagRemoved?: never,
} | {
  loading: false,
  frontpage: boolean,
  selectedTagIds: string[],
  tags: QuickTakesTag[],
  frontpageTagId: typeof FRONTPAGE_TAG_ID,
  onTagSelected: (
    tag: SelectedTag,
    existingTagIds: string[],
  ) => void,
  onTagRemoved: (
    tag: SelectedTag,
    existingTagIds: string[],
  ) => void,
};

export const useQuickTakesTags = (): QuickTakesTags => {
  const [frontpage, setFrontpage] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const {results, loading} = useMulti({
    terms: {
      view: "coreAndSubforumTags",
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 100,
  });

  const tags = [FRONTPAGE_DUMMY_TAG, ...(results ?? [])];

  const onTagSelected = useCallback((
    tag: SelectedTag,
    existingTagIds: string[],
  ) => {
    if (tag.tagId === FRONTPAGE_TAG_ID) {
      setFrontpage(true);
    } else {
      setSelectedTagIds(filterDefined(Array.from(new Set([
        ...existingTagIds.filter((id) => id !== FRONTPAGE_TAG_ID),
        tag.tagId,
        tag.parentTagId,
      ]))));
    }
  }, []);

  const onTagRemoved = useCallback((
    tag: SelectedTag,
    existingTagIds: string[],
  ) => {
    if (tag.tagId === FRONTPAGE_TAG_ID) {
      setFrontpage(false);
    } else {
      setSelectedTagIds(existingTagIds.filter(
        (id) => id !== tag.tagId && id !== FRONTPAGE_TAG_ID,
      ));
    }
  }, []);

  if (loading) {
    return {loading};
  }

  return {
    loading: false,
    frontpage,
    selectedTagIds,
    tags: tags ?? [],
    frontpageTagId: FRONTPAGE_TAG_ID,
    onTagSelected,
    onTagRemoved,
  };
}

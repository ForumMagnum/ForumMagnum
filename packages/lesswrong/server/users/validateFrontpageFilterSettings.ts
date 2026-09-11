import { FilterSettings } from "@/lib/filterSettings";
import { loadByIds } from "@/lib/loaders";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function validateFrontpageFilterSettings(
  filterSettings: unknown,
  context: ResolverContext,
): Promise<FilterSettings | null | undefined> {
  if (typeof filterSettings === "undefined" || filterSettings === null) {
    return filterSettings as null | undefined;
  }

  if (!isPlainObject(filterSettings)) {
    throw new Error("frontpageFilterSettings must be an object");
  }

  if (!Array.isArray(filterSettings.tags)) {
    throw new Error("frontpageFilterSettings.tags must be an array");
  }

  const invalidTagShapeIndex = filterSettings.tags.findIndex((tag) =>
    !isPlainObject(tag) || typeof tag.tagId !== "string" || tag.tagId.length === 0
  );

  if (invalidTagShapeIndex >= 0) {
    throw new Error(`frontpageFilterSettings.tags[${invalidTagShapeIndex}].tagId must be a non-empty string`);
  }

  const uniqueTagIds = Array.from(new Set(filterSettings.tags.map((tag) => String(tag.tagId))));
  if (uniqueTagIds.length === 0) {
    return filterSettings as unknown as FilterSettings;
  }

  const loadedTags = await loadByIds(context, "Tags", uniqueTagIds);
  const invalidTagIds = uniqueTagIds.filter((tagId, index) => !loadedTags[index]);

  if (invalidTagIds.length > 0) {
    throw new Error(`frontpageFilterSettings contains invalid tagIds: ${invalidTagIds.join(", ")}`);
  }

  return filterSettings as unknown as FilterSettings;
}

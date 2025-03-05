import { randomLowercaseId } from "@/lib/random";
import { getCollection } from "@/lib/vulcan-lib/getCollection";
import type { CreateCallbackProperties, UpdateCallbackProperties } from "../mutationCallbacks";
import { slugify } from "@/lib/utils/slugify";


// Get an unused slug. If `slug` is already unused, returns it as-is. If it's
// used, finds a suffix such that slug-{suffix} is unused.
//
// Slugs are sequential up to 10, then jump to 4-char IDs, then 8-char IDs.
//
// If useOldSlugs is true, then the slugs that renamed documents used to have
// count as used. If a documentId is provided, that document doesn't count as
// a collision.
const getUnusedSlug = async function ({collectionsToCheck, slug, useOldSlugs=false, documentId}: {
  collectionsToCheck: CollectionNameWithSlug[],
  slug: string,
  useOldSlugs?: boolean,
  documentId?: string,
}): Promise<string> {
  let suffix = '';
  let index = 0;
  
  //eslint-disable-next-line no-constant-condition
  while(true) {
    // Test if slug is already in use
    if (!(await slugIsUsed({
      collectionsToCheck,
      slug: slug+suffix,
      useOldSlugs,
      excludedId: documentId,
    }))) {
      return slug+suffix;
    }

    // If there are other documents we conflict with, change the index and slug, then check again
    index++;
    
    // Count up indexes sequentially up to 10. After that, randomly generate an ID. This
    // avoids making it so that creating n documents with the same base string is O(n^2).
    // (This came up in development with posts named "test", which there are hundreds of.)
    if (index <= 10) {
      suffix = '-'+index;
    } else {
      const randomIndex = randomLowercaseId(index<20 ? 4 : 8);
      suffix = '-'+randomIndex;
    }
  }
};

export const getDocumentsBySlug = async <
  N extends CollectionNameWithSlug,
>({slug, suffix, useOldSlugs, collection}: {
  slug: string,
  suffix: string,
  useOldSlugs: boolean,
  collection: CollectionBase<N>
}): Promise<ObjectsByCollectionName[N][]> => {
  return await collection.find(
    useOldSlugs
      ? {$or: [{slug: slug+suffix},{oldSlugs: slug+suffix}]}
      : {slug: slug+suffix}
  ).fetch()
}

// LESSWRONG version of getting unused slug by collection name. Modified to also include "oldSlugs" array
export const getUnusedSlugByCollectionName = async function (collectionName: CollectionNameWithSlug, slug: string, useOldSlugs = false, documentId?: string): Promise<string> {
  const collection = getCollection(collectionName);
  if (!collection.hasSlug()) {
    throw new Error(`Collection ${collection.collectionName} doesn't have a slug`);
  }
  return await getUnusedSlug({
    collectionsToCheck: [collectionName],
    slug, useOldSlugs, documentId
  })
};

const slugIsUsed = async ({collectionsToCheck, slug, useOldSlugs, excludedId}: {
  collectionsToCheck: CollectionNameWithSlug[],
  slug: string,
  useOldSlugs: boolean,
  excludedId?: string
}): Promise<boolean> => {
  const existingObjs = await Promise.all(
    collectionsToCheck.map(collectionName => {
      const collection = getCollection(collectionName)
      return collection.findOne({
        ...(useOldSlugs
          ? {$or: [{slug}, {oldSlugs: slug}]}
          : {slug}),
        ...(excludedId
          ? {_id: {$ne: excludedId}}
          : {}),
      }, {}, {_id: 1});
    })
  );
  for (const result of existingObjs) {
    if (result)
      return true;
  }
  return false;
}

type CollectionWithSlug<N extends CollectionNameWithSlug> = CollectionBase<N> & {
  _schemaFields: SchemaType<N> & {
    slug: CollectionFieldSpecification<N> & { slugCallbackOptions: SlugCallbackOptions }
  }
};

type ValidSlugCreateCallbackProps<N extends CollectionNameWithSlug> = CreateCallbackProperties<N> & {
  collection: CollectionWithSlug<N>,
  schema: SchemaType<N> & { slug: CollectionFieldSpecification<N> & { slugCallbackOptions: SlugCallbackOptions } },
  document: DbInsertion<ObjectsByCollectionName[N]>,
}

type ValidSlugUpdateCallbackProps<N extends CollectionNameWithSlug> = UpdateCallbackProperties<N> & {
  collection: CollectionWithSlug<N>,
  schema: SchemaType<N> & { slug: CollectionFieldSpecification<N> & { slugCallbackOptions: SlugCallbackOptions } },
  oldDocument: ObjectsByCollectionName[N],
  newDocument: ObjectsByCollectionName[N],
  data: Partial<ObjectsByCollectionName[N]>,
};

function isCreateBeforeCallbackForSlugCollection<
  N extends CollectionNameString,
  Props extends CreateCallbackProperties<N>
>(props: Props): props is Props & ValidSlugCreateCallbackProps<CollectionNameWithSlug> {
  return !!props.schema.slug?.slugCallbackOptions;
}

function isUpdateBeforeCallbackForSlugCollection<
  N extends CollectionNameString,
  Props extends UpdateCallbackProperties<N>
>(props: Props): props is Props & ValidSlugUpdateCallbackProps<CollectionNameWithSlug> {
  return !!props.schema.slug?.slugCallbackOptions;
}

export async function runSlugCreateBeforeCallback<N extends CollectionNameString>(createProps: CreateCallbackProperties<N>) {
  if (!isCreateBeforeCallbackForSlugCollection(createProps)) {
    return createProps.document;
  }

  const { schema, document } = createProps;
  const slugField = schema.slug;

  const { collectionsToAvoidCollisionsWith, getTitle, onCollision, includesOldSlugs } = slugField.slugCallbackOptions;

  const title = getTitle(document);
  const titleSlug = document.slug ?? slugify(title);
  const deconflictedTitleSlug = await getUnusedSlug({
    collectionsToCheck: collectionsToAvoidCollisionsWith,
    slug: titleSlug,
    useOldSlugs: includesOldSlugs,
  });

  if (deconflictedTitleSlug !== titleSlug) {
    switch (onCollision) {
      case "rejectIfExplicit":
      case "newDocumentGetsSuffix":
        return {
          ...document,
          slug: deconflictedTitleSlug,
        };
      case "rejectNewDocument":
        throw new Error(`Slug ${titleSlug} is already taken`);
    }
  } else {
    // TODO If slug is in another document's oldSlugs, remove it from there
    return {
      ...document,
      slug: titleSlug,
    };
  }
}

export async function runSlugUpdateBeforeCallback<N extends CollectionNameString>(updateProps: UpdateCallbackProperties<N>) {
  if (!isUpdateBeforeCallbackForSlugCollection(updateProps)) {
    return updateProps.data;
  }
  
  const slugField = updateProps.schema.slug;

  const { collectionsToAvoidCollisionsWith, getTitle, onCollision, includesOldSlugs } = slugField.slugCallbackOptions;

  const {oldDocument, newDocument, data} = updateProps;
  const oldTitle = getTitle(oldDocument);
  const newTitle = getTitle(newDocument);
  let changedSlug: string|null = null;
  let changeWasExplicit = false;
  
  if (data.slug && data.slug !== oldDocument.slug) {
    changedSlug = data.slug;
    changeWasExplicit = true;
  } else if (newTitle && newTitle !== oldTitle && oldDocument.slug === slugify(oldTitle)) {
    changedSlug = slugify(newTitle);
  }

  if (!changedSlug) {
    return data;
  }

  const deconflictedSlug = await getUnusedSlug({
    collectionsToCheck: collectionsToAvoidCollisionsWith,
    slug: changedSlug,
    useOldSlugs: includesOldSlugs,
    documentId: newDocument._id
  });
  if (deconflictedSlug === changedSlug) {
    return {
      ...data,
      slug: deconflictedSlug,
      ...(includesOldSlugs && {
        oldSlugs: [
          // The type signature above didn't capture the fact that
          // includesOldSlugs implies that the document has an oldSlugs field, so
          // @ts-ignore
          ...(newDocument.oldSlugs ?? []).filter(s => s!==deconflictedSlug),
          oldDocument.slug
        ],
      })
    };
  }
  switch (onCollision) {
    case "rejectIfExplicit":
      if (changeWasExplicit) {
        throw new Error(`Slug ${changedSlug} is already taken`);
      }
      // FALLTHROUGH
    case "newDocumentGetsSuffix":
      return {
        ...data,
        slug: deconflictedSlug,
        ...(includesOldSlugs && {
          oldSlugs: [
            //@ts-ignore
            ...(newDocument.oldSlugs ?? []).filter(s => s!==deconflictedSlug),
            oldDocument.slug
          ],
        }),
      };
    case "rejectNewDocument":
      throw new Error(`Slug ${changedSlug} is already taken`);
  }
}

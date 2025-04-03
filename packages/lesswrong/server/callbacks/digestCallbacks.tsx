import { UpdateCallbackProperties } from '../mutationCallbacks';

export async function createNextDigestOnPublish({newDocument, oldDocument, context}: UpdateCallbackProperties<"Digests">) {
  const { Digests } = context;
  // if we are not currently setting the end date of this digest, skip
  if (!newDocument.endDate || oldDocument.endDate) return
  // if a newer digest already exists, skip
  const newerDigest = await Digests.findOne({ num: {$gt: newDocument.num ?? 0} })
  if (newerDigest) return

  const { createDigest }: typeof import('../collections/digests/mutations') = await require('../collections/digests/mutations');

  void createDigest({
    data: {
      num: (newDocument.num ?? 0) + 1,
      startDate: newDocument.endDate ?? new Date()
    }
  }, context, true);
}

export async function backdatePreviousDigest({newDocument, oldDocument, context}: UpdateCallbackProperties<"Digests">) {
  const { Digests } = context;
  // if we change a digest's start date, make sure to update the preceeding digest's end date to match,
  // so that we don't miss any eligible posts
  if (!newDocument.num) return
  if (newDocument.startDate && newDocument.startDate !== oldDocument.startDate) {
    await Digests.rawUpdateOne(
      {num: newDocument.num - 1},
      {$set: {endDate: newDocument.startDate}},
    );
  }

  // if we change a digest's end date, make sure to update any subsequent digest's start date to match,
  // so that we don't miss any eligible posts
  if (newDocument.endDate && newDocument.endDate !== oldDocument.endDate) {
    await Digests.rawUpdateOne(
      {num: newDocument.num + 1},
      {$set: {startDate: newDocument.endDate}},
    );
  }
}

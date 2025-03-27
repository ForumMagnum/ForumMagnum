import { getAllCollections } from "../collections/allCollections";
import { join } from "path";
import { writeFile } from "fs/promises";

export async function moveMutations() {
  const allCollections = getAllCollections();
  for (const collection of allCollections) {
    const collectionName = collection.collectionName;
    const collectionMutations = collection.options.mutations;

    if (!collectionMutations) continue;

    const mutationFilePath = join(__dirname, `../collections/${collectionName}/mutations.ts`);

    await writeFile(mutationFilePath, '');
  }
}

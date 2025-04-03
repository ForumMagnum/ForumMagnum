import { forEachDocumentInCollection } from "../manualMigrations/migrationUtils";
import { Users } from "@/server/collections/users/collection";
import Tags from "@/server/collections/tags/collection";
import { updateMutator } from "@/server/vulcan-lib/mutators";
import { dataToCkEditor } from "../editor/conversionUtils";
import { parseSemver } from "@/lib/editor/utils";

// Exported to allow running manually with "yarn repl"
export const convertTagsToCkEditor = async (conversionUserSlug?: string) => {
  const conversionUser = await Users.findOne({ slug: conversionUserSlug ?? "lesswrong-internal" });
  if (!conversionUser) {
    //eslint-disable-next-line no-console
    console.error(`You must provide a conversion account, which will own any revisions which are created for format conversion.`);
    return;
  }
  
  await forEachDocumentInCollection({
    collection: Tags,
    filter: {
      deleted: false,
    },
    callback: async (tag: DbTag) => {
      await convertTagToCkEditor(tag, conversionUser);
    }
  });
}

async function convertTagToCkEditor(tag: DbTag, conversionUser: DbUser) {
  if (tag.description?.originalContents?.type === 'draftJS') {
    const [oldMajor,oldMinor,oldPatch] = parseSemver(tag.description.version);
    const newVersion = `${oldMajor}.${oldMinor}.${oldPatch+1}`;

    await updateMutator({
      collection: Tags,
      documentId: tag._id,
      currentUser: conversionUser,
      set: {
        description: {
          originalContents: {
            type: "ckEditorMarkup",
            data: await dataToCkEditor(tag.description.originalContents.data, tag.description.originalContents.type),
          },
          commitMessage: "Convert editor type to CkEditor",
        },
      },
      validate: false,
    });
  }
}

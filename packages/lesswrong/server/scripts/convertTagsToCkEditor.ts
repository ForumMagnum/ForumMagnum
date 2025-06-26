import { forEachDocumentInCollection } from "../manualMigrations/migrationUtils";
import { Users } from "@/server/collections/users/collection";
import Tags from "@/server/collections/tags/collection";
import { dataToCkEditor } from "../editor/conversionUtils";
import { parseSemver } from "@/lib/editor/utils";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { updateTag } from "../collections/tags/mutations";

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
    const userContext = await computeContextFromUser({ user: conversionUser, isSSR: false });
    await updateTag({
      data: {
        description: {
          originalContents: {
            type: "ckEditorMarkup",
            data: await dataToCkEditor(tag.description.originalContents.data, tag.description.originalContents.type),
          },
          commitMessage: "Convert editor type to CkEditor",
        },
      }, selector: { _id: tag._id }
    }, userContext);
  }
}

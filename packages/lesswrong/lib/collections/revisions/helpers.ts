import { userCanReadField, userOwns } from "@/lib/vulcan-users/permissions";
import { SharableDocument, userIsSharedOn } from "../users/helpers";
import { userIsPostGroupOrganizer } from "../posts/helpers";

const isSharable = (document: any): document is SharableDocument => {
  return "coauthorUserIds" in document || "shareWithUsers" in document || "sharingSettings" in document;
};

export const getOriginalContents = async <N extends CollectionNameString>(
  currentUser: DbUser | null,
  document: ObjectsByCollectionName[N],
  originalContents: EditableFieldContents["originalContents"],
  context: ResolverContext,
) => {
  const canViewOriginalContents = (user: DbUser | null, doc: DbObject) =>
    isSharable(doc) ? userIsSharedOn(user, doc) : true;

  const userHasReadPermissions = userCanReadField(
    currentUser,
    [userOwns, canViewOriginalContents, "admins", "sunshineRegiment"],
    document
  ) || (await userIsPostGroupOrganizer(currentUser, document as DbPost, context));

  if (userHasReadPermissions && originalContents) {
    return originalContents;
  }

  return {
    type: originalContents?.type ?? 'ckEditorMarkup',
    data: '',
  };
};

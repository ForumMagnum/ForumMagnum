import { userCanReadField, userOwns, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import { SharableDocument, userIsSharedOn } from "../users/helpers";

const isSharable = (document: any): document is SharableDocument => {
  return "coauthorStatuses" in document || "shareWithUsers" in document || "sharingSettings" in document;
};

export const getOriginalContents = <N extends CollectionNameString>(
  currentUser: DbUser | null,
  document: ObjectsByCollectionName[N],
  originalContents: EditableFieldContents["originalContents"]
) => {
  const canViewOriginalContents = (user: DbUser | null, doc: DbObject) =>
    isSharable(doc) ? userIsSharedOn(user, doc) : true;

  const returnOriginalContents = userCanReadField(
    currentUser,
    // We need `userIsPodcaster` here to make it possible for podcasters to open post edit forms to add/update podcast episode info
    // Without it, `originalContents` may resolve to undefined, which causes issues in revisionResolvers
    [userOwns, canViewOriginalContents, userIsPodcaster, "admins", "sunshineRegiment"],
    document
  );

  return returnOriginalContents ? originalContents : null;
};

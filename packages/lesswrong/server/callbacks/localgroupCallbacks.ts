import { getCollectionHooks } from '../mutationCallbacks';


getCollectionHooks("Localgroups").createValidate.add(async (validationErrors: Array<any>, {document: group}: {document: DbLocalgroup}) => {
  if (!group.isOnline && !group.location)
    throw new Error("Location is required for local groups");
  
  return validationErrors;
});

getCollectionHooks("Localgroups").updateValidate.add(async (validationErrors: Array<any>, {oldDocument, newDocument}: {oldDocument: DbLocalgroup, newDocument: DbLocalgroup}) => {
  if (!newDocument.isOnline && !newDocument.location)
    throw new Error("Location is required for local groups");
  
  return validationErrors;
});

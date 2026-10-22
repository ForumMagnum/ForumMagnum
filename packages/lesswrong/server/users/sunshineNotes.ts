import { getSignatureWithNote } from "@/lib/collections/users/helpers";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";

export async function appendToSunshineNotes({moderatedUserId, adminName, text, context}: {
  moderatedUserId: string,
  adminName: string,
  text: string,
  context: ResolverContext,
}): Promise<DbUser> {
  const newNote = getSignatureWithNote(adminName, text);
  const updatedUser = await context.repos.users.prependToSunshineNotes(moderatedUserId, newNote);
  if (!updatedUser) throw "Invalid userId in appendToSunshineNotes";
  // The update prepends newNote, so the previous value is everything after it
  const previousNotes = updatedUser.sunshineNotes?.slice(newNote.length) ?? null;
  backgroundTask(logFieldChanges({
    currentUser: context.currentUser,
    collection: context.Users,
    oldDocument: { ...updatedUser, sunshineNotes: previousNotes },
    data: { sunshineNotes: updatedUser.sunshineNotes },
  }));
  return updatedUser;
}

import { type CallbackValidationErrors, type CreateCallbackProperties, type AfterCreateCallbackProperties, type UpdateCallbackProperties, getCollectionHooks } from "../mutationCallbacks";
import { changeDisplayNameRateLimit, clearKarmaChangeBatchOnSettingsChange, createRecombeeUser, makeFirstUserAdminAndApproved, maybeSendVerificationEmail, sendWelcomingPM, subscribeOnSignup, subscribeToEAForumAudience, syncProfileUpdatedAt, updateMailchimpSubscription, updateDisplayName, userEditDeleteContentCallbacksAsync, updateUserMayTriggerReview, usersEditCheckEmail, reindexDeletedUserContent, newAlignmentUserMoveShortform, newAlignmentUserSendPMAsync, userEditChangeDisplayNameCallbacksAsync, updatingPostAudio, handleSetShortformPost, approveUnreviewedSubmissions, newSubforumMemberNotifyMods, userEditBannedCallbacksAsync } from "./userCallbackFunctions";

async function userCreateValidate(validationErrors: CallbackValidationErrors, props: CreateCallbackProperties<'Users'>): Promise<CallbackValidationErrors> {
  return validationErrors;
}

async function userCreateBefore(doc: DbInsertion<DbUser>, props: CreateCallbackProperties<'Users'>): Promise<DbInsertion<DbUser>> {
  // slugCreateBeforeCallbackFunction-Users
  // 4x editorSerializationBeforeCreate

  return doc;
}

async function userNewSync(user: DbUser, currentUser: DbUser | null, context: ResolverContext): Promise<DbUser> {
  // There used to be a `usersMakeAdmin` after this one, which _actually_ made the user an admin.
  // `makeFirstUserAdminAndApproved` only made them a mod (and approved them).
  // Clearly silly, now deduplicated.
  user = await makeFirstUserAdminAndApproved(user, context);

  return user;
}

async function userCreateAfter(user: DbUser, props: AfterCreateCallbackProperties<'Users'>): Promise<DbUser> {
  // 4x (editorSerializationAfterCreate, notifyUsersAboutMentions)

  return user;
}

async function userNewAfter(user: DbUser, currentUser: DbUser | null, props: AfterCreateCallbackProperties<'Users'>): Promise<DbUser> {
  return user;
}

async function userCreateAsync(props: AfterCreateCallbackProperties<'Users'>) {
  createRecombeeUser(props);
  // elasticSyncDocument
}

async function userNewAsync(user: DbUser, currentUser: DbUser | null, collection: CollectionBase<'Users'>, props: AfterCreateCallbackProperties<'Users'>) {
  await subscribeOnSignup(user);
  await subscribeToEAForumAudience(user);
  await sendWelcomingPM(user);
  // 4x convertImagesInObject
}

async function userUpdateValidate(validationErrors: CallbackValidationErrors, props: UpdateCallbackProperties<'Users'>): Promise<CallbackValidationErrors> {
  await changeDisplayNameRateLimit(validationErrors, props);

  return validationErrors;
}

async function userUpdateBefore(user: Partial<DbUser>, props: UpdateCallbackProperties<'Users'>): Promise<Partial<DbUser>> {
  // slugUpdateBeforeCallbackFunction-Users

  await updateMailchimpSubscription(user, props);
  await updateDisplayName(user, props);

  // 4x editorSerializationEdit

  return user;
}

async function userEditSync(modifier: MongoModifier<DbUser>, user: DbUser, _0: DbUser | null, _1: DbUser, props: UpdateCallbackProperties<'Users'>): Promise<MongoModifier<DbUser>> {
  maybeSendVerificationEmail(modifier, user);
  clearKarmaChangeBatchOnSettingsChange(modifier, user);
  await usersEditCheckEmail(modifier, user);
  syncProfileUpdatedAt(modifier, user);

  return modifier;
}

async function userUpdateAfter(user: DbUser, props: UpdateCallbackProperties<'Users'>): Promise<DbUser> {
  // 4x notifyUsersAboutMentions

  return user;
}

async function userUpdateAsync(props: UpdateCallbackProperties<'Users'>) {
  updateUserMayTriggerReview(props);
  await userEditDeleteContentCallbacksAsync(props);
}

async function userEditAsync(user: DbUser, oldUser: DbUser, currentUser: DbUser | null, collection: CollectionBase<'Users'>, props: UpdateCallbackProperties<'Users'>) {
  await newSubforumMemberNotifyMods(user, oldUser, props.context);
  await approveUnreviewedSubmissions(user, oldUser, props.context);
  await handleSetShortformPost(user, oldUser, props.context);
  await updatingPostAudio(user, oldUser);
  await userEditChangeDisplayNameCallbacksAsync(user, oldUser, props.context);
  userEditBannedCallbacksAsync(user, oldUser);
  await newAlignmentUserSendPMAsync(user, oldUser, props.context);
  await newAlignmentUserMoveShortform(user, oldUser, props.context);

  // 4x convertImagesInObject
  // elasticSyncDocument

  await reindexDeletedUserContent(user, oldUser, props.context);
}

getCollectionHooks('Users').createValidate.add(userCreateValidate);
getCollectionHooks('Users').createBefore.add(userCreateBefore);
getCollectionHooks('Users').newSync.add(userNewSync);
getCollectionHooks('Users').createAfter.add(userCreateAfter);
getCollectionHooks('Users').newAfter.add(userNewAfter);
getCollectionHooks('Users').createAsync.add(userCreateAsync);
getCollectionHooks('Users').newAsync.add(userNewAsync);

getCollectionHooks('Users').updateValidate.add(userUpdateValidate);
getCollectionHooks('Users').updateBefore.add(userUpdateBefore);
getCollectionHooks('Users').editSync.add(userEditSync);
getCollectionHooks('Users').updateAfter.add(userUpdateAfter);
getCollectionHooks('Users').updateAsync.add(userUpdateAsync);
getCollectionHooks('Users').editAsync.add(userEditAsync);

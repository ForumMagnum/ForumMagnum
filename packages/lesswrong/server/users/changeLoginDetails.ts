import { getUserEmail } from "@/lib/collections/users/helpers";
import { UsersRepo } from "../repos";
import { auth0Client, getAuth0ProfileById } from "../authentication/auth0";
import Profile from "passport-auth0/lib/Profile";
import { userFindOneByEmail } from "../commonQueries";
import { encodeIntlError } from "@/lib/vulcan-lib";
import { isEAForum, verifyEmailsSetting } from "@/lib/instanceSettings";
import { createAnonymousContext, updateMutator } from "../vulcan-lib";
import Users from "@/lib/collections/users/collection";

const SOCIAL_LOGIN_PROVIDERS = ['google-oauth2', 'facebook'];

export async function canChangeLoginDetailsTo({email, password, currentUser}: {email: string, password: string, currentUser: DbUser}): Promise<boolean> {
  const usersRepo = new UsersRepo()

  const currentlyUsingSocialLogin = SOCIAL_LOGIN_PROVIDERS.includes(currentUser.services.auth0?.provider);
  const currentUserEmail = getUserEmail(currentUser);

  if (currentUserEmail === email && !currentlyUsingSocialLogin) {
    throw new Error('Must use different email, if you only want to change your password please log out and use "Reset password" in the login form')
  }

  const strictEmailMatches = await usersRepo.getUsersWithUnambiguousEmailAndAuth0(email);
  const ambiguousEmailMatches = await usersRepo.getUsersByAnyEmailField(email);

  const strictUserIds = new Set(strictEmailMatches.map(u => u._id));
  const ambiguousUserIds = new Set(ambiguousEmailMatches.map(u => u._id));

  if (![...strictUserIds].every(id => ambiguousUserIds.has(id)) || ![...ambiguousUserIds].every(id => strictUserIds.has(id))) {
    throw new Error("Email may match multiple existing users, please contact support");
  }

  if (strictEmailMatches.length > 1) {
    throw new Error("Email matches multiple existing users, please contact support");
  }

  const strictEmailMatch = strictEmailMatches.length === 1 ? strictEmailMatches[0] : null;

  if (!strictEmailMatch || (strictEmailMatch._id === currentUser._id && currentlyUsingSocialLogin)) {
    // Simplest case: there is no existing user with this email, or the existing user is the user that
    // is already logged in (and they are just changing from social login to email/password)
    return true;
  } else {
    // More fiddly case: there is another existing user with this email. We need the user to first merge this
    // account into theirs before they can adopt the email of the other account
    return false;
  }
}

// {
//   displayName: "w.howard256@gmail.com",
//   id: "auth0|668d4ad8a75bec03b0b26660",
//   user_id: "auth0|668d4ad8a75bec03b0b26660",
//   provider: "auth0",
//   name: {
//     familyName: undefined,
//     givenName: undefined,
//   },
//   emails: [
//     {
//       value: "w.howard256@gmail.com",
//     },
//   ],
//   picture: "https://s.gravatar.com/avatar/47a65a58c34440ba468840564e59c53d?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fw.png",
//   nickname: "w.howard256",
//   identities: [
//     {
//       user_id: "668d4ad8a75bec03b0b26660",
//       connection: "Forum-User-Migration",
//       provider: "auth0",
//       isSocial: false,
//     },
//   ],
//   _json: {
//     created_at: "2024-07-09T14:36:08.869Z",
//     email: "w.howard256@gmail.com",
//     email_verified: false,
//     identities: [
//       {
//         user_id: "668d4ad8a75bec03b0b26660",
//         connection: "Forum-User-Migration",
//         provider: "auth0",
//         isSocial: false,
//       },
//     ],
//     name: "w.howard256@gmail.com",
//     nickname: "w.howard256",
//     picture: "https://s.gravatar.com/avatar/47a65a58c34440ba468840564e59c53d?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fw.png",
//     updated_at: "2024-07-09T14:36:08.869Z",
//     user_id: "auth0|668d4ad8a75bec03b0b26660",
//   },
//   _raw: "{\"created_at\":\"2024-07-09T14:36:08.869Z\",\"email\":\"w.howard256@gmail.com\",\"email_verified\":false,\"identities\":[{\"user_id\":\"668d4ad8a75bec03b0b26660\",\"connection\":\"Forum-User-Migration\",\"provider\":\"auth0\",\"isSocial\":false}],\"name\":\"w.howard256@gmail.com\",\"nickname\":\"w.howard256\",\"picture\":\"https://s.gravatar.com/avatar/47a65a58c34440ba468840564e59c53d?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fw.png\",\"updated_at\":\"2024-07-09T14:36:08.869Z\",\"user_id\":\"auth0|668d4ad8a75bec03b0b26660\"}",
// }

async function adoptAuth0Profile({
  user,
  profile,
  context,
}: {
  user: DbUser;
  profile: typeof Profile;
  context: ResolverContext;
}): Promise<DbUser> {
  let newEmail: string | null = null;
  if (profile.emails && profile.emails.length > 0 && profile.emails[0].value) {
    newEmail = profile.emails[0].value;
  }

  const res = await updateMutator({
    collection: Users,
    documentId: user._id,
    set: {
      // @ts-ignore
      "services.auth0": profile,
      email: newEmail,
    },
    validate: false,
    currentUser: context.currentUser,
    context,
  });

  return res.data;
}

export async function changeLoginDetailsTo({
  email,
  password,
  currentUser,
  context,
}: {
  email: string;
  password: string;
  currentUser: DbUser;
  context: ResolverContext
}): Promise<void> {
  if (!(await canChangeLoginDetailsTo({ email, password, currentUser }))) {
    throw new Error("Cannot update login details, please contact support");
  }

  // TODO:
  // - [X] Sign up auth0 user
  // - [X] Update the services etc details on the user object
  // - [ ] Remove forum grant and (if poss) delete the old auth0 user (not sure what to do then if they want to revert, maybe we should just keep it)
  // - [ ] Do all the other email update things

  // Cases to test

  try {
    const res = await auth0Client.signupUser(email, password);
    // loginUser causes:
    // - {"error":"invalid_request","error_description":"Redirection is not available on /oauth/token endpoint."}
    //   - Caused by account link extension
    // - A memory leak where the user gets printed many times
    //   - Caused by printing the error

    await auth0Client.loginUser(email, password); // Required to avoid an error when they next log in
    const auth0Id = res?.user_id;

    if (!auth0Id) {
      throw new Error("Something has gone horribly wrong");
    }

    const qualifiedAuth0Id = `auth0|${auth0Id}`;

    const oldProfile = currentUser?.services.auth0;
    const profile = await getAuth0ProfileById(qualifiedAuth0Id);

    const updatedUser = await adoptAuth0Profile({ user: currentUser, profile, context });

    console.log("Signed up new user");
  } catch (e) {
    // Continue
  }
  
}

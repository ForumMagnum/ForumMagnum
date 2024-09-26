import { emailBodyStyles } from "@/themes/stylePiping";
import { createAdminContext, createMutator, Globals, runQuery } from "../vulcan-lib";
import PetrovDayActions from "@/lib/collections/petrovDayActions/collection";
import Users from "@/lib/vulcan-users";

const context = createAdminContext()

const assignPetrov2024Roles = async () => {
  // eslint-disable-next-line no-console
  console.log("Assigning Petrov 2024 roles")
  
  const signupMutation = async (variables: {
    email: string;
    username: string;
    password: string;
    subscribeToCurated: boolean;
    reCaptchaToken: string;
    abTestKey: string;
  }) => {
    const { data, errors } = await runQuery(
      `
      mutation signup(
        $email: String,
        $username: String,
        $password: String,
        $subscribeToCurated: Boolean,
        $reCaptchaToken: String,
        $abTestKey: String
      ) {
        signup(
          email: $email,
          username: $username,
          password: $password,
          subscribeToCurated: $subscribeToCurated,
          reCaptchaToken: $reCaptchaToken,
          abTestKey: $abTestKey
        ) {
          token
        }
      }
      `,
      variables,
      { ...context, req: {headers: {'x-forwarded-for': '127.0.0.1'}, connection: {remoteAddress: "127.0.0.1"}, socket: {remoteAddress: "127.0.0.1"}} as AnyBecauseHard, res: {setHeader: () => {}} as AnyBecauseHard}  
    );

    if (errors) {
      // eslint-disable-next-line no-console
      console.error('Signup mutation errors:', errors);
    }

    return data?.signup?.token;
  };

  const generatePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };  

  const passwords = [
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword(),
    generatePassword()
  ]

  const users = [
    {
      email: "raemon+east-petrov-1@lesswrong.com",
      username: "StanislavPetrov",
      password: passwords[0],
      role: "eastPetrov",
    },
    {
      email: "raemon+east-general-1@lesswrong.com",
      username: "GeneralAndropov",
      password: passwords[1],
      role: "eastGeneral",
    },
    {
      email: "raemon+east-general-2@lesswrong.com",
      username: "GeneralBelov",
      password: passwords[2],
      role: "eastGeneral",
    },
    {
      email: "raemon+east-general-3@lesswrong.com",
      username: "GeneralChernenko",
      password: passwords[3],
      role: "eastGeneral",
    },
    {
      email: "raemon+east-general-4@lesswrong.com",
      username: "GeneralDonskoy",
      password: passwords[4],
      role: "eastGeneral",
    },
    {
      email: "raemon+east-general-5@lesswrong.com",
      username: "GeneralEgorov",
      password: passwords[5],
      role: "eastGeneral",
    },
    {
      email: "raemon+west-petrov-1@lesswrong.com",
      username: "StanleyPeterson",
      password: passwords[6],
      role: "westPetrov",
    },
    {
      email: "raemon+west-general-1@lesswrong.com",
      username: "GeneralAnderson",
      password: passwords[7],
      role: "westGeneral",
    },
    {
      email: "raemon+west-general-2@lesswrong.com",
      username: "GeneralBaker",
      password: passwords[8],
      role: "westGeneral",
    },
    {
      email: "raemon+west-general-3@lesswrong.com",
      username: "GeneralCarter",
      password: passwords[9],
      role: "westGeneral",
    },
    {
      email: "raemon+west-general-4@lesswrong.com",
      username: "GeneralDawson",
      password: passwords[10],
      role: "westGeneral",
    },
    {
      email: "raemon+west-general-5@lesswrong.com",
      username: "GeneralEvans",
      password: passwords[11],
      role: "westGeneral",
    },
  ]

  for (const [i, user] of users.entries()) {
    const newUser = await signupMutation({
      email: user.email,
      username: user.username,
      password: user.password,
      subscribeToCurated: false,
      reCaptchaToken: "token",
      abTestKey: "test"
    })
  } 

  const usersWithPasswords = await Users.find({createdAt: {$gte: new Date("2024-09-25")}, username: {$in: users.map(user => user.username)}}).fetch()
  
  const usersWithInfo = usersWithPasswords.map((user, i) => ({_id: user._id, username: user.username, displayName: user.displayName, password: users[i].password}))

  
  for (const [i, user] of usersWithPasswords.entries()) {
    await createMutator({
      collection: PetrovDayActions,
      document: {
        userId: user._id,
        actionType: "hasRole",
        data: {
          role: users[i].role,
        },
        createdAt: new Date(),
      },
      currentUser: user,
      validate: false,
    })
  }

  // eslint-disable-next-line no-console
  console.log(usersWithInfo)
  // eslint-disable-next-line no-console
  console.log("done")
}

Globals.assignPetrov2024Roles = assignPetrov2024Roles


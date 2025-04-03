import PetrovDayActions from "@/server/collections/petrovDayActions/collection";
import Users from "@/server/collections/users/collection";
import { filterWhereFieldsNotNull } from "@/lib/utils/typeGuardUtils";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { runQuery } from "../vulcan-lib/query";
import { createPetrovDayAction } from "../collections/petrovDayActions/mutations";
import { computeContextFromUser } from "../vulcan-lib/apollo-server/context";

const context = createAdminContext()

export const assignPetrov2024Roles = async () => {
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

  const characterInfo = [
    {
      email: "raemon+east-petrov-1@lesswrong.com",
      username: "StanislavPetrov",
      password: passwords[0],
      role: "eastPetrov",
      side: "east",
    },
    {
      email: "raemon+east-general-1@lesswrong.com",
      username: "GeneralAndropov",
      password: passwords[1],
      role: "eastGeneral",
      side: "east",
    },
    {
      email: "raemon+east-general-2@lesswrong.com",
      username: "GeneralBelov",
      password: passwords[2],
      role: "eastGeneral",
      side: "east",
    },
    {
      email: "raemon+east-general-3@lesswrong.com",
      username: "GeneralChernenko",
      password: passwords[3],
      role: "eastGeneral",
      side: "east",
    },
    {
      email: "raemon+east-general-4@lesswrong.com",
      username: "GeneralDonskoy",
      password: passwords[4],
      role: "eastGeneral",
      side: "east",
    },
    {
      email: "raemon+east-general-5@lesswrong.com",
      username: "GeneralEgorov",
      password: passwords[5],
      role: "eastGeneral",
      side: "east",
    },
    {
      email: "raemon+west-petrov-1@lesswrong.com",
      username: "StanleyPeterson",
      password: passwords[6],
      role: "westPetrov",
      side: "west",
    },
    {
      email: "raemon+west-general-1@lesswrong.com",
      username: "GeneralAnderson",
      password: passwords[7],
      role: "westGeneral",
      side: "west",
    },
    {
      email: "raemon+west-general-2@lesswrong.com",
      username: "GeneralBrookes",
      password: passwords[8],
      role: "westGeneral",
      side: "west",
    },
    {
      email: "raemon+west-general-3@lesswrong.com",
      username: "GeneralCarter",
      password: passwords[9],
      role: "westGeneral",
      side: "west",
    },
    {
      email: "raemon+west-general-4@lesswrong.com",
      username: "GeneralDawson",
      password: passwords[10],
      role: "westGeneral",
      side: "west",
    },
    {
      email: "raemon+west-general-5@lesswrong.com",
      username: "GeneralEvans",
      password: passwords[11],
      role: "westGeneral",
      side: "west",
    },
  ]

  for (const [i, user] of characterInfo.entries()) {
    const newUser = await signupMutation({
      email: user.email,
      username: user.username,
      password: user.password,
      subscribeToCurated: false,
      reCaptchaToken: "token",
      abTestKey: "test"
    })
  } 

  const usersWithPasswords = await Users.find({createdAt: {$gte: new Date("2024-09-25")}, username: {$in: characterInfo.map(user => user.username)}}).fetch()
  
  const usersWithInfo = usersWithPasswords.map((user, i) => ({_id: user._id, username: user.username, displayName: user.displayName, password: characterInfo[i].password}))
    
  const results = await Promise.all([...usersWithPasswords.flatMap(async (user, i) => {
    // Create a context with the specific user
    const userContext = await computeContextFromUser({ user, isSSR: false });
    
    return [
      createPetrovDayAction({
        data: {
          userId: user._id,
          actionType: "hasRole",
          data: {
            role: characterInfo[i].role,
          }
        }
      }, userContext, true), 
      createPetrovDayAction({
        data: {
          userId: user._id,
          actionType: "hasSide",
          data: {
            side: characterInfo[i].side,
          }
        }
      }, userContext, true)
    ];
  })])

  const adminContext = createAdminContext();
  const currentAdmin = adminContext.currentUser;

  const citizenOptIns = await PetrovDayActions.find({actionType: "optIn"}).fetch()
  const citizenFiltered = filterWhereFieldsNotNull(citizenOptIns, 'userId')
  const userIdsOfEastLeaders = ['x5S2Kuj6TfQTGuo63',
    '4QFiQcHgf6hvtiLqF',
    '6c2KCEXTGogBZ9KoE',
    'mHfRYusxhhJhE5drc',
    'sJv7yzCp5xfWBAPvG',
    'YFiFbXgjBpDKZT93g']

  const userIdsOfWestLeaders = ['X9jdpCokhLjCMZEc3',
    'gQqkEPTcMX48JPsew',
    'oxqFdPeNG7DuSmYGD',
    'sdY3wMWoMtc5WdSra',
    'Sfj7wYBmHeZyLbzRu',
    'NHMSJPMdExqDxPsY3']

  const remainingCitizens = citizenFiltered.filter(citizen => !userIdsOfEastLeaders.includes(citizen.userId) && !userIdsOfWestLeaders.includes(citizen.userId))

  const firstHalfOfCitizens = remainingCitizens.slice(0, Math.floor(remainingCitizens.length / 2))
  const offsetLength = firstHalfOfCitizens.length
  const secondHalfOfCitizens = remainingCitizens.slice(offsetLength)

  await Promise.all(firstHalfOfCitizens.map((citizen, i) => createPetrovDayAction({
    data: {
      userId: citizen.userId,
      actionType: "hasSide",
      data: {
        side: "east",
      }
    }
  }, adminContext, true)))

  await Promise.all(firstHalfOfCitizens.map((citizen, i) => createPetrovDayAction({
    data: {
      userId: citizen.userId,
      actionType: "hasRole",
      data: {
        role: "citizen",
      }
    }
  }, adminContext, true)))
  
  await Promise.all(secondHalfOfCitizens.map((citizen, i) => createPetrovDayAction({
    data: {
      userId: citizen.userId,
      actionType: "hasSide",
      data: {
        side: "west",
      }
    }
  }, adminContext, true)))

  await Promise.all(secondHalfOfCitizens.map((citizen, i) => createPetrovDayAction({
    data: {
      userId: citizen.userId,
      actionType: "hasRole",
      data: {
        role: "citizen",
      }
    }
  }, adminContext, true)))

  await Promise.all(userIdsOfEastLeaders.map((userId, i) => createPetrovDayAction({
    data: {
      userId: userId,
      actionType: "hasSide",
      data: {
        side: "east",
      }
    }
  }, adminContext, true)))

  await Promise.all(userIdsOfWestLeaders.map((userId, i) => createPetrovDayAction({
    data: {
      userId: userId,
      actionType: "hasSide",
      data: {
        side: "west",
      }
    }
  }, adminContext, true)))

  // const westGenerals = usersWithInfo.filter((user, i) => users[i].role === "westGeneral")
  // const eastGenerals = usersWithInfo.filter((user, i) => users[i].role === "eastGeneral")
  // const allGenerals = westGenerals.concat(eastGenerals)

  // const citizens = Users.

  // await createPost({
  //   data: {
  //     title: "West Generals Meeting",
  //     draft: true,
  //     collabEditorDialogue: true,
  //     coauthorStatuses: westGenerals.map(user => ({userId: user._id, confirmed: true, requested: false})),
  //     shareWithUsers: participants,
  //     sharingSettings: {
  //       anyoneWithLinkCan: "none",
  //       explicitlySharedUsersCan: "edit",
  //     },
  //     createdAt: new Date(),
  //   },
  // })
  // await createPost({
  //   data: {
  //     title: "East Generals Meeting",
  //     coauthorStatuses: eastGenerals.map(user => ({userId: user._id, confirmed: true, requested: false})),
  //     createdAt: new Date(),
  //   },
  // })
  // await createPost({
  //   data: {
  //     title: "All Generals Meeting",
  //     coauthorStatuses: allGenerals.map(user => ({userId: user._id, confirmed: true, requested: false})),
  //     createdAt: new Date(),
  //   },
  // })

  // eslint-disable-next-line no-console
  console.log(usersWithInfo)
  // eslint-disable-next-line no-console
  console.log("done")
}


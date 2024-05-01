import React from "react";
import { LWEvents } from "../../lib/collections/lwevents";
import Users from "../../lib/vulcan-users";
import { wrapAndSendEmail } from "../emails";
import { Globals, createAdminContext } from "../vulcan-lib";

const LessOnlineEmail = (user: DbUser) => {
  if (!user?.displayName) return
  return <div>
    <p>Hi, ${user.displayName.split(" ")[0]}</p>
    <p>I'm the Less Online Messaging bot. I'm here to help you stay on top of your messages.</p>
    <p>If you have any questions, feedback, or just want to say hi, feel free to reach out to me.</p>
    <p>Best,</p>
    <p>The Less Online Messaging bot</p>
  </div>
}

const lessOnlineMessaging = async () => {
  // const lwevents = await LWEvents.find({createdAt: {$gte: new Date("2024-01-28")}}).fetch()
  // console.log(lwevents.length)

  // console.log(lwevents.length, Array.from(new Set(lwevents.map(event => event.userId))).length)

  const users = await Users.find({
    lastNotificationsCheck: {$gt: new Date("2020-01-01")},
    $or: [{ banned: { $exists: false } }, { banned: { $lte: new Date() } }],
    karma: {$gte: 0}
  }).fetch()

  const ignoredDisplayNames = ['Elizabeth', 'Scott Alexander', 'Eliezer Yudkowsky', 'Tsvi Benson-Tilsen', 'TsviBT', '[DEACTIVATED] Duncan Sabien', 'Raelifin', 'PeterMcCluskey', 'Peter_McCluskey', 'ozymandias', 'Rob Bensinger', 'Ziz', 'Gwen_', 'ialdabaoth', 'Holly_Elmore', 'David_Gerard', 'sarahconstantin', 'Sarah Constantin', 'LoganStrohl', 'Malcolm Ocean', 'MalcolmOcean', 'johnswentworth', 'eukaryote', 'Eric Neyman', 'Eneasz Brodski', 'Eli Tyre', 'Malmesbury']

  // const usersMinusLessOnline = users.filter(user => ignoredDisplayNames.includes(user.displayName))
  // console.log(users.length)

  // const raemon = await Users.findOne({username: "Raemon"})
  // const benito = await Users.findOne({displayName: "Ben Pace"})
  // console.log(raemon)
  // console.log(users)
  // if (raemon) {
  //   await wrapAndSendEmail({
  //     user: raemon,
  //     subject: "Less Online Messaging",
  //     body: LessOnlineEmail(raemon)
  //   });
  // }
  for (const user of users) {
    if (user.displayName === "Ben Pace") {
      await wrapAndSendEmail({
        user: user,
        subject: "Less Online Messaging",
        body: LessOnlineEmail(user)
      });
    }
  }
}

Globals.lessOnlineMessaging = lessOnlineMessaging


import React from "react";
import { LWEvents } from "../../lib/collections/lwevents";
import Users from "../../lib/vulcan-users";
import { wrapAndSendEmail } from "../emails";
import { Globals, createAdminContext } from "../vulcan-lib";

const LessOnlineEmail = (user: DbUser) => {
  if (!user?.displayName) return
  return <div>
    <p>
      tl;dr The LessWrong team is hosting LessOnline, a weekend festival celebrating truth-seeking and blogging, from May 31st to Sun June 2nd in Berkeley, California. Tickets are $400 minus your LW karma in cents. Housing and childcare are available for purchase. We’re raising ticket prices from $400 to $500 on May 13th (as late bookings are more costly) and you can buy tickets at the website.
    </p>
    <p>
      Hello there,
    </p>
    <p>
      People have formed a lot of excellent relationships and birthed a lot of fascinating and useful ideas in the blogosphere, but to fully build those relationships I think having an in-person component is really valuable. I think LessOnline will be a place where you can have lots of high bandwidth, in person conversations with people and on topics that you couldn’t have anywhere else.
    </p>
    <p>
      It's at the end of this month, May 31 — June 2, at the LessWrong team's home venue Lighthaven in Berkeley, CA. 
    </p>
    <p>
      The tickets are $400 (minus your LW karma in cents) but the price will increase by $100 on Monday May 13th. You can get tickets at Less.Online.
    </p>
    <p>
      Which folks are we bringing together?
    </p>
    <ul>
      <li>
        Writers about the art of rationality — Eliezer Yudkowsky, Zvi Mowshowitz,Duncan Sabien, Nate Soares, Jacob Falkovich, Logan Strohl, Alkjash, and more.
      </li>
      <li>
        Writers who try to understand and earnestly explain how the world works — Scott Alexander, Kevin Simler, Sarah Constantin, Crémieux Recueil, Alexey Guzey, Aella, Katja Grace, and more.
      </li>
      <li>
        Writers of rational fiction with intelligent characters and lawful universes — Alexander Wales, Alicorn, Daystar Eld, Jamie Wahls, and more.
      </li>
      <li>
        And anyone else who’s excited about these topics and wants to join!
      </li>
    </ul>
    <p>
      What will happen at LessOnline?
    </p>
    <ul>
      <li>
        The focus is on having fascinating conversations. We've optimized the venue for having lots of nooks, whiteboards, fun secrets, and a fractal layout that’s great for focused intellectual conversation even when there are 400 people nearby.</li>
      <li>
        There will be a bunch of optional workshops, talks and panels. I’m especially excited about writing workshops by people like Sarah Constantin, Duncan Sabien and Alicorn, as well as talks and panels on subjects like Moloch, Shoggoths, Emotions, Genetic Enhancement, Error-Correcting Codes, Magic the Gathering, and more.
      </li>
      <li>
        There’ll be optional entertainment including a weekend-long puzzle hunt throughout Lighthaven and also a rationalist dance party led by The Fooming Shoggoths (with many unreleased tracks being played).
      </li>
      <li>
        And anything else that attendees want to do! There’ll be a google sheet that anyone can edit to add activities or sessions.
      </li>
    </ul>
    <p>
      Personally, I started working on LessWrong in 2017, and I’d love to meet more of you people who’ve read and contributed to the blogosphere and the broader scene. There’s 25,000 people getting this email (everyone active on LessWrong since January 2020), and I believe that some of the most interesting and thoughtful and disagreeable and characterful people alive are on this mailing list, and I hope many of you come :-)
    </p>
    <p>
      — Ben Pace & the LessOnline Team
    </p>
    <p>
      P.S. This festival started as an idea when we were talking to the team behind the forecasting & prediction market festival Manifest. They ran a smash-hit event last year at Lighthaven, and this year they encouraged us to run our own event as part of a series. This means that the weekend right after LessOnline is Manifest, and we've teamed up to offer a discounted ticket to both. Already many people have made plans to come for both and will be staying at Lighthaven for the week in between!
    </p>
    <img src=""/>
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


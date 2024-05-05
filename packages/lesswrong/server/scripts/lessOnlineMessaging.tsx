import React from "react";
import { LWEvents } from "../../lib/collections/lwevents";
import Users from "../../lib/vulcan-users";
import { wrapAndSendEmail } from "../emails";
import { Globals, createAdminContext } from "../vulcan-lib";
import { userEmailAddressIsVerified } from "../../lib/collections/users/helpers";

const LessOnlineEmail = () => {
  return <div>
    <p>
    tl;dr: The LessWrong team is hosting <a href="https://less.online/"><b>LessOnline</b></a>, a weekend festival celebrating truth-seeking and blogging, from May 31st to June 2nd in Berkeley, California. Tickets are $400 <em>minus your LW karma in cents</em>. Housing and childcare are available for purchase.
    </p>
    <p>We’re raising ticket prices from $400 to $500 on May 13th (as late bookings are harder to plan around). <a href="https://less.online/"><b>You can buy tickets at the website.</b></a></p>
    <p>More details below.</p>
    <p></p>
    <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1712166847/habryka_6_g84ubl.png"/>
    <p></p>
    <p>
      Hello LessWrong reader,
    </p>
    <p>
      I'm Ben from the LessWrong team. We're bringing people together for a weekend festival celebrating truth-seeking and blogging. It’s called <a href="https://less.online/">LessOnline: A Festival of Writers Who are Wrong on the Internet (But Striving To Be Less So)</a>. There are many people trying to understand the world and earnestly write up explanations of it. We're gathering them for a weekend of engaging arguments, workshops, and festivities.
    </p>
    <p>
     Some people’s most enduring relationships are from the blogosphere, and I know of no better source of new ideas. But I think in-person adds an extra dimension. I think LessOnline will be a place where you can have lots of high bandwidth, in-person conversations with people and on topics that you couldn’t have anywhere else.
    </p>
    <p>
      It's at the end of this month, May 31 — June 2, at the LessWrong team's home venue <a href="https://www.lighthaven.space/">Lighthaven</a> in Berkeley, CA. 
    </p>
    <p>
      <b>The tickets are $400 (minus your LW karma in cents) but the price will increase by $100 on Monday May 13th. You can get tickets at <a href="https://less.online/">less.online</a>.</b>
    </p>
    <p>
      Which folks are we bringing together?
    </p>
    <ul>
      <li>
        <b>Writers about the art of rationality</b> — Eliezer Yudkowsky, Zvi Mowshowitz, Duncan Sabien, Nate Soares, Jacob Falkovich, Logan Strohl, Alkjash, and more.
      </li>
      <li>
        <b>Writers who try to understand and earnestly explain how the world works</b> — Scott Alexander, Kevin Simler, Sarah Constantin, Crémieux Recueil, Aella, Katja Grace, Joe Carlsmith, and more.
      </li>
      <li>
        <b>Writers of rational fiction with intelligent characters and lawful universes</b> — Alexander Wales, Alicorn, Daystar Eld, Jamie Wahls, and more.
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
        <b>The focus is on having fascinating conversations.</b> We've optimized the venue for having lots of nooks, whiteboards, fun secrets, and a fractal layout that’s great for focused intellectual conversation even when there are 400 people nearby.</li>
      <li>
       <b> There will be a bunch of optional workshops, talks and panels.</b> I’m especially excited about the planned writing workshops by some of the great writers coming, as well as talks and panels on subjects like Moloch, Shoggoths, Emotions, Genetic Enhancement, Error-Correcting Codes, Magic the Gathering, and more.
      </li>
      <li>
        <b>There’ll be optional entertainment</b> including a weekend-long puzzle hunt throughout <b><a href="https://www.lighthaven.space/">Lighthaven</a></b> and also a rationalist dance party led by <b><a href="https://www.lesswrong.com/posts/YMo5PuXnZDwRjhHhE/lesswrong-s-first-album-i-have-been-a-good-bing">The Fooming Shoggoths</a></b> (with many unreleased tracks being played).
      </li>
      <li>
        <b>And anything else that attendees want to do!</b> There’ll be a google sheet that anyone can edit to add activities or sessions.
      </li>
    </ul>
    <p>
      Personally, I started working on LessWrong in 2017, and I’d love to meet more of you people who’ve read and contributed to the blogosphere and the broader scene. There’s 25,000 people getting this email (everyone active on LessWrong since January 2020), and I believe that some of the most interesting and thoughtful and disagreeable and characterful people alive are on this mailing list, and I hope many of you come :-)

    </p>
    <p>
      — Ben Pace & the <b><a href="https://less.online/">LessOnline</a></b> Team
    </p>
    <hr/>
    <p>
      P.S. This festival started as an idea when we were talking to the team behind the forecasting & prediction market festival <b><a href="https://www.manifest.is/">Manifest</a></b>. They ran a smash-hit event last year at Lighthaven, and this year they encouraged us to run our own event as part of a series. This means that the weekend right after LessOnline is Manifest, and we've <b><a href="https://less.online/#tickets-section">teamed up to offer a discounted ticket to both</a></b>. Already many people have made plans to come for both and will be staying at Lighthaven for the week in between!
    </p>
    <p>
      P.P.S. <b>Got questions?</b> You can’t reply to this email, but <b>comments and questions are welcome in <a href="https://www.lesswrong.com/posts/MmWziepD8DDauSide/lessonline-festival-updates-thread">this LW thread</a></b> and/or using <b>the intercom bubble</b> in the bottom right of the <a href="https://less.online/">less.online</a> or <a href="http://lesswrong.com">lesswrong.com</a> websites.

    </p>
  </div>
}

const lessOnlineMessaging = async () => {

  // const raemon = await Users.findOne({username: "Raemon"})
  // const benito = await Users.findOne({displayName: "Ben Pace"})
  // const habryka = await Users.findOne({displayName: "habryka"})
  // const kave = await Users.findOne({displayName: "kave"})
  // const robert = await Users.findOne({displayName: "RobertM"})
  // const ruby = await Users.findOne({displayName: "Ruby"})

  // const teamUsers = [
  //   raemon,
  //   benito,
  //   habryka,
  //   kave
  //   // ruby,
  //   // robert
  // ]

  // for (const user of teamUsers) {
  //   if (user) {
  //     await wrapAndSendEmail({
  //       user: user,
  //       subject: "LessOnline: A Festival of Truth-Seeking and Blogging (May 31 — Jun 2, Berkeley CA)",
  //       body: LessOnlineEmail()
  //     });
  //   }
  // }








  const lwevents = await LWEvents.find({['properties.subject']: 'LessOnline: A Festival of Truth-Seeking and Blogging (May 31 — Jun 2, Berkeley CA)', name: "emailSent", createdAt: {$gte: new Date("2024-05-03")}}, {sort: {createdAt: -1}}).fetch()

  const lwEventUserIds = Array.from(new Set(lwevents.map(event => event.userId)))
  console.log({lwEventUserIds: lwEventUserIds.length})
  // const users = await Users.find({_id: '8TJZ4gu7JNnTtrG4d'}).fetch()
  // console.log(users[0].email, users[0].createdAt, users[0].displayName)

  // console.log(lwevents.length, Array.from(new Set(lwevents.map(event => event.userId))).length)

  const users = await Users.find({
    lastNotificationsCheck: {$gt: new Date("2020-01-01")},
    $or: [{ banned: { $exists: false } }, { banned: { $lte: new Date() } }],
    karma: {$gte: 0},
    deleted: false,
  }, {sort: {createdAt: 1}}).fetch()


  const ignoredDisplayNames = ['Elizabeth', 'Scott Alexander', 'Eliezer Yudkowsky', 'Tsvi Benson-Tilsen', 'TsviBT', '[DEACTIVATED] Duncan Sabien', 'Raelifin', 'PeterMcCluskey', 'Peter_McCluskey', 'ozymandias', 'Rob Bensinger', 'Ziz', 'Gwen_', 'ialdabaoth', 'Holly_Elmore', 'David_Gerard', 'sarahconstantin', 'Sarah Constantin', 'LoganStrohl', 'Malcolm Ocean', 'MalcolmOcean', 'johnswentworth', 'eukaryote', 'Eric Neyman', 'Eneasz Brodski', 'Eli Tyre', 'Malmesbury', 'Zvi', 'Kaj_Sotala', 'Vaniver', 'Alicorn', 'Joe Carlsmith', 'RobinGoins']

  const emailList = [
    "Forrest.weiswolf@gmail.com",
    "declangw@shaw.ca",
    "washi.chiisai@gmail.com",
    "drake.morrison@hey.com",
    "davidcjames@gmail.com",
    "robin@coponder.com",
    "drethelin@gmail.com",
    "philip.hazelden@gmail.com",
    "so8res@gmail.com",
    "bshlegeris@gmail.com",
    "philip.gubbins@ae.studio",
    "giovanni@riva.ink",
    "zac.hatfield.dodds@gmail.com",
    "jasminermj@gmail.com",
    "b@w-r.me",
    "declangw@shaw.ca",
    "drake.morrison@hey.com",
    "christinelpeterson1@gmail.com",
    "ed@edwinevans.me",
    "kaya@emailkaya.com",
    "vkgsfca@gmail.com",
    "scientiapotentiaest1@gmail.com",
    "ja.kopczynski@gmail.com",
    "philip.gubbins@ae.studio",
    "unoriginaljack@icloud.com",
    "philip.gubbins@ae.studio",
    "patrick.orthonormal@gmail.com",
    "a@machinaut.com",
    "vaniver@gmail.com",
    "lesswrong@cloomis.com",
    "havenharms23@gmail.com",
    "gworley3@gmail.com",
    "df@danielfilan.com",
    "maxhowald@gmail.com"
  ];

  console.log({users: users.length, emailList: emailList.length, ignoredDisplayNames: ignoredDisplayNames.length, userIds: lwEventUserIds.length})

  const usersMinusLessOnline = users.filter(user => {
    const userNoDisplayNameOrShouldntIgnoreName = !user?.displayName || !ignoredDisplayNames.includes(user.displayName)
    const userNoEmailOrShouldntIgnoreEmail = !user?.email || !emailList.includes(user.email)
    const userNoEmailsOrShouldntIgnoreEmails = !user?.emails || !emailList.includes(user.emails[0])
    const userIdNotSentYet = !lwEventUserIds.includes(user._id)

    return userNoDisplayNameOrShouldntIgnoreName && userNoEmailOrShouldntIgnoreEmail && userNoEmailsOrShouldntIgnoreEmails && userIdNotSentYet && !user.unsubscribeFromAll
  })

  // const filteredForVerified = usersMinusLessOnline.filter(user => userEmailAddressIsVerified(user) && user.karma === 0)

  console.log(usersMinusLessOnline.length)

  
  for (let i = 0; i < usersMinusLessOnline.length; i++) {

    console.log(`${i}/${usersMinusLessOnline.length}`, 
    usersMinusLessOnline[i].displayName, 
    usersMinusLessOnline[i].karma, 
    usersMinusLessOnline[i].createdAt, 
    usersMinusLessOnline[i]._id
    )

    if (usersMinusLessOnline[i]) {
      try {
        await wrapAndSendEmail({
          user: usersMinusLessOnline[i],
          subject: "LessOnline: A Festival of Truth-Seeking and Blogging (May 31 — Jun 2, Berkeley CA)",
          body: LessOnlineEmail()
        });
      } catch (err) {
        console.log(err)
      }
    }
  }
}

Globals.lessOnlineMessaging = lessOnlineMessaging


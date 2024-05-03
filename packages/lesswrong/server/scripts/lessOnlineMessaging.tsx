import React from "react";
import { LWEvents } from "../../lib/collections/lwevents";
import Users from "../../lib/vulcan-users";
import { wrapAndSendEmail } from "../emails";
import { Globals, createAdminContext } from "../vulcan-lib";

const LessOnlineEmail = () => {
  return <div>
    <p>
    <i>tl;dr The LessWrong team is hosting <b><a href="https://less.online/">LessOnline, a weekend festival celebrating truth-seeking and blogging</a>,from May 31st to Sun June 2nd in Berkeley, California</b>. Tickets are $400 minus your LW karma in cents. Housing and childcare are available for purchase. <b>We’re raising ticket prices from $400 to $500 on May 13th</b> (as late bookings are more costly) and <b><a href="https://less.online/">you can buy tickets at the website</a></b>.</i>
    </p>
    <p>
      Hello LessWrong reader,
    </p>
    <p>
      We're bringing people together for a weekend festival celebrating truth-seeking and blogging. It’s called <b><a href="https://less.online/">LessOnline: A Festival of Writers Who are Wrong on the Internet (But Striving To Be Less So)</a></b>. There are many people trying to understand the world and earnestly write up explanations of it, and this is to celebrate them and their attempts.
    </p>
    <p>
     Some people’s most enduring relationships are from the blogosphere, and I know of no better source of new ideas. But I think in-person adds an extra dimension. I think LessOnline will be a place where you can have lots of high bandwidth, in-person conversations with people and on topics that you couldn’t have anywhere else.
    </p>
    <p>
      It's at the end of this month, May 31 — June 2, at the LessWrong team's home venue <b><a href="https://www.lighthaven.space/">Lighthaven</a></b> in Berkeley, CA. 
    </p>
    <p>
      <b>The tickets are $400 (minus your LW karma in cents) but the price will increase by $100 on Monday May 13th. You can get tickets at <a href="https://less.online/">Less.Online</a>.</b>
    </p>
    <p>
      Which folks are we bringing together?
    </p>
    <ul>
      <li>
        <b>Writers about the art of rationality</b> — Eliezer Yudkowsky, Zvi Mowshowitz, Duncan Sabien, Nate Soares, Jacob Falkovich, Logan Strohl, Alkjash, and more.
      </li>
      <li>
        <b>Writers who try to understand and earnestly explain how the world works</b> — Scott Alexander, Kevin Simler, Sarah Constantin, Crémieux Recueil, Aella, Katja Grace, and more.
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
       <b> There will be a bunch of optional workshops, talks and panels.</b> I’m especially excited about writing workshops by writers like Sarah Constantin, Duncan Sabien, and Alicorn, as well as talks and panels on subjects like Moloch, Shoggoths, Emotions, Genetic Enhancement, Error-Correcting Codes, Magic the Gathering, and more.
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
    <p>
      P.S. This festival started as an idea when we were talking to the team behind the forecasting & prediction market festival <b><a href="https://www.manifest.is/">Manifest</a></b>. They ran a smash-hit event last year at Lighthaven, and this year they encouraged us to run our own event as part of a series. This means that the weekend right after LessOnline is Manifest, and we've <b><a href="https://less.online/#tickets-section">teamed up to offer a discounted ticket to both</a></b>. Already many people have made plans to come for both and will be staying at Lighthaven for the week in between!
    </p>
    <p>
      P.P.S. <b>Got questions?</b> You can’t reply to this email, but <b>comments and questions are welcome in <a href="https://www.lesswrong.com/posts/MmWziepD8DDauSide/lessonline-festival-updates-thread">this LW thread</a></b> and/or using <b>the intercom bubble</b> in the bottom right of the <a href="https://less.online/">less.online</a> or <a href="http://lesswrong.com">lesswrong.com</a> websites.

    </p>
    <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1712166847/habryka_6_g84ubl.png"/>
  </div>
}

const lessOnlineMessaging = async () => {
  // const lwevents = await LWEvents.find({createdAt: {$gte: new Date("2024-01-28")}}).fetch()
  // console.log(lwevents.length)

  // console.log(lwevents.length, Array.from(new Set(lwevents.map(event => event.userId))).length)

  // const users = await Users.find({
  //   lastNotificationsCheck: {$gt: new Date("2020-01-01")},
  //   $or: [{ banned: { $exists: false } }, { banned: { $lte: new Date() } }],
  //   karma: {$gte: 0}
  // }).fetch()

  // const ignoredDisplayNames = ['Elizabeth', 'Scott Alexander', 'Eliezer Yudkowsky', 'Tsvi Benson-Tilsen', 'TsviBT', '[DEACTIVATED] Duncan Sabien', 'Raelifin', 'PeterMcCluskey', 'Peter_McCluskey', 'ozymandias', 'Rob Bensinger', 'Ziz', 'Gwen_', 'ialdabaoth', 'Holly_Elmore', 'David_Gerard', 'sarahconstantin', 'Sarah Constantin', 'LoganStrohl', 'Malcolm Ocean', 'MalcolmOcean', 'johnswentworth', 'eukaryote', 'Eric Neyman', 'Eneasz Brodski', 'Eli Tyre', 'Malmesbury']

  // const usersMinusLessOnline = users.filter(user => ignoredDisplayNames.includes(user.displayName))
  // console.log(users.length)

  const raemon = await Users.findOne({username: "Raemon"})
  const benito = await Users.findOne({displayName: "Ben Pace"})
  const habryka = await Users.findOne({displayName: "habryka"})
  const kave = await Users.findOne({displayName: "kave"})
  const users = [
    raemon, 
    benito, 
    // habryka, 
    // kave
  ]
  
  for (const user of users) {
    if (user) {
      await wrapAndSendEmail({
        user: user,
        subject: "LessOnline: A Festival of Truth-Seeking and Blogging (May 31 — Jun 2, Berkeley CA)",
        body: LessOnlineEmail()
      });
    }
  }

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
  // for (const user of users) {
  //   if (user.displayName === "Ben Pace") {
  //     await wrapAndSendEmail({
  //       user: user,
  //       subject: "LessOnline: A Festival of Truth-Seeking and Blogging (May 31 — Jun 2, Berkeley CA)",
  //       body: LessOnlineEmail(user)
  //     });
  //   }
  // }
}

Globals.lessOnlineMessaging = lessOnlineMessaging


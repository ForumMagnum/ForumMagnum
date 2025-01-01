import React from "react";
import { LWEvents } from "../../lib/collections/lwevents";
import Users from "../../lib/vulcan-users";
import { wrapAndSendEmail } from "../emails";
import { Globals, createAdminContext } from "../vulcan-lib";
import { userEmailAddressIsVerified } from "../../lib/collections/users/helpers";
import { chunk } from 'lodash';

const fundraiserEmail = () => {
  return <div>
    <p>
      Lightcone Infrastructure, which runs <a href="www.lesswrong.com">LessWrong</a> and <a href="www.lighthaven.space">Lighthaven</a>, is fundraising. We need to raise ~$3M for the next 12 months. We're in a unique position where most of our historical funders continue to consider us highly cost-effective but can't fund us due to various constraints.
    </p>

    <p>
      <b><a href="https://lightconeinfrastructure.com/donate">Donate here</a></b>, reply to this email, or message me on Signal at +1 510 944 3235 any time. Our fundraiser lasts until EOD January 13th. We are currently at $1.3M / $3M.
    </p>

    <p>
      That's really all that this email is about! But if you want to know more, keep reading.
    </p>

    <p>
      Best, <br />
      Oliver Habryka (CEO of Lightcone Infrastructure)
    </p>

    <br />
    <hr />
    <br />

    <p><i>
      (This email is going out to approximately everyone who has ever signed up on LessWrong. Don't worry, we will only send an email like this at most once per year.)
    </i></p>

    <p>
      As you may or may not know, I've been running LessWrong for the last 7 years during which my team has grown into the central infrastructure provider for the rationality and AI x-risk ecosystem. This year, due to most of our historical funders being unable to fund us, we are running a big public fundraiser for the first time. <strong>We have so far raised $1.3M but need to raise another ~$1.7M if we want to survive the next year.</strong>
    </p>

    <p>
      In these 7 years we've revived a dying <b><a href="http://lesswrong.com">LessWrong</a></b> and grown it by ~5x on most activity metrics, created the most popular publishing venue for AI Alignment Research (the <b><a href="http://alignmentforum.org">AI Alignment Forum</a></b>), and built <b><a href="http://lighthaven.space">Lighthaven</a></b>, a successful ~$2.5M revenue/yr conference and research center, which is likely to break even next year, and on track to subsidize other program activities in following years:
    </p>

    <br />

    <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1735602785/5be2760a-4ae0-4687-9995-fd4e29e5b1aa.png" alt="Lightcone Infrastructure Stats" />
    <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1735602893/e468a8ec-9545-448a-ac56-13983f18aae9.png" alt="Lightcone Infrastructure Wordcount" />
    <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1735602952/dfc61a20-6f29-4731-af77-85d344d942c9.png" alt="Lightcone Infrastructure Revenue" />

    <br />

    <p>
      LessWrong is in my opinion the best discussion platform on the public internet. As well as having some of the best culture on the internet for arguments and evidence, it is also a platform designed for a functional group epistemology and a culture of rationality with things like separate up/down-voting from agree/disagree-voting, and one-click reacts for ideas like "that's a crux" and "this changed my mind".
    </p>

    <p>
      My best guess is that LessWrong is also one of the biggest memetic influences in Silicon Valley and various AI governance efforts. In more recent years, it has also seemed enormously influential on things like national AGI policy and AGI labs' risk attitudes.
    </p>

    <p>
      Lighthaven is responsible for substantially improving and creating many high value programs and conferences, like <a href="https://www.manifest.is/">Manifest</a>, <a href="https://thecurve.is/">The Curve</a>, <a href="https://rootsofprogress.org/conference/">the Progress Conference</a>, <a href="https://less.online/">and</a> <a href="https://www.iliadconference.com/">many</a> <a href="https://www.matsprogram.org/">others</a>. Ex Twitch CEO Emmett Shear <a href="https://x.com/eshear/status/1830715745992613984">has said publicly</a> "70% epistemic confidence: <b>People will talk about Lighthaven in Berkeley in the future the same way they talk about IAS at Princeton or Bell Labs</b>".
    </p>

    <p>
      Most funding for projects like Lightcone has come from focused existential risk grantors like Open Philanthropy, SFF, EA Funds and Longview. In our case however, <a href="https://www.lesswrong.com/posts/5n2ZQcbc7r4R8mvqc#Lightcone_and_the_funding_ecosystem">those funders largely cannot fund us</a>, despite thinking we are cost-effective and worth funding, due to a mixture of structural and reputational constraints.
    </p>

    <p>
      Many people with (IMO) strong track records of thinking about existential risk have also made unusually large personal donations, including Nate Soares, Daniel Kokotajlo, Scott Alexander, Emmett Shear, Nick Bostrom, Zac Hatfield-Dodds, Leo Gao, Drake Thomas, Ryan Greenblatt and Howie Lempel. Eliezer Yudkowsky has recommended several grants to us. I have also personally donated over $300,000 to Lightcone, have taken a very low or no salary at all for almost all of my tenure here, and have in the past loaned (at no interest) practically my whole net worth to Lightcone to keep us afloat.
    </p>

    <p>Here is a rough breakdown of our budget for 2025: </p>

    <br />

    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'left' }}><b>Type</b></td>
            <td style={{ padding: '2px', textAlign: 'right' }}><b>Cost</b></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'left' }}>Core Staff Salaries, Payroll, etc. (6 people)</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$1.4M</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'left' }}><b>Lighthaven (Upkeep)</b></td>
            <td style={{ padding: '2px', textAlign: 'right' }}></td>
          </tr>
          <tr>
            <td style={{ padding: '2px', textAlign: 'left', paddingLeft: '16px' }}>Operations & Sales</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$240k</td>
            <td style={{ padding: '2px' }}></td>
          </tr>
          <tr>
            <td style={{ padding: '2px', textAlign: 'left', paddingLeft: '16px' }}>Repairs & Maintenance Staff</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$200k</td>
            <td style={{ padding: '2px' }}></td>
          </tr>
          <tr>
            <td style={{ padding: '2px', textAlign: 'left', paddingLeft: '16px' }}>Porterage & Cleaning Staff</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$320k</td>
            <td style={{ padding: '2px' }}></td>
          </tr>
          <tr>
            <td style={{ padding: '2px', textAlign: 'left', paddingLeft: '16px' }}>Property Tax</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$300k</td>
            <td style={{ padding: '2px' }}></td>
          </tr>
          <tr>
            <td style={{ padding: '2px', textAlign: 'left', paddingLeft: '16px' }}>Utilities & Internet</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$180k</td>
            <td style={{ padding: '2px' }}></td>
          </tr>
          <tr>
            <td style={{ padding: '2px', textAlign: 'left', paddingLeft: '16px' }}>Additional Rental Property</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$180k</td>
            <td style={{ padding: '2px' }}></td>
          </tr>
          <tr>
            <td style={{ padding: '2px', textAlign: 'left', paddingLeft: '16px' }}>Supplies (Food + Maintenance)</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$180k</td>
            <td style={{ padding: '2px' }}></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'right' }}><b>Lighthaven Upkeep Total</b></td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$1.6M</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'left' }}>Lighthaven Mortgage</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$1M</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'left' }}>LW Hosting + Software Subscriptions</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$120k</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'left' }}>Dedicated Software + Accounting Staff</td>
            <td style={{ padding: '2px', textAlign: 'right' }}>$330k</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'right' }}><b>Total Costs</b></td>
            <td style={{ padding: '2px', textAlign: 'right' }}><b>$4.45M</b></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'left' }}><b>Deferred 2024 Mortgage Interest Payment</b></td>
            <td style={{ padding: '2px', textAlign: 'right' }}><b>$1M</b></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'left', color: '#008000' }}><b>Expected Lighthaven Income</b></td>
            <td style={{ padding: '2px', textAlign: 'right', color: '#008000' }}><b>($2.55M)</b></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '2px', textAlign: 'right' }}><b>Shortfall 2025</b></td>
            <td style={{ padding: '2px', textAlign: 'right' }}><b>$2.9M</b></td>
          </tr>
        </tbody>
      </table>
    </div>

    <br />

    <p>
      The 2024 deferred interest payment is a one-off, and <b>after this year we expect a minimum annual cost of ~$2M/yr</b> (though we have plenty of room for more funding and many programs we would like to start if we had more).
    </p>

    <p>
      This year, if we end up raising more than $2M but less than $3M, we can probably pull through by taking out a mortgage on one of our properties (which will increase our annual cost a bunch, which in some sense just defers the problem). If we make less than $2M, I do think we will be in a very bad position, and I'm not sure how exactly we would survive.
    </p>

    <p>
      If we do make it, here are some potential things I am excited to work on in the coming year:
    </p>

    <ul>
      <li>Building LLM-based research tools to speed up AI Control and AI Alignment research</li>
      <li>Building AI-based tooling to solve coordination problems both within our ecosystem and beyond it</li>
      <li>Creating an institutional home for research in the "Future of Humanity Institute" tradition</li>
      <li>Improving the accessibility and impact of LessWrong ideas on conservative policy makers</li>
    </ul>

    <p>
      Since we are a central node for a lot of AI Alignment thinking, we are in a unique position to build tooling to improve research progress. Given LessWrong's historical relative political neutrality, we might also be in a unique position to reach out to conservative policy makers, compared to the rest of our extended ecosystem, which has made large bets on connections within the democratic party.
    </p>

    <p>
      Funding uncertainty, and spending large amounts of time fundraising, is a major drag on Lightcone's productivity and impact, and IMO a big waste of resources given our historical track record and opportunity cost. <b>If you've gained something from LessWrong or Lighthaven—knowledge, connections, or new opportunities—please consider donating.</b> I think we will continue to do great work, and make the world better if we can get the funding for it.
    </p>

    <p>
      If you want to learn more, you can also read my <a href="https://x.com/ohabryka/status/1863746432085397987">tweet thread</a>, or my <a href="https://www.lesswrong.com/posts/5n2ZQcbc7r4R8mvqc/the-lightcone-is-nothing-without-its-people">12,000 word fundraising post</a> that gives a lot of detail about my thinking on our impact and operations. Our fundraiser lasts until EOD January 13th. <b>If you are already sold, you can <a href="https://lightconeinfrastructure.com/donate">donate here</a>,</b> or reach out by messaging me on Signal at +1 510 944 3235 or replying to this email.
    </p>

    <p>
      Farewell again,<br />
      Oliver Habryka, CEO of Lightcone Infrastructure
    </p>

    <br />

    <p><i>
      P.S.: If you donate more than $2,000 <b>you can have a bench on our campus dedicated to you</b> (or to anyone/anything else of your choosing)! For larger donations, you could even have a whole section of campus named <a href="https://lesswrong.com/users/drethelin">after you</a>:
    </i></p>

    <br />

    <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1735602970/DrethelinGardens_0.5x_xtroit.jpg" alt="Fundraiser Email Image" />
  </div>
}

const fundraiserMessaging = async () => {
  const adminContext = createAdminContext();
  console.log("Started loading users")
  const adminUsers = await Users.find({
    // isAdmin: true,
    banned: { $exists: false },
    deleted: false,
    karma: { $gte: 0 },
    email: { $exists: true }
  }, { sort: { karma: -1 } }).fetch();
  console.log("Loaded users")
  console.log("Loading events")
  const lwevents = await LWEvents.find({ ['properties.subject']: "The LessWrong team's first big fundraiser (ends on Jan 13)", name: "emailSent", createdAt: { $gte: new Date("2024-12-29") } }, { sort: { createdAt: -1 } }).fetch()
  console.log("Loaded events")
  const lwEventUserIds = Array.from(new Set(lwevents.map(event => event.userId)))

  const filteredAdminUsers = adminUsers.filter(user => !lwEventUserIds.includes(user._id))

  console.log(`Preparing to send fundraiser email to ${filteredAdminUsers.length} admins`);

  // Split users into batches of 1000
  const userBatches = chunk(filteredAdminUsers, 500);

  for (const [batchIndex, batch] of userBatches.entries()) {
    console.log(`Processing batch ${batchIndex + 1}/${userBatches.length} (${batch.length} users)`);

    const emailPromises = batch.map(user => {
      if (!user) return Promise.resolve();

      return wrapAndSendEmail({
        user: user,
        subject: "The LessWrong team's first big fundraiser (ends on Jan 13)",
        body: fundraiserEmail()
      }).catch(err => {
        console.error(`Failed to send email to user ${user.displayName} (${user._id}):`, err);
        return null;
      });
    });

    await Promise.all(emailPromises);
    console.log(`Completed batch ${batchIndex + 1}`);
  }
}

Globals.fundraiserMessaging = fundraiserMessaging


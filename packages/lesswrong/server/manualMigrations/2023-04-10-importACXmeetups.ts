import { registerMigration } from './migrationUtils';
import Users from '../../server/collections/users/collection';
import { createMutator } from '../vulcan-lib/mutators';
import { Posts } from '../../server/collections/posts/collection';
import { mapsAPIKeySetting } from '../../components/form-components/LocationFormComponent';
import { getLocalTime } from '../mapsUtils';
import {userFindOneByEmail} from "../commonQueries";
import { writeFile } from 'fs/promises';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';

async function coordinatesToGoogleLocation({ lat, lng }: { lat: string, lng: string }) {
  const requestOptions: any = {
    method: 'GET',
    redirect: 'follow'
  };
  
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsAPIKeySetting.get()}`, requestOptions)
  const responseText = await response.text()
  const responseData = JSON.parse(responseText)
  return responseData.results[0]
}

export default registerMigration({
  name: "importACXMeetupsSpring23",
  dateWritten: "2023-04-10",
  idempotent: true,
  action: async () => {
    const eventCacheContents: { _id: string, lat: number, lng: number }[] = [];

    // eslint-disable-next-line no-console
    console.log("Begin importing ACX Meetups");
    for (const row of acxData) {
      let eventOrganizer
      // Figure out whether user with email address already exists
      // This used to be userFindByEmail from /lib/vulcan-users/helpers. That seems to have become userFindOneByEmail from /lib/collections/users/commonQueries, but you should check that those actually behaved the same.
      const email = row["Email address"] as string|undefined;
      const lookupEmail = email === 'ed@newspeak.house' ? 'edsaperia@gmail.com' : email;
      const existingUser = lookupEmail ? await userFindOneByEmail(lookupEmail) : undefined;
      // If not, create them (and send them an email, maybe?)
      if (existingUser) {
        eventOrganizer = existingUser
      } else {
        const username = await getUnusedSlugByCollectionName("Users", row["Name/initials/handle"].toLowerCase());
        try {
          const { data: newUser } = await createMutator({
            collection: Users,
            document: {
              username,
              displayName: row["Name/initials/handle"],
              email: email,
              reviewedByUserId: "XtphY3uYHwruKqDyG", //This looks like a hardcoded user who supposedly reviewed something. Who is that user?
              reviewedAt: new Date()
            },
            validate: false,
            currentUser: null
          })
          eventOrganizer = newUser
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log({ err, email, row }, 'Error when creating a new user, using a different username');

          const { data: newUser } = await createMutator({
            collection: Users,
            document: {
              username: `${username}-acx-23`,
              displayName: row["Name/initials/handle"],
              email: email,
              reviewedByUserId: "XtphY3uYHwruKqDyG", //This looks like a hardcoded user who supposedly reviewed something. Who is that user?
              reviewedAt: new Date()
            },
            validate: false,
            currentUser: null
          })

          eventOrganizer = newUser
        }
      }
      
      //Use the coordinates to get the location
      const [latitude, longitude] = row["GPS Coordinates"].split(",");
      const title = `${row["City"]} – ACX Meetups Everywhere Spring 2023`

      // Check for existing event links
      const eventUrl = row["Event Link"];
      const premadePost = eventUrl?.includes("lesswrong.com");
      const eventId = eventUrl && premadePost ? new URL(eventUrl).pathname.split('/')[2] : undefined;

      const [googleLocation, existingPost, premadePostObject] = await Promise.all([
        coordinatesToGoogleLocation({lat: latitude, lng: longitude}),
        // TODO: THIS ISN'T INDEXED, SO THIS RUNS PRETTY SLOWLY IN PROD SINCE IT'S DOING ~FULL TABLE SCANS
        Posts.findOne({ title }),
        eventId ? Posts.findOne(eventId) : Promise.resolve(undefined)
      ]);

      const eventTimePretendingItsUTC = new Date(`${row["Date"]} ${row["Time"]} UTC`)
      const localtime = eventTimePretendingItsUTC.getTime() ? await getLocalTime(eventTimePretendingItsUTC, googleLocation) : new Date();
      const actualTime = new Date(eventTimePretendingItsUTC.getTime() + (eventTimePretendingItsUTC.getTime() - (localtime?.getTime() || eventTimePretendingItsUTC.getTime())))
      
      const fbUrlExists = eventUrl?.includes("facebook.com");
      const meetupUrlExists = eventUrl?.includes("meetup.com");

      let usedPost: DbPost | undefined;
      
      //Then create event post with that user as owner, if there's none by that title and the local organizer didn't already make one.
      if (!existingPost && !premadePostObject) {
        const newPostData = {
          title,
          postedAt: new Date(),
          userId: eventOrganizer._id,
          submitToFrontpage: true,
          activateRSVPs: true,
          draft: false,
          meta: false,
          isEvent: true,
          contactInfo: row["Email address"],
          location: `${row["City"]}`,
          startTime: eventTimePretendingItsUTC.getTime() ? actualTime : undefined,
          meetupLink: meetupUrlExists ? eventUrl : undefined,
          facebookLink: fbUrlExists ? eventUrl : undefined,
          googleLocation,
          contents: {
            originalContents: {
              type: 'ckEditorMarkup',
              data: `<p>This year's ACX Meetup everywhere in ${row["City"]}.</p>
                <p>Location: ${row["Location description"]} – <a href="https://plus.codes/${row["Plus.Code Coordinates"]}">${row["Plus.Code Coordinates"]}</a></p>
                ${row["Notes"] ? `<p>${row["Notes"]}</p>` : ""}
                <p>Contact: ${row["Email address"]} ${row["Additional contact info"] ? `– ${row["Additional contact info"]}` : ""}</p>`
            },
            updateType: 'minor',
            commitMessage: ''
          },
          moderationStyle: 'easy-going',
          af: false,
          authorIsUnreviewed: false,
          types: [
            'SSC'
          ],
        };
        const { data: newPost } = await createMutator({
          collection: Posts,
          document: newPostData,
          currentUser: eventOrganizer,
          validate: false
        })
        // eslint-disable-next-line no-console
        console.log("Created new ACX Meetup: ", newPost.title);
        const googleLocationInfo = newPost.googleLocation?.geometry?.location;
        eventCacheContents.push({ _id: newPost._id, lat: googleLocationInfo?.lat, lng: googleLocationInfo?.lng });

        usedPost = newPost;
      } else {
        // eslint-disable-next-line no-console
        console.log("Meetup already had a LW event. Check ", eventUrl, "or", title);
        if (existingPost) {
          const googleLocationInfo = existingPost.googleLocation?.geometry?.location;
          eventCacheContents.push({ _id: existingPost._id, lat: googleLocationInfo?.lat, lng: googleLocationInfo?.lng });
          usedPost = existingPost;
        } else if (premadePostObject) {
          const googleLocationInfo = premadePostObject.googleLocation?.geometry?.location;
          eventCacheContents.push({ _id: premadePostObject._id, lat: googleLocationInfo?.lat, lng: googleLocationInfo?.lng });
          usedPost = premadePostObject;
        }
      }
      const usedPostStartTime = usedPost?.startTime?.getTime();
      const appliedTime = actualTime.getTime();

      if (usedPostStartTime !== appliedTime) {
        // eslint-disable-next-line no-console
        console.log({ usedPostStartTime, appliedTime, row }, 'Created event might have the wrong time');
      }
    }
    // eslint-disable-next-line no-console
    console.log("End importing ACX meetups.");

    await writeFile('eventCache.json', JSON.stringify(eventCacheContents, null, 2))
  }
})

interface ACXMeetup {
  Region: string
  "Name/initials/handle": string
  "Email address": string
  "City": string
  "Location description": string
  "Plus.Code Coordinates": string
  "Date": string
  "Time": string
  "GPS Coordinates": string
  "Event Link"?: string
  Notes?: string
  "Additional contact info"?: string
}

//Updated 2023-04-09 19:15 Eastern Time
const acxData: ACXMeetup[] = [
  {
    "Region": "Africa",
    "Name/initials/handle": "Damola",
    "Email address": "social@damolamorenikeji.com",
    "City": "Lagos, Nigeria",
    "Location description": "Lekki Leisure, Lagos. We will be overlooking the beach, sitting on the table to your left.",
    "Plus.Code Coordinates": "https://plus.codes/6FR5CFF6+GR",
    "Date": "05/17/2023",
    "Time": "1:13:00 PM",
    "Event Link": "https://www.lesswrong.com/events/ZYDgJkMFZ4dEGuJJa/lagos-nigeria-acx-meetups-everywhere-2023",
    "GPS Coordinates": "6.423813,3.462063"
  },
  {
    "Region": "Asia-Pacific",
    "Name/initials/handle": "Kabir",
    "Email address": "rudrakabir@gmail.com",
    "City": "Ahmedabad, Gujarat, India",
    "Location description": "Ares Cafe, SBR. I will be wearing a shirt with birds on it. ",
    "Plus.Code Coordinates": "https://plus.codes/7JMJ2FVM+48",
    "Date": "04/15/2023",
    "Time": "6:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/n9yE7TRGWdiCEa3Wf/ahmedabad-ssc-spring-meet",
    "GPS Coordinates": "23.042813,72.483312"
  },
  {
    "Region": "Asia-Pacific",
    "Name/initials/handle": "Nihal M",
    "Email address": "propwash@duck.com",
    "City": "Bangalore, India",
    "Location description": "Matteo coffea, church Street",
    "Plus.Code Coordinates": "https://plus.codes/7J4VXJF4+PR",
    "Date": "05/07/2023",
    "Time": "4:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/mkgmobxKDwntMNneL/bengaluru-lw-acx-social-meetups-meetups-everywhere-spring",
    "GPS Coordinates": "12.974312,77.607062"
  },
  {
    "Region": "Asia-Pacific",
    "Name/initials/handle": "Suryansh Tyagi ",
    "Email address": "suryansh@firstbelief.com",
    "City": "Delhi, India ",
    "Location description": "Altogether Experimental, Saket. https://maps.app.goo.gl/bauZmakWdTQ6QLwB7",
    "Plus.Code Coordinates": "https://plus.codes/7JWVG59X+75",
    "Date": "05/21/2023",
    "Time": "4:30:00 PM",
    "Event Link": "https://www.lesswrong.com/events/38trvhGajHKCJLGsM/acx-meetup-in-delhi-1",
    "Notes": "Please join the WhatsApp group using this link: https://chat.whatsapp.com/Jph8xQOprnK1mA7DBKkWOS",
    "GPS Coordinates": "28.518187,77.197937"
  },
  {
    "Region": "Asia-Pacific",
    "Name/initials/handle": "Yi-Yang",
    "Email address": "yi.yang.chua@gmail.com",
    "City": "Kuala Lumpur, Malaysia",
    "Location description": "Tedboy @ Jaya One",
    "Plus.Code Coordinates": "https://plus.codes/6PM34J9M+3X",
    "Date": "05/06/2023",
    "Time": "2:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/oBGirTDWQp57ARbJH/acx-ssc-kuala-lumpur-meetup-1",
    "GPS Coordinates": "3.117687,101.634938"
  },
  {
    "Region": "Asia-Pacific",
    "Name/initials/handle": "PB",
    "Email address": "e2y94n1nv@relay.firefox.com",
    "City": "Mumbai, India",
    "Location description": "We will be meeting at the gazebo in Heritage Gardens park in Powai. ",
    "Plus.Code Coordinates": "https://plus.codes/7JFJ4W76+XM",
    "Date": "04/16/2023",
    "Time": "3:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/HevjhH2whhdp2fFcG/acx-meetups-everywhere-spring-2023",
    "Notes": "The park doesn't have a clear sign saying 'heritage gardens' but is opposite Glen Heights and can be found easily using maps (https://goo.gl/maps/ZondD21UeDJshSnV9).",
    "GPS Coordinates": "19.114937,72.911687"
  },
  {
    "Region": "Asia-Pacific",
    "Name/initials/handle": "Eliot ",
    "Email address": "Redeliot@gmail.com ",
    "City": "Sydney, Australia ",
    "Location description": "Lvl 2, 565 George St, Sydney, NSW ",
    "Plus.Code Coordinates": "https://plus.codes/4RRH46F4+894",
    "Date": "04/20/2023",
    "Time": "6:00:00 PM",
    "Event Link": "https://meetu.ps/e/LWZ63/sqK6x/i",
    "Notes": "I am a regular host of Sydney Rationality events. ",
    "GPS Coordinates": "-33.876688,151.205938"
  },
  {
    "Region": "Asia-Pacific",
    "Name/initials/handle": "Harold",
    "Email address": "rationalitysalon@gmail.com",
    "City": "Tokyo, Japan",
    "Location description": "Nakameguro (Contact for details)",
    "Plus.Code Coordinates": "https://plus.codes/8Q7XJPV2+QFW",
    "Date": "05/13/2023",
    "Time": "10:00:00 AM",
    "Event Link": "https://www.meetup.com/acx-tokyo/events/lvvvzsyfchbrb/",
    "Notes": "https://rationalitysalon.straw.page/",
    "GPS Coordinates": "35.644437,139.701188"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Robert",
    "Email address": "Inn_Ganges_Seine@proton.me",
    "City": "Basel, Switzerland",
    "Location description": "Valhalla Bar, I will put a sign on the tables",
    "Plus.Code Coordinates": "https://plus.codes/8FV9HH3P+78",
    "Date": "05/04/2023",
    "Time": "7:30:00 PM",
    "Notes": "Happy to meet you all :) ",
    "GPS Coordinates": "47.553187,7.585812"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Dušan and Tatiana",
    "Email address": "tatiana.n.skuratova@efektivnialtruizam.rs",
    "City": "Belgrade, Serbia",
    "Location description": "Bar Green House, Dr. Dragoslava Popovica",
    "Plus.Code Coordinates": "https://plus.codes/8GP2RF7G+36",
    "Date": "04/16/2023",
    "Time": "3:00:00 PM",
    "Notes": "Organized by EA Serbia, welcoming everyone including non ACX people if you'd like. Bring coloured eggs for Serbian Egg battles as it'll be easter, or we can provide some :) RSVP mandatory!",
    "GPS Coordinates": "44.812687,20.475563"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Christian Kleineidam",
    "Email address": "christian.rationality@gmail.com",
    "City": "Berlin, Germany",
    "Location description": "Turmstr. 10, 10559 Berlin Moabit",
    "Plus.Code Coordinates": "https://plus.codes/9F4MG9G2+JG",
    "Date": "04/15/2023",
    "Time": "4:00:00 PM",
    "Event Link": "https://www.meetup.com/lesswrong-rationality-waitbutwhy-slatestarcodex-berlin/events/292739359/",
    "GPS Coordinates": "52.526562,13.351313"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Michael",
    "Email address": "acx-meetup-2023-04-22@weboroso.anonaddy.com",
    "City": "Bordeaux, France",
    "Location description": "Place Victoire, south of the column/the Turtles. I wear a mask in places with a lot of strangers, and I will be holding a foldable-keyboard handheld. I will also write an A4 ACX Meetup sign. https://www.openstreetmap.org/?query=44.83054%2C-0.57268#map=19/44.83057/-0.57262",
    "Plus.Code Coordinates": "https://plus.codes/8CPXRCJG+7XG",
    "Date": "04/22/2023",
    "Time": "5:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/muYXAfbsJj4RCkEYY/ssc-acx-meetups-everywhere-spring-bordeaux-22-april-17-00",
    "GPS Coordinates": "44.830687,-0.572563"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Rasmus",
    "Email address": "ad.fontes@aol.com",
    "City": "Bremen, Germany",
    "Location description": "Theaterberg (Wallanlagen). I'll carry a sign.",
    "Plus.Code Coordinates": "https://plus.codes/9F5C3RG7+G47",
    "Date": "04/23/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "53.076313,8.812812"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Marcel Müller",
    "Email address": "marcel_mueller@mail.de",
    "City": "Cologne, Germany",
    "Location description": "A house at Marienweg 43, 50858 Köln. Ring the doorbell to be let in.",
    "Plus.Code Coordinates": "https://plus.codes/9F28WRMX+96H",
    "Date": "04/15/2023",
    "Time": "5:00:00 PM",
    "GPS Coordinates": "50.933437,6.848062"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Søren Elverlin",
    "Email address": "soeren.elverlin@gmail.com",
    "City": "Copenhagen, Denmark",
    "Location description": "Rundholtsvej 10, 2300 Copenhagen S",
    "Plus.Code Coordinates": "https://plus.codes/9F7JMH38+GC",
    "Date": "05/13/2023",
    "Time": "3:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/iiNaqC3xiRAxWwj6M/astralcodexten-lesswrong-meetup-4",
    "GPS Coordinates": "55.653813,12.566063"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Rian O Mahoney",
    "Email address": "maturely.ravioli78@mailer.me",
    "City": "Dublin, Ireland",
    "Location description": "Clement &amp; Pekoe, 50 William St S, Dublin 2, D02 DE93",
    "Plus.Code Coordinates": "https://plus.codes/9C5M8PRP+JV",
    "Date": "04/22/2023",
    "Time": "12:00:00 AM",
    "Notes": "Here is a link to our WhatsApp groupchat -&gt;https://chat.whatsapp.com/Fg9KWUEqyUU3RauvsXtMxo",
    "GPS Coordinates": "53.341563,-6.262812"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Omar",
    "Email address": "info@rationality-freiburg.de",
    "City": "Freiburg, Germany",
    "Location description": "Haus des Engagements, Rehlingstraße 9 (inner courtyard), 79100 Freiburg",
    "Plus.Code Coordinates": "https://plus.codes/8FV9XRQQ+QQ9",
    "Date": "04/28/2023",
    "Time": "6:00:00 PM",
    "Event Link": "https://www.rationality-freiburg.de/events/2023-04-28-acx-meetups-everywhere/",
    "GPS Coordinates": "47.989438,7.839438"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Joe Nash",
    "Email address": "joenash499@gmail.com",
    "City": "Helsinki, Finland",
    "Location description": "Dubliner, Mannerheimintie 5, Helsinki. We'll be in the private room named Guinness Lounge, find it and come in.",
    "Plus.Code Coordinates": "https://plus.codes/9GG65W9R+Q5C",
    "Date": "04/27/2023",
    "Time": "6:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/Z6YdnP4xaqFCdbht5/helsinki-rationalish-april-2023-meetup",
    "GPS Coordinates": "60.169438,24.940438"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Marcus",
    "Email address": "mail@marcuswilhelm.de",
    "City": "Karlsruhe, Germany",
    "Location description": "We meet on the KIT campus on the grass in front of Audimax, next to the large sculpture with the intertwined tubes",
    "Plus.Code Coordinates": "https://plus.codes/8FXC2C68+X5",
    "Date": "04/22/2023",
    "Time": "3:00:00 PM",
    "Notes": "An event post will be created on the Karlsruhe Rationality Group on LessWrong; see there for more recent updates (e.g. in case of rain).",
    "GPS Coordinates": "49.012438,8.415437"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Jan",
    "Email address": "acxmeetuplausanne@proton.me",
    "City": "Lausanne, Switzerland",
    "Location description": "Louis Bourget Park",
    "Plus.Code Coordinates": "https://plus.codes/8FR8GH9Q+PW",
    "Date": "05/08/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "46.519312,6.589813"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Luís Campos",
    "Email address": "luis.filipe.lcampos@gmail.com",
    "City": "Lisbon, Portugal",
    "Location description": "In Jardim Amália Rodrigues, close to Linha d'Água cafe, in the top of a hill, below a bunch of trees.",
    "Plus.Code Coordinates": "https://plus.codes/8CCGPRJW+V8",
    "Date": "04/15/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "38.732188,-9.154187"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Edward Saperia",
    "Email address": "ed@newspeak.house",
    "City": "London, UK",
    "Location description": "Newspeak House",
    "Plus.Code Coordinates": "https://plus.codes/9C3XGWGH+3F7",
    "Date": "04/15/2023",
    "Time": "10:00:00 AM",
    "Notes": "Please register via Eventbrite: https://www.eventbrite.co.uk/e/astral-codex-ten-meetup-tickets-591452770157",
    "GPS Coordinates": "51.525188,-0.071313"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Pablo",
    "Email address": "pvillalobos@proton.me",
    "City": "Madrid, Madrid, Spain",
    "Location description": "Mercado de San Ildefonso. Calle de Fuencarral, 57, 28004 Madrid. We'll be at the first or second floor, with an ACX sign",
    "Plus.Code Coordinates": "https://plus.codes/8CGRC7FX+MJ",
    "Date": "04/17/2023",
    "Time": "6:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/5xzuWjNo6vDzhDo7K/acx-meetup-1",
    "GPS Coordinates": "40.424188,-3.700938"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Erich",
    "Email address": "erich@meetanyway.com",
    "City": "Munich, Germany",
    "Location description": "We'll be in the inner courtyard of the Sandstr. 25. There will be signs leading the way.",
    "Plus.Code Coordinates": "https://plus.codes/8FWH4HX4+JF",
    "Date": "04/12/2023",
    "Time": "6:30:00 PM",
    "GPS Coordinates": "48.149062,11.556188"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Hans Andreas",
    "Email address": "acxoslomeetup@gmail.com",
    "City": "Oslo, Norway",
    "Location description": "Café Billabong, Bogstadveien 53 0366 Oslo",
    "Plus.Code Coordinates": "https://plus.codes/9FFGWPH7+RQ",
    "Date": "04/22/2023",
    "Time": "1:00:00 PM",
    "Event Link": "https://www.meetup.com/acx-oslo/events/292450262/",
    "Notes": "Don't feel pressured to order anything!",
    "GPS Coordinates": "59.929562,10.714437"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Sam",
    "Email address": "ssc@sambrown.eu",
    "City": "Oxford, UK",
    "Location description": "The back room of The Star pub on Rectory Road, with a sign",
    "Plus.Code Coordinates": "https://plus.codes/9C3WPQX6+QP6",
    "Date": "04/19/2023",
    "Time": "6:30:00 PM",
    "GPS Coordinates": "51.749437,-1.238187"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Épiphanie Gédéon",
    "Email address": "iwonder@whatisthis.world and co-organizer: sobrvseq@mailer.me",
    "City": "Paris, Île-de-France/Paris, France",
    "Location description": "We'll be at Caroussel Garden (near the Louvres and Tuileries, left of the Arch from the Louvres), on the grass near the statues. We'll have an ACX MEETUP sign.",
    "Plus.Code Coordinates": "https://plus.codes/8FW4V86J+GH",
    "Date": "04/22/2023",
    "Time": "5:30:00 PM",
    "Event Link": "https://www.lesswrong.com/events/vPBHTaKgEnA4N8PdC/acx-spring-meetup",
    "Notes": "We also have a discord ( https://discord.gg/2U9qhR2suc ) or matrix bridge ( https://matrix.to/#/#ssc-paris:matrix.org )",
    "GPS Coordinates": "48.861312,2.331437"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Grigorio",
    "Email address": "Greghero12@gmail.com",
    "City": "Rome, Italy",
    "Location description": "We'll be at Parco di centocelle train station, I'll be wearing a red shirt",
    "Plus.Code Coordinates": "https://plus.codes/8FHJVHF9+R6",
    "Date": "04/29/2023",
    "Time": "6:00:00 PM",
    "Notes": "If you're in Rome and we've never had the pleasure of meeting, that'd be a shame worth rectifying, no?",
    "GPS Coordinates": "41.874562,12.568062"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Javier",
    "Email address": "javier.prieto.set@gmail.com",
    "City": "Santiago de Compostela, Galicia, Spain",
    "Location description": "caféLaMorena. Rúa de San Clemente, 6, 15705 Santiago de Compostela, A Coruña. https://maps.app.goo.gl/FJ9vPnNTXcsvPx4LA. I'll be wearing an EAGx LatAm hoodie and maybe put up an ACX sign or something. Will sit outside, weather permitting, and inside otherwise.",
    "Plus.Code Coordinates": "https://plus.codes/8CJHVFH3+M76",
    "Date": "04/15/2023",
    "Time": "5:00:00 PM",
    "GPS Coordinates": "42.879188,-8.546812"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Anastasia",
    "Email address": "sofia.acx.meetup@gmail.com",
    "City": "Sofia, Bulgaria",
    "Location description": "Shades Garden (in Borisova Garden)",
    "Plus.Code Coordinates": "https://plus.codes/8GJ5M8GW+J9",
    "Date": "04/23/2023",
    "Time": "4:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/4R5BHXhBW7puyXTvg/sofia-acx-spring-2023-schelling-meetup-mini-meetups",
    "GPS Coordinates": "42.676563,23.345937"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Marina ",
    "Email address": "marina.sharoian@gmail.com",
    "City": "Stockholm, Sweden",
    "Location description": "Stockholm djurgården",
    "Plus.Code Coordinates": "https://plus.codes/9FFW84G7+F5",
    "Date": "05/14/2023",
    "Time": "1:30:00 PM",
    "Event Link": "https://fb.me/e/BIw4V0S8",
    "GPS Coordinates": "59.326187,18.112938"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Andrew West",
    "Email address": "andrew_n_west@yahoo.co.uk",
    "City": "Tallinn, Estonia",
    "Location description": "St Vitus, Tallinn.  I am the guy with a suit, a beard, and a book.  I shall attempt to make a sign if I get there early enough.",
    "Plus.Code Coordinates": "https://plus.codes/9GF6CPRH+MQ",
    "Date": "04/20/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "59.441688,24.729438"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "Alfonso",
    "Email address": "barsom.maelwys@gmail.com",
    "City": "Toulouse, France",
    "Location description": "Le Biergarten, 60 Gd Rue St Michel, 31400, Toulouse. If the weather permits, we'll be sitting outside with a sign saying ACX MEETUP on the table",
    "Plus.Code Coordinates": "https://plus.codes/8FM3HCQW+9H",
    "Date": "05/28/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "43.588437,1.446438"
  },
  {
    "Region": "Europe",
    "Name/initials/handle": "MB",
    "Email address": "acxzurich@proton.me",
    "City": "Zurich, Switzerland",
    "Location description": "Blatterwiese in front of the chinese garden",
    "Plus.Code Coordinates": "https://plus.codes/8FVC9H32+RG",
    "Date": "04/29/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "47.354563,8.551312"
  },
  {
    "Region": "Latin America",
    "Name/initials/handle": "Nikita Sokolsky",
    "Email address": "sokolx@gmail.com",
    "City": "Punta Cana, Dominican Republic",
    "Location description": "Soles restaurant. We will have an ACX Meetup sign on the table.",
    "Plus.Code Coordinates": "https://plus.codes/77CHMHMP+6W",
    "Date": "04/16/2023",
    "Time": "6:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/YsGiAZnZvcvG2CG5s/acx-everywhere-punta-cana-dr",
    "GPS Coordinates": "18.683062,-68.412688"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Steve French",
    "Email address": "steve@digitaltoolfactory.net",
    "City": "Atlanta, Georgia, USA",
    "Location description": "Bold Monk Brewing. 1737 Ellsworth Industrial Blvd NW. Suite D-1. Atlanta, GA 30318, USA. Look for the Yellow ACX Table Sign",
    "Plus.Code Coordinates": "https://plus.codes/865QRH2F+V8",
    "Date": "04/29/2023",
    "Time": "2:00:00 PM",
    "Event Link": "https://www.acxatlanta.com",
    "Notes": "Please RSVP",
    "GPS Coordinates": "33.802188,-84.426687"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Silas Barta",
    "Email address": "sbarta@gmail.com",
    "City": "Austin, Texas, USA",
    "Location description": "The Brewtorium, 6015 Dillard Cir A, Austin, TX 78752",
    "Plus.Code Coordinates": "https://plus.codes/862487GM+95",
    "Date": "06/03/2023",
    "Time": "12:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/HXxiXZ2xwDE9mK84L/austin-tx-acx-shelling-meetup-2023",
    "GPS Coordinates": "30.325938,-97.717062"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Rivka",
    "Email address": "rivka@adrusi.com",
    "City": "Baltimore, Maryland, USA",
    "Location description": "UMBC outside of the Performing Arts and Humanities Building, on the north side. I will have a sign that says ACX meetup. Parking is free on the weekends. If it’s raining, we will be inside of the Performing Arts building, on the ground floor just inside the entrance.",
    "Plus.Code Coordinates": "https://plus.codes/87F5774P+53",
    "Date": "04/23/2023",
    "Time": "7:00:00 PM",
    "Notes": "We are an active group that meets every Sunday at 7 PM. Half are virtual and half are in person. There will be snacks and drinks. ",
    "GPS Coordinates": "39.255437,-76.714813"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Alex",
    "Email address": "bellinghamrationalish@gmail.com",
    "City": "Bellingham, Washington, USA",
    "Location description": "Elizabeth Station, 1400 W Holly St #101, Bellingham, WA",
    "Plus.Code Coordinates": "https://plus.codes/84WVQG45+XP5",
    "Date": "04/12/2023",
    "Time": "6:30:00 PM",
    "Event Link": "https://www.meetup.com/bellingham-rationalish-community/events/292457847/",
    "Notes": "We're an established group that meets roughly monthly",
    "GPS Coordinates": "48.757438,-122.490688"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Skyler",
    "Email address": "skyler@rationalitymeetups.org",
    "City": "Berkeley, California, USA",
    "Location description": "Rose Garden Inn, a rationalist event space at 2740 Telegraph Ave. Come in through the front gate on Telegraph.",
    "Plus.Code Coordinates": "https://plus.codes/849VVP5R+X5",
    "Date": "05/06/2023",
    "Time": "1:00:00 PM",
    "Notes": "The Bay rationality community has a mailing list (https://groups.google.com/g/bayarealesswrong) a Discord server (https://discord.gg/Yqus2bFhww) and a Facebook group (https://www.facebook.com/groups/566160007909175) There are dinner meetups every Thursday at 7 PM in the East Bay, and occasional meetups in SF and South Bay.",
    "GPS Coordinates": "37.859938,-122.259563"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Skyler and Dan",
    "Email address": "skyler@rationalitymeetups.org",
    "City": "Boston, Massachusetts, USA",
    "Location description": "JFK Memorial Park, Cambridge, MA, USA",
    "Plus.Code Coordinates": "https://plus.codes/87JC9VCG+7W",
    "Date": "04/22/2023",
    "Time": "4:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/8A7tdTvvKBBiByinn/boston-acx-spring-schelling-point-meetup-1",
    "GPS Coordinates": "42.370688,-71.122687"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Forrest",
    "Email address": "forrest.csuy@gmail.com",
    "City": "Burlington, Vermont, USA",
    "Location description": "Battery Park, in the southern section of the park, near the William Wells statue. I will have an \"ACX Meetup\" sign.",
    "Plus.Code Coordinates": "https://plus.codes/87P8FQJJ+83P",
    "Date": "04/29/2023",
    "Time": "2:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/bdHzoDJ3eA9MGJgmT/burlington-vt-spring-acx-meetup",
    "GPS Coordinates": "44.480812,-73.219813"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "David P",
    "Email address": "qwertie256@gmail.com",
    "City": "Calgary, Alberta, Canada",
    "Location description": "inner City Brewing",
    "Plus.Code Coordinates": "https://plus.codes/95372WVC+62",
    "Date": "04/15/2023",
    "Time": "2:00:00 pm",
    "GPS Coordinates": "51.043063,-114.079937"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Ben",
    "Email address": "cu.acx.meetups@gmail.com",
    "City": "Champaign-Urbana, Illinois, USA",
    "Location description": "Siebel Center for Computer Science, room 3401",
    "Plus.Code Coordinates": "https://plus.codes/86GH4Q7G+H8F",
    "Date": "04/22/2023",
    "Time": "3:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/hvhXp3CFqYdotRjs7/meetups-everywhere-spring-2023",
    "GPS Coordinates": "40.113937,-88.224187"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Todd",
    "Email address": "info@chicagorationality.com",
    "City": "Chicago, Illinois, USA",
    "Location description": "South Loop Strength &amp; Conditioning – upstairs in the mezzanine. ",
    "Plus.Code Coordinates": "https://plus.codes/86HJV9F9+CV",
    "Date": "05/06/2023",
    "Time": "2:00:00 PM",
    "Event Link": "https://chicagorationality.com",
    "Notes": "We will be hosting lightning talks from Chicago Rationality meetup attendees for the May meetup. Join our Discord for more info: https://discord.gg/eDHq3TXrH3",
    "GPS Coordinates": "41.873562,-87.630313"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Russell",
    "Email address": "russell.emmer@gmail.com",
    "City": "Columbus, Ohio, USA",
    "Location description": "Clifton Park Shelterhouse, Jeffrey Park, Bexley. We will be at one of the tables with an ACX sign.",
    "Plus.Code Coordinates": "https://plus.codes/86FVX3C3+QF",
    "Date": "04/23/2023",
    "Time": "3:00:00 PM",
    "Notes": "Please send an email if you'd like to join our mailing list for future invitations.",
    "GPS Coordinates": "39.971937,-82.946313"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Ethan",
    "Email address": "ethan.morse97@gmail.com",
    "City": "Dallas, Texas, USA",
    "Location description": "Whole Foods, 11700 Preston Rd Ste 714, Dallas, TX 75230. We’ll be upstairs in the back room near the windows.",
    "Plus.Code Coordinates": "https://plus.codes/8645W55W+2J",
    "Date": "04/30/2023",
    "Time": "12:00:00 PM",
    "GPS Coordinates": "32.907562,-96.803438"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Eneasz",
    "Email address": "embrodski@gmail.com",
    "City": "Denver, Colorado, USA",
    "Location description": "The location for our monthly meetups is the clubhouse in Eneasz's neighborhood. It's called Silver Valley. The Club House is just west of the address here: 8769 W Cornell Ave, Lakewood, CO 80227-4813. There's a pool and tennis court right by it, and lots of visitor parking all around.",
    "Plus.Code Coordinates": "https://plus.codes/85FPMW64+MW",
    "Date": "04/23/2023",
    "Time": "3:00:00 PM",
    "Notes": "The meetup is open format, and will last until 9pm. Come at your convenience and stay as long or short as you like. They'll be a few silly games, and some snacks and drinks, including alcohol.",
    "GPS Coordinates": "39.661687,-105.092687"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Joseph",
    "Email address": "ta1hynp09@relay.firefox.com",
    "City": "Edmonton, Alberta, Canada",
    "Location description": "Underground Tap &amp; Grill. 10004 Jasper Ave, Edmonton, AB T5J 1R3. We will have an ACX sign",
    "Plus.Code Coordinates": "https://plus.codes/9558GGR5+JP",
    "Date": "04/27/2023",
    "Time": "7:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/MiZ6vuG8nwwDqPSLo/acx-meetups-everywhere-2",
    "GPS Coordinates": "53.541562,-113.490688"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Charlie",
    "Email address": "chuckwilson477@yahoo.com",
    "City": "Fort Lauderdale, Florida, USA",
    "Location description": "501 SE 17th Street, Fort Lauderdale, FL, USA. Whole Foods Market inside seating area. There should be no cost to park in the Whole Foods Parking Garage. Once inside, go down the escalator and walk through the grocery store towards the checkout lanes. We will be in the seating area right past the self-checkout stations on the south end of the building. Look for a table with an ACX MEETUP sign.",
    "Plus.Code Coordinates": "https://plus.codes/76RX4V26+5W",
    "Date": "05/07/2023",
    "Time": "5:00:00 PM",
    "Event Link": "https://www.meetup.com/miami-astral-codex-ten-lesswrong-meetup-group/events/292636146/",
    "Notes": "Hosted by the local ACX group that does meetups throughout south Florida, including Palm Beach, Broward, and Miami-Dade counties. Come join our Discord! https://discord.gg/tDf8fYPRRP",
    "GPS Coordinates": "26.100437,-80.137687"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Max Harms",
    "Email address": "Raelifin@gmail.com",
    "City": "Grass Valley, California, USA",
    "Location description": "Weather permitting: Condon Park near the prospector statue. Email me so that in case of rain I can let you know where my apartment is.",
    "Plus.Code Coordinates": "https://plus.codes/84FW6W8H+F5",
    "Date": "04/30/2023",
    "Time": "2:00:00 pm",
    "GPS Coordinates": "39.216188,-121.072063"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Joe Brenton",
    "Email address": "joe.brenton at yahoo",
    "City": "Houston, Texas, USA",
    "Location description": "711 Milby St, Houston, TX 77023. Segundo Coffee Lab, inside the IRONWORKS through the big orange door, look for the ACX MEETUP sign at the entrance",
    "Plus.Code Coordinates": "https://plus.codes/76X6PMV6+V6",
    "Date": "05/21/2023",
    "Time": "1:00:00 PM",
    "Event Link": "https://discord.gg/DzmEPAscpS",
    "Notes": "We have a growing ACX, LW, EA scene in Houston with weekly Social meetups, monthly EA-specific meetups, monthly gaming meetup and monthly Thought-Gym (short form presentations &amp; discussion).. Join our Discord server (https://discord.gg/DzmEPAscpS) where we will post additional coordination details.  You can also tag me in a message or DM me on the server (Joe Brenton#4719).",
    "GPS Coordinates": "29.744687,-95.339438"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Alex Hedtke",
    "Email address": "alex.hedtke@gmail.com",
    "City": "Kansas City, Missouri, USA",
    "Location description": "Minsky's Pizza",
    "Plus.Code Coordinates": "https://plus.codes/86F74C58+CWV",
    "Date": "04/28/2023",
    "Time": "6:30:00 PM",
    "GPS Coordinates": "39.108563,-94.582687"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Jenn",
    "Email address": "hi@jenn.site",
    "City": "Kitchener, Ontario, Canada",
    "Location description": "Room C, Kitchener Public Library, Central Branch",
    "Plus.Code Coordinates": "https://plus.codes/86MXFG37+3C",
    "Date": "04/13/2023",
    "Time": "7:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/356ktNDSxLzbcG2Lc/acx-spring-meetups-everywhere",
    "Notes": "Also counts as Waterloo, Ontario",
    "GPS Coordinates": "43.452687,-80.486438"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Jonathan Ray",
    "Email address": "ray.jonathan.w@gmail.com",
    "City": "Las Vegas, Nevada, USA",
    "Location description": "At Little Avalon with a giant ACX sign",
    "Plus.Code Coordinates": "https://plus.codes/85864MWX+PJ",
    "Date": "04/23/2023",
    "Time": "12:00:00 am",
    "GPS Coordinates": "36.146812,-115.300938"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Vishal",
    "Email address": "Use the LAR Discord",
    "City": "Los Angeles, California, USA",
    "Location description": "11841 Wagner St, Culver City, CA",
    "Plus.Code Coordinates": "https://plus.codes/8553XHWM+GP",
    "Date": "04/12/2023",
    "Time": "6:30:00 PM",
    "Event Link": "https://www.lesswrong.com/events/WvXnkMCpd34NgYDkJ/los-angeles-ca-acx-spring-meetups-everywhere-2023-lw-acx",
    "Notes": "Questions should be posted in the LAR discord (https://discord.gg/TaYjsvN), or by contacting \"Vishal\" in DMs via discord.",
    "GPS Coordinates": "33.996313,-118.415688"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Mike",
    "Email address": "park-mike@outlook.com",
    "City": "Manchester, Connecticut, USA ",
    "Location description": "Find the flagpole at top of hill next to library",
    "Plus.Code Coordinates": "https://plus.codes/87H9QFFH+J7",
    "Date": "05/13/2023",
    "Time": "6:00:00 PM",
    "Notes": "I will be wearing a green hat. ",
    "GPS Coordinates": "41.774062,-72.521812"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Robi Rahman",
    "Email address": "robirahman94@gmail.com",
    "City": "Manhattan, New York, USA",
    "Location description": "Rockefeller Park, at the pavilion located at River Terrace and Warren Street.",
    "Plus.Code Coordinates": "https://plus.codes/87G7PX9M+3M",
    "Date": "04/30/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "40.717687,-74.015812"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Gabe",
    "Email address": "gabeaweil@gmail.com",
    "City": "Massapequa (Long Island), New York, USA",
    "Location description": "47 Clinton Pl., Masspequa NY 11758",
    "Plus.Code Coordinates": "https://plus.codes/87G8MG4F+3XR",
    "Date": "04/29/2023",
    "Time": "8:30:00 PM",
    "Notes": "Please RSVP via e-mail if you plan to attend. ",
    "GPS Coordinates": "40.655187,-73.475063"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Michael",
    "Email address": "michael@postlibertarian.com",
    "City": "Memphis, Tennessee, USA",
    "Location description": "French Truck Coffee, Crosstown Concourse, Central Atrium. 1350 Concourse Ave, Memphis, TN 38104 We'll be at a table with a sign that says ACX MEETUP on it.",
    "Plus.Code Coordinates": "https://plus.codes/867F5X2P+QHC",
    "Date": "05/13/2023",
    "Time": "1:30:00 PM",
    "Notes": "We meet monthly and we have a Discord: https://discord.gg/3C74kCmsD9",
    "GPS Coordinates": "35.151938,-90.013563"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Eric",
    "Email address": "eric135033@gmail.com",
    "City": "Miami, Florida, USA",
    "Location description": "140 NE 39th St #001. Miami, FL 33137. Buckminster Fuller Fly's Eye Dome. Look for a paper sign that says ACX MEETUP west of the dome.",
    "Plus.Code Coordinates": "https://plus.codes/76QXRR65+V3",
    "Date": "05/21/2023",
    "Time": "5:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/MtJ7qgnfwuzuYzPcM/miami-acx-meetups-everywhere-2023",
    "Notes": "Miami ACX started in 2017 and hosts events on a regular basis in Miami and Fort Lauderdale. Visit the LessWrong event link for more details including links to our Facebook, Meetup, and Discord.",
    "GPS Coordinates": "25.812188,-80.192312"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Timothy",
    "Email address": "tmbond@gmail.com",
    "City": "Minneapolis, Minnesota, USA",
    "Location description": "Meet at Sisters' Sludge Coffee Cafe and Wine Bar. I will be wearing a \"Wall Drug\" souvenir shirt with a Jackalope being abducted by a UFO.",
    "Plus.Code Coordinates": "https://plus.codes/86P8WQM6+P89",
    "Date": "04/30/2023",
    "Time": "1:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/ceFbzaHFvET4wghBT/twin-cities-acx-meetup-april-2023",
    "Notes": "Make sure to RSVP so I can give a headcount to the Sisters. Also, they don't charge me for a large reservation but they do ask that everybody who attends purchase something - if you prefer I will buy you something, no questions asked.",
    "GPS Coordinates": "44.934313,-93.239187"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Henri Lemoine",
    "Email address": "acxmontreal@gmail.com",
    "City": "Montréal, Québec, Canada",
    "Location description": "Old Orchard pub &amp; grill, at 20 Prince Arthur street W.",
    "Plus.Code Coordinates": "https://plus.codes/87Q8GC7G+CW2",
    "Date": "04/22/2023",
    "Time": "1:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/gthqrT5Q5TLDohrRQ/acx-montreal-meetup-april-22th-2023",
    "GPS Coordinates": "45.513562,-73.572688"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Natasha Mott (@theory_gang)",
    "Email address": "nnmott@gmail.com",
    "City": "Nashville, Tennessee, USA",
    "Location description": "The Pinewood Social, 33 Peabody St, Nashville, TN 37210",
    "Plus.Code Coordinates": "https://plus.codes/868M565J+9V",
    "Date": "04/15/2023",
    "Time": "3:00:00 pm",
    "GPS Coordinates": "36.158437,-86.767813"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Willa",
    "Email address": "walambert@pm.me",
    "City": "Norfolk, Virginia, USA",
    "Location description": "Pagoda &amp; Oriental Garden, 265 W Tazewell St, Norfolk, VA 23510. We'll aim to sit or stand (recommendation: bring a folding chair) at the side of the Pagoda facing Freemason Harbor. I will wear a green shirt, green &amp; yellow hat, and have an ACX MEETUP sign. ",
    "Plus.Code Coordinates": "https://plus.codes/8785RPX4+W36",
    "Date": "04/30/2023",
    "Time": "10:30:00 AM",
    "Notes": "We may decamp by 12:45 to wander around downtown and/or get lunch. Possible after-meetup hangout! If you can't make it to the meetup but can do lunch or something a little later, please email me. In Norfolk on a Wednesday in the future? We regularly meet Wednesday evenings at Fair Grounds (cafe in Ghent) from 17:00-19:30. There's are meetups in Richmond or occasionally in Charlotesville. Check out Virginia Rationalists on LessWrong for Upcoming Events: https://www.lesswrong.com/groups/pLEbtx3BbdaLMXZKi",
    "GPS Coordinates": "36.849812,-76.294813"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Alex Liebowitz",
    "Email address": "alex@alexliebowitz.com",
    "City": "Northampton, Massachusetts, USA",
    "Location description": "Progression Brewing Co doesn't reserve specific tables, but I talked to a manager and he says he'll make sure there is enough general room for us. We'll probably go with outside if the weather is favorable and a good table is available, inside if not. Just wander around and look for a bunch of nerds with an \"ACX Meetup\" sign.",
    "Plus.Code Coordinates": "https://plus.codes/87J9899F+C4",
    "Date": "05/19/2023",
    "Time": "6:00:00 PM",
    "Notes": "This is the Meetups Everywhere Spring 2023 edition of a meetup that started in the 2018 Meetups Everywhere. At most meetups we get about 5-7 people out of a rotation of 15-20; Meetups Everywhere events tend to get a boost and we get closer to 8-10. Looking forward to a fun time!",
    "GPS Coordinates": "42.318562,-72.627188"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Tess Walsh",
    "Email address": "rationalottawa@gmail.com",
    "City": "Ottawa, Canada ",
    "Location description": "We'll be meeting in Commissioner's Park north of Dow's Lake, find us near the statue of The Man With Two Hats, there will be a large yellow sign that says ACX facing the statue.",
    "Plus.Code Coordinates": "https://plus.codes/87Q697XV+4V",
    "Date": "05/12/2023",
    "Time": "6:00:00 PM",
    "Event Link": "https://www.facebook.com/groups/rationalottawa/?ref=share_group_link",
    "GPS Coordinates": "45.397813,-75.705313"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Wes",
    "Email address": "wfenza@gmail.com",
    "City": "Philadelphia, Pennsylvania, USA",
    "Location description": "Philadelphia Ethical Society. 1906 Rittenhouse Square, Philadelphia, PA 19103",
    "Plus.Code Coordinates": "https://plus.codes/87F6WRXG+FQ",
    "Date": "04/27/2023",
    "Time": "6:30:00 PM",
    "Event Link": "https://discord.gg/W5rsVbdJUM?event=1090645327809363979",
    "Notes": "Free Dim Sum!",
    "GPS Coordinates": "39.948687,-75.173063"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Justin",
    "Email address": "pghacx@gmail.com",
    "City": "Pittsburgh, Pennsylvania, USA",
    "Location description": "Mellon Park, by the rose garden (the part of the park that's just SOUTH of Fifth Ave and just west of Beechwood Blvd; please refer to the coordinates for a more exact location) In the event of rain, our indoor contingency plan is to instead meet nearby at Galley Bakery Square (if looking for us at the Galley, be aware that there is also upper level. Justin will alert the group emailing list at least an hour before the event if we shift to indoor location, and also provide a follow-up email with the table number; if you wish to be added to this list prior to the event, please email him)",
    "Plus.Code Coordinates": "https://plus.codes/87G2F32J+VW",
    "Date": "04/22/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "40.452188,-79.917687"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Samuel Celarek ",
    "Email address": "scelarek@gmail.com",
    "City": "Portland, Oregon, USA",
    "Location description": "1548 NE 15th Ave, Portland, OR 97232",
    "Plus.Code Coordinates": "https://plus.codes/84QVG8MX+JV",
    "Date": "05/13/2023",
    "Time": "5:00:00 PM",
    "Event Link": "https://www.meetup.com/portland-effective-altruists-and-rationalists/events/sbndssydcgbgc/",
    "Notes": "If people would like to give a short presentation or lead a breakout activity, we will have a room set aside specifically for that at the event. Please fill out this google form to let me know what you would like present: https://forms.gle/opTeAXa5esPuxdBP9",
    "GPS Coordinates": "45.534063,-122.650312"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Logan",
    "Email address": "RTLW@googlegroups.com",
    "City": "Research Triangle (Raleigh-Durham), North Carolina, USA",
    "Location description": "By the Ponysaurus Brewing Company",
    "Plus.Code Coordinates": "https://plus.codes/8773X4Q4+Q2C",
    "Date": "04/13/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "35.989438,-78.894937"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Cedar",
    "Email address": "cedar.ren@gmail.com",
    "City": "Richmond, Virginia, USA",
    "Location description": "2nd Floor of Whole Foods at 2024 W Broad St",
    "Plus.Code Coordinates": "https://plus.codes/8794HG4Q+Q4",
    "Date": "05/06/2023",
    "Time": "2:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/h7x78HikDmsXfwwue/rva-meetup",
    "GPS Coordinates": "37.556938,-77.462187"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Alex",
    "Email address": "alexc@aya.yale.edu",
    "City": "Rochester, New York, USA",
    "Location description": "Boulder Coffee Company at 100 Alexander St, Rochester, NY 14620.  I'll be wearing a green shirt, and I'll make an ACX Meetup sign for the table.  I'm a slightly pudgy male in my 50s.",
    "Plus.Code Coordinates": "https://plus.codes/87M449WX+C3",
    "Date": "04/23/2023",
    "Time": "2:00:00 pm",
    "GPS Coordinates": "43.146062,-77.602312"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Ross",
    "Email address": "wearenotsaved@gmail.com",
    "City": "Salt Lake City, Utah, USA",
    "Location description": "Liberty Park North of the Chargepoint Station",
    "Plus.Code Coordinates": "https://plus.codes/85GCP4WF+VM",
    "Date": "04/15/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "40.747187,-111.875812"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Alexander",
    "Email address": "alexander@sferrella.com",
    "City": "San Antonio, Texas, USA",
    "Location description": "\"Elsewhere Bar and Grill\", at the entrance from the river walk; an 'ACX' sign will be on a table facing the river and I will be wearing a black cowboy hat",
    "Plus.Code Coordinates": "https://plus.codes/76X3CGP9+JM",
    "Date": "04/16/2023",
    "Time": "12:00:00 PM",
    "Event Link": "https://www.meetup.com/rationality-san-antonio/",
    "Notes": "The email address is real; I bought the domain to have it",
    "GPS Coordinates": "29.436563,-98.480812"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Julius",
    "Email address": "julius.simonelli@gmail.com",
    "City": "San Diego, California, USA",
    "Location description": "Bird Park - I will be wearing a red shirt and there will be a sign that says Astral Codex Ten",
    "Plus.Code Coordinates": "https://plus.codes/8544PVQ8+M6",
    "Date": "04/15/2023",
    "Time": "1:00:00 pm",
    "GPS Coordinates": "32.739187,-117.134438"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Dan",
    "Email address": "thehalliard@gmail.com",
    "City": "Santa Cruz, California, USA",
    "Location description": "We'll meet at Garfield Park, either at the picnic tables or on a blanket in a sunny spot somewhere. I'll be wearing a gray t-shirt.",
    "Plus.Code Coordinates": "https://plus.codes/848VXX54+2VC",
    "Date": "04/29/2023",
    "Time": "12:30:00 PM",
    "GPS Coordinates": "36.957563,-122.042812"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Spencer",
    "Email address": "speeze.pearson+acx@gmail.com",
    "City": "Seattle, Washington, USA",
    "Location description": "Volunteer Park, by the amphitheater. I'll have a folding table set up, and probably a sign with ACX MEETUP on it.",
    "Plus.Code Coordinates": "https://plus.codes/84VVJMJM+56",
    "Date": "04/15/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "47.630437,-122.316937"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Allison",
    "Email address": "southbaymeetup@gmail.com",
    "City": "Sunnyvale (South Bay SF area), California, USA",
    "Location description": "Washington Park (840 W Washington Ave, Sunnyvale, CA 94086) We'll be in the northeast end of the park, under the trees in a large grassy area. There will be a folding table with an ACX Meetup sign taped to it.",
    "Plus.Code Coordinates": "https://plus.codes/849V9XG6+X9J",
    "Date": "04/29/2023",
    "Time": "2:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/8v8KcRGRBesXaXeox/south-bay-acx-ssc-spring-meetups-everywhere",
    "GPS Coordinates": "37.377437,-122.039063"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Sean Aubin",
    "Email address": "seanaubin@gmail.com",
    "City": "Toronto, Ontario, Canada",
    "Location description": "In the basement of the MaRS Discovery District Atrium, there is a food court with ample customizable seating and is friendly to loitering. I'll be there wearing a neon yellow jacket and have a small sign with \"Applied Rationality Toronto\" on it.. To get to the food court, enter from MaRS from University avenue. Walk until you see escalators. Go down the escalators. The food court is behind the escalators. If you are lost, ask for directions to the food court from any of the security guards.",
    "Plus.Code Coordinates": "https://plus.codes/87M2MJ56+XMC",
    "Date": "04/16/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "43.659937,-79.388312"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Nate",
    "Email address": "natestrum@rocketmail.com",
    "City": "Tuscaloosa, Alabama, USA",
    "Location description": "Strange Brew Coffeehouse (1101 University Blvd, Tuscaloosa, AL 35401). We'll have a sign that says \"ACX.\"",
    "Plus.Code Coordinates": "https://plus.codes/865J6C6W+5X",
    "Date": "04/22/2023",
    "Time": "12:00:00 PM",
    "GPS Coordinates": "33.210437,-87.552563"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Tom Ash",
    "Email address": "events@philosofiles.com",
    "City": "Vancouver, British Columbia, Canada",
    "Location description": "East Van Brewing, at Commercial &amp; Venables. We'll be on the top floor, and have a sign.",
    "Plus.Code Coordinates": "https://plus.codes/84XR7WGH+PH",
    "Date": "04/20/2023",
    "Time": "7:00:00 PM",
    "Event Link": "https://www.facebook.com/events/1214528206120446/",
    "GPS Coordinates": "49.276812,-123.071062"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Skyler",
    "Email address": "skyler@rationalitymeetups.org",
    "City": "Washington, DC, USA",
    "Location description": "Froggy Bottom Pub: 2021 K Street NW, Washington, D.C. 20006",
    "Plus.Code Coordinates": "https://plus.codes/87C4WX33+3J",
    "Date": "04/29/2023",
    "Time": "7:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/DRrEn7GDz8GksBdMR/washington-dc-acx-mini-meetups-everywhere-spring-2023",
    "Notes": "Group Info:  Washington DC ACX/SSC has had an active group since the first Meetups Everywhere in 2017. We have socials, hikes, board game days, and other cultural events. We've collaborated with other nearby groups on EA topic focused discussions and rationality Dojo-type events. There exist two facebook groups for DC:https://www.facebook.com/groups/605023464809227/ and https://www.facebook.com/groups/433668130485595",
    "GPS Coordinates": "38.902687,-77.045938"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Jenn",
    "Email address": "hi@jenn.site",
    "City": "Waterloo, Ontario, Canada",
    "Location description": "Room C, Kitchener Public Library, Central Branch",
    "Plus.Code Coordinates": "https://plus.codes/86MXFG37+3C",
    "Date": "04/13/2023",
    "Time": "7:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/356ktNDSxLzbcG2Lc/acx-spring-meetups-everywhere",
    "Notes": "Also counts as Kitchener, Ontario",
    "GPS Coordinates": "43.452687,-80.486438"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "NR",
    "Email address": "mapreader4@gmail.com",
    "City": "West Lafayette, Indiana, USA",
    "Location description": "1275 1st Street, West Lafayette, IN 47906. We'll be in the south of the Earhart Hall lobby (not the dining court) near the piano, and I will be wearing a green shirt and carrying a sign with ACX MEETUP on it.",
    "Plus.Code Coordinates": "https://plus.codes/86GMC3GG+728",
    "Date": "04/15/2023",
    "Time": "12:00:00 PM",
    "Notes": "We had a meetup during the previous ACX Everywhere and that was quite enjoyable!",
    "GPS Coordinates": "40.425687,-86.924937"
  },
  {
    "Region": "North America",
    "Name/initials/handle": "Rob",
    "Email address": "RobRoyACX@gmail.com",
    "City": "West Palm Beach, Florida, USA",
    "Location description": "Grandview Public Market. 1401 Clare Ave, West Palm Beach, FL 33401. We'll be at the northeast outside area, sitting at a table with an ACX MEETUP sign on it. Parking is free at an adjacent lot, and there may also be a free valet service.",
    "Plus.Code Coordinates": "https://plus.codes/76RXMWXP+GH",
    "Date": "05/27/2023",
    "Time": "11:00:00 AM",
    "Event Link": "https://www.eventbrite.com/e/acx-meetups-everywhere-rationality-in-west-palm-beach-tickets-608249630017",
    "Notes": "See our Eventbrite for more details, including meetup opportunities in Boca Raton, Delray Beach, and Boynton Beach.",
    "GPS Coordinates": "26.698813,-80.063563"
  }
]

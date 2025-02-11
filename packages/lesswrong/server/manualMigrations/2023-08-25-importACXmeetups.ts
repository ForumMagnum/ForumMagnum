import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';
import { createMutator } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
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

registerMigration({
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
        const username = await getUnusedSlugByCollectionName("Users", row["Name"].toLowerCase());
        try {
          const { data: newUser } = await createMutator({
            collection: Users,
            document: {
              username,
              displayName: row["Name"],
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
              displayName: row["Name"],
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
  "Name": string
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
    "Name": "Olaoluwa",
    "Email address": "akinloluwa.olaoluwa@gmail.com",
    "City": "Abuja, Nigeria",
    "Location description": "Habil Cafe, Atakpame Crescent, Wuse II",
    "Plus.Code Coordinates": "https://plus.codes/6FX93F9H+J9",
    "Date": "9/23/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "9.069063,7.478438"
  },
  {
    "Region": "Africa",
    "Name": "Yaseen Mowzer",
    "Email address": "yaseen@mowzer.co.za",
    "City": "Cape Town, South Africa",
    "Location description": " Truth Coffee Roasting, 36 Buitenkant St, Cape Town City Centre",
    "Plus.Code Coordinates": "https://plus.codes/4FRW3CCF+P3",
    "Date": "9/16/2023",
    "Time": "11:00:00 AM",
    "Notes": "Please RSVP so I know how big a table to reserve",
    "GPS Coordinates": "-33.928187,18.422688"
  },
  {
    "Region": "Africa",
    "Name": "Neil",
    "Email address": "neilsotherinbox@gmail.com",
    "City": "Mukono, Uganda",
    "Location description": "Bushbaby Lodge, there will be seating arranged and a sign in case there are other groups meeting that day too.",
    "Plus.Code Coordinates": "https://plus.codes/6GGJ7RHC+X2",
    "Date": "10/15/2023",
    "Time": "11:00:00 AM",
    "Notes": "Tea and coffee will be served. Other food and drinks available for purchase. Feel free to bring kids/dogs.",
    "GPS Coordinates": "0.279938,32.820062"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Andy B",
    "Email address": "Andy.Bachler@gmail.com",
    "City": "Canberra, ACT, Australia",
    "Location description": "Looking to meet at Grease Monkey in Braddon. I will book a table under the name Andy, will probably be in the outside area.",
    "Plus.Code Coordinates": "https://plus.codes/4RPFP4GM+Q2X",
    "Date": "10/2/2023",
    "Time": "5:00:00 PM",
    "Notes": "GreaseMonkey have half-price drinks and snacks from 4pm-6pm. I will look to organise a chip-in for pizzas for those that are keen :-)",
    "GPS Coordinates": "-35.273063,149.132563"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Lerancan",
    "Email address": "lerancan@gmail.com",
    "City": "Gold Coast, Queensland, Australia",
    "Location description": "A picnic table, Wyberba Street Reserve, Tugun",
    "Plus.Code Coordinates": "https://plus.codes/5R3MVF5W+26",
    "Date": "10/8/2023",
    "Time": "2:00:00 PM",
    "Notes": "I will have an ACX sign. Email me in case of bad weather/you can't find me/you can't make that time but would still like to meet etc.",
    "GPS Coordinates": "-28.142437,153.495563"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "RS",
    "Email address": "xgravityx@hotmail.com",
    "City": "Melbourne, Victoria, Australia",
    "Location description": "Queensberry Hotel, dining room. 593 Swanston St Carlton.",
    "Plus.Code Coordinates": "https://plus.codes/4RJ65XW7+46",
    "Date": "10/6/2023",
    "Time": "6:00:00 PM",
    "Notes": "Email me or join the Facebook group Less Wrong Melbourne to RSVP so I can book a big enough table.",
    "GPS Coordinates": "-37.804688,144.963062"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Eliot",
    "Email address": "Redeliot@gmail.com",
    "City": "Sydney, New South Wales, Australia",
    "Location description": "Shanghai restaurant, Level 2, 565 George St, Sydney NSW",
    "Plus.Code Coordinates": "https://plus.codes/4RRH46F4+79J",
    "Date": "9/21/2023",
    "Time": "6:00:00 PM",
    "Notes": "Please RSVP to meetup.com",
    "GPS Coordinates": "-33.876812,151.205938"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Max Bolingbroke",
    "Email address": "acx@alpha.engineering",
    "City": "Central, Hong Kong",
    "Location description": "The Catalyst, 2 Po Yan Street, Sheung Wan. Big wooden door.",
    "Plus.Code Coordinates": "https://plus.codes/7PJP74PW+6XF",
    "Date": "10/7/2023",
    "Time": "3:00:00 PM",
    "Notes": "We may need to change venues; the alternative location is 3rd Wave Art Studio, Room B, 2/F, Hollywood Building, 186 Hollywood Rd, Sheung Wan. I'll leave a comment on the LessWrong event if we change, and you can also email me to confirm.",
    "GPS Coordinates": "22.281188,114.157812"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Nihal",
    "Email address": "propwash@duck.com",
    "City": "Bangalore, India",
    "Location description": "Matteo Coffea, Church Street",
    "Plus.Code Coordinates": "https://plus.codes/7J4VXJF4+PR",
    "Date": "9/24/2023",
    "Time": "4:00:00 PM",
    "Notes": "Please RSVP on LessWrong",
    "GPS Coordinates": "12.974312,77.607062"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "PB",
    "Email address": "e2y94n1nv@relay.firefox.com",
    "City": "Mumbai, India",
    "Location description": "Versova Social, Mumbai. We have arranged to use the co-working space at Versova Social and will be on the 2nd floor. Link: goo.gl/maps/1RLjZwTB2bfaQVmN6 ",
    "Plus.Code Coordinates": "https://plus.codes/7JFJ4RGC+J5",
    "Date": "9/24/2023",
    "Time": "3:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/Yj9MHguuKHaznp4bo/acx-meetups-everywhere-fall-2023-1",
    "Notes": "Please RSVP on LessWrong or via email, so we can arrange for enough food and space. LW Link: https://www.lesswrong.com/events/Yj9MHguuKHaznp4bo/acx-meetups-everywhere-fall-2023-1. Google group link: https://groups.google.com/g/acx-mumbai/about",
    "GPS Coordinates": "19.126562,72.820437"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Fawwaz",
    "Email address": "fawwazanvi@gmail.com",
    "City": "Jakarta, Indonesia ",
    "Location description": "Workshop Space, Cecemuwe Cafe and Space - Senayan",
    "Plus.Code Coordinates": "https://plus.codes/6P58QQ7V+G8",
    "Date": "9/10/2023",
    "Time": "3:00:00 PM",
    "Notes": "Please RSVP on my twitter account -- @fawwazanvilen -- so I have an idea of how many are coming.",
    "GPS Coordinates": "-6.236187,106.793312"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Mustafa Ahmed",
    "Email address": "tofiahmed117@gmail.com",
    "City": "Baghdad, Iraq",
    "Location description": "Grinders cafe, Zayouna",
    "Plus.Code Coordinates": "https://plus.codes/8H568FG6+92",
    "Date": "9/8/2023",
    "Time": "10:00:00 AM",
    "GPS Coordinates": "33.325938,44.460062"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Inbar",
    "Email address": "inbar192@gmail.com",
    "City": "Tel Aviv, Israel",
    "Location description": "The grass area next to Max Brenner in Sarona park. I'll have an ACX sign",
    "Plus.Code Coordinates": "https://plus.codes/8G4P3QCP+MP",
    "Date": "9/21/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "32.071687,34.786812"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Harold and Andrew",
    "Email address": "rationalitysalon@gmail.com",
    "City": "Tokyo, Japan",
    "Location description": "Nakameguro, Tokyo",
    "Plus.Code Coordinates": "https://plus.codes/8Q7XJPV2+QG",
    "Date": "10/14/2023",
    "Time": "10:00:00 AM",
    "Notes": "Please contact the organizer to RSVP and for exact details.",
    "GPS Coordinates": "35.644437,139.701312"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Yi-Yang",
    "Email address": "yi.yang.chua@gmail.com",
    "City": "Kuala Lumpur, Malaysia",
    "Location description": "We'll meet at Kings Hall Cafe (https://goo.gl/maps/cWNjqdaHUeLphGNd9). We'll have a make-shift ACX sign on the table, so you might have to walk around and look closely.",
    "Plus.Code Coordinates": "https://plus.codes/6PM34J7R+R4",
    "Date": "9/3/2023",
    "Time": "2:00:00 PM",
    "Notes": "Please RSVP on LessWrong so I'm more prepared",
    "GPS Coordinates": "3.114562,101.640312"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Jonathan",
    "Email address": "jonpdw@gmail.com",
    "City": "Auckland, New Zealand ",
    "Location description": "Brunch at the cafe Sugar at Chelsea Bay",
    "Plus.Code Coordinates": "https://plus.codes/4VMP5PHG+H2",
    "Date": "9/16/2023",
    "Time": "10:30:00 AM",
    "Notes": "Please RSVP through email so I can book a table beforehand",
    "GPS Coordinates": "-36.821062,174.725062"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Pat",
    "Email address": "MyAutoForm1@protonmail.com",
    "City": "Christchurch, New Zealand",
    "Location description": "Ilex Cafe, Christchurch Botanic Gardens. I'll have an ACX sign",
    "Plus.Code Coordinates": "https://plus.codes/4V8JFJCF+22",
    "Date": "9/9/2023",
    "Time": "2:30:00 PM",
    "Notes": "Likely a small group so open to change if we want to co-ordinate that. Please RSVP so I'm not waiting for no-one :)",
    "GPS Coordinates": "-43.529938,172.622563"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Ben W",
    "Email address": "benwve@gmail.com",
    "City": "Wellington, New Zealand",
    "Location description": "Room MZ02 (on the mezannine floor), Rutherford House, 33 Bunny Street, Wellington 6011",
    "Plus.Code Coordinates": "https://plus.codes/4VCPPQCH+CMR",
    "Date": "10/3/2023",
    "Time": "5:30:00 PM",
    "Notes": "This meetup will be run in collaboration with Effective Altruism Wellington.  The external door closes at 6pm, but if you call me I can let you in. reach me on 0+2+7+3+4+4+1+0+8+2",
    "GPS Coordinates": "-41.278937,174.779187"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Kon",
    "Email address": "konquek@gmail.com",
    "City": "Singapore",
    "Location description": "Large Park (https://www.beesknees.sg/bees-knees-petite)",
    "Plus.Code Coordinates": "https://plus.codes/6PH58R75+MX",
    "Date": "10/8/2023",
    "Time": "4:00:00 PM",
    "GPS Coordinates": "1.314188,103.809938"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Erol C. A.",
    "Email address": "erolca0451@gmail.com",
    "City": "Çankaya, Ankara, Türkiye",
    "Location description": "Seymenler Parkı büfeler",
    "Plus.Code Coordinates": "https://plus.codes/8GFJVVW7+V8",
    "Date": "9/2/2023",
    "Time": "6:00:00 PM",
    "Notes": "Gelmeyi düşünenler önden mail atarsa sevinirim, hiç mail gelmezse uzun süre boş boş beklemeyeyim. - I'd appreciate it if prospective attendees send an email beforehand so I won't have to wait for no one to appear.",
    "GPS Coordinates": "39.897188,32.863312"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "RS",
    "Email address": "xyxyxz@gmail.com",
    "City": "Dubai, UAE",
    "Location description": "Unwind Boardgame Cafe - Zabeel",
    "Plus.Code Coordinates": "https://plus.codes/7HQQ67MV+HV",
    "Date": "9/24/2023",
    "Time": "7:00:00 PM",
    "Notes": "Please RSVP on LessWrong or send an email",
    "GPS Coordinates": "25.233938,55.294688"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Hiep",
    "Email address": "hiepbq14408@gmail.com",
    "City": "Ho Chi Minh city, Vietnam",
    "Location description": "The Maya Bistro, Binh Thanh District, Ho Chi Minh city",
    "Plus.Code Coordinates": "https://plus.codes/7P28RP69+72",
    "Date": "9/10/2023",
    "Time": "9:30:00 AM",
    "GPS Coordinates": "10.810688,106.717562"
  },
  {
    "Region": "Europe",
    "Name": "Daniel Bensen",
    "Email address": "bensen.daniel@gmail.com",
    "City": "Sofia, Bulgaria",
    "Location description": "The Shade Garden (in Borisova Gradina Park)",
    "Plus.Code Coordinates": "https://plus.codes/8GJ5P958+VP",
    "Date": "9/17/2023",
    "Time": "4:00:00 PM",
    "Notes": "Everyone is welcome. Feel free to bring kids and dogs. Looking forward to seeing you.",
    "GPS Coordinates": "42.709688,23.366813"
  },
  {
    "Region": "Europe",
    "Name": "Michal",
    "Email address": "adekcz@gmail.com",
    "City": "Brno, Czech Republic",
    "Location description": "Veselá 5, 4th floor, EA clubroom, there will also be a sign on the front door.",
    "Plus.Code Coordinates": "https://plus.codes/8FXR5JV4+RM2",
    "Date": "9/25/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "49.194562,16.606687"
  },
  {
    "Region": "Europe",
    "Name": "Daniel",
    "Email address": "betualphu@gmail.com",
    "City": "Prague, Czech Republic",
    "Location description": "We will be meeting at Fixed Point, Koperníkova 6, 120 00 Vinohrady, Prague, there will be signs to lead you to the main location.",
    "Plus.Code Coordinates": "https://plus.codes/9F2P3CCR+3C",
    "Date": "10/3/2023",
    "Time": "6:30:00 PM",
    "Event Link":"https://www.facebook.com/events/1326413691300378",
    "Notes": "Please RSVP on Facebook https://fb.me/e/1bQg1Bitu so we know how much food to get (if we manage to get it) and can design the space and the program appropriately. Kids are welcome, but we won't have any special program for them. No dogs please.",
    "GPS Coordinates": "55.653813,12.566063"
  },
  {
    "Region": "Europe",
    "Name": "Søren Elverlin",
    "Email address": "soeren.elverlin@gmail.com",
    "City": "Copenhagen, Denmark",
    "Location description": "Rundholtsvej 10, 2300 København S",
    "Plus.Code Coordinates": "https://plus.codes/9F7JMH38+GCQ",
    "Date": "10/7/2023",
    "Time": "3:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/Ei3MKRfdH4eXnPjnD/astralcodexten-lesswrong-meetup-6",
    "Notes": "RSVP on LessWrong",
    "GPS Coordinates": "55.653813,12.566063"
  },
  {
    "Region": "Europe",
    "Name": "Joe Nash",
    "Email address": "sschelsinkimeetup@gmail.com",
    "City": "Helsinki, Finland",
    "Location description": "Kitty's Public House, Mannerheimintie 5. We'll be in the private room called Kitty's Lounge, find it and come in.",
    "Plus.Code Coordinates": "https://plus.codes/9GG65W9R+Q4",
    "Date": "9/26/2023",
    "Time": "6:00:00 PM",
    "GPS Coordinates": "60.169438,24.940312"
  },
  {
    "Region": "Europe",
    "Name": "Épiphanie Gédéon (Épi)",
    "Email address": "iwonder@whatisthis.world",
    "City": "Paris, Île-de-France/Paris, France",
    "Location description": "We'll meet at the Parc Montsouris, just below Cité Universitaire. We'll be in front of the Avenue Reille and Avenue René Corty entrance, behind the statue on the grass. We'll have an ACX meetup sign and tableclothes",
    "Plus.Code Coordinates": "https://plus.codes/8FW4R8FP+CJ",
    "Date": "10/15/2023",
    "Time": "5:30:00 PM",
    "GPS Coordinates": "48.823563,2.336563"
  },
  {
    "Region": "Europe",
    "Name": "Michael",
    "Email address": "acx-meetup-2023-09-23@weboroso.anonaddy.com",
    "City": "Talence (Bordeaux Metropole), Gironde, France",
    "Location description": "Parc Peixotto, middle of the path connecting the two main entrances (once we meet we'll seek which benches to try to grab). Initial position: https://www.openstreetmap.org/#map=19/44.80900/-0.58978 (Send me your phone if you expecte to be late and want an SMS when we deside which direction in the parc we shift) I will bring an A4 sign with «ACX Meetup» on it. I usually wear a mask in high-stranger-density settings.",
    "Plus.Code Coordinates": "https://plus.codes/8CPXRC56+H3W",
    "Date": "9/23/2023",
    "Time": "3:00:00 PM",
    "Notes": "Please RSVP on LessWrong so I know that someone is indeed coming. This will be a small meetup with no fixed topic, so whatever you want to discuss, we can discuss it!",
    "GPS Coordinates": "44.808937,-0.589813"
  },
  {
    "Region": "Europe",
    "Name": "Alfonso",
    "Email address": "barsom.maelwys@gmail.com",
    "City": "Toulouse, France",
    "Location description": "Pub The Tower of London, 39 Gd Rue Saint-Michel, 31400 Toulouse. We'll have a sign saying ACX Meetup, and we'll probably be sitting in the back.",
    "Plus.Code Coordinates": "https://plus.codes/8FM3HCPW+HP",
    "Date": "10/15/2023",
    "Time": "7:00:00 PM",
    "Notes": "Please, RSVP by emailing barsom.maelwys@gmail.com. Thank you!",
    "GPS Coordinates": "43.586438,1.446813"
  },
  {
    "Region": "Europe",
    "Name": "Milli",
    "Email address": "acx-meetups@martinmilbradt.de",
    "City": "Berlin, Berlin, Germany",
    "Location description": "Center of Humboldthain",
    "Plus.Code Coordinates": "https://plus.codes/9F4MG9WP+36",
    "Date": "9/16/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "52.545187,13.385562"
  },
  {
    "Region": "Europe",
    "Name": "Rasmus",
    "Email address": "ad.fontes@aol.com",
    "City": "Bremen, Germany",
    "Location description": "Fehrfeld (the bar, not the street); there will be an Epic Perplexus Ball on or at our table.",
    "Plus.Code Coordinates": "https://plus.codes/9F5C3RFF+9Q",
    "Date": "9/26/2023",
    "Time": "7:00:00 PM",
    "Notes": "At the spring meetup, we decided to kick off a regular event. Since then, our group has grown from two to four people! We now gather on the fourth Tuesday evening of every month, so if you can't make it for the September meetup, we will also meet on October 24th, same place and time. Of course, you are also cordially invited if you don't want to commit to attend the meetup regularly. And if you can't make it, do not hesitate to reach out to me.",
    "GPS Coordinates": "53.073437,8.824438"
  },
  {
    "Region": "Europe",
    "Name": "Marcel Müller",
    "Email address": "marcel_mueller@mail.de",
    "City": "Cologne, Germany",
    "Location description": "Marienweg 43, 50858 Köln (Cologne)",
    "Plus.Code Coordinates": "https://plus.codes/9F28WRMX+97",
    "Date": "9/9/2023",
    "Time": "5:00:00 PM",
    "GPS Coordinates": "50.933437,6.848187"
  },
  {
    "Region": "Europe",
    "Name": "Florian",
    "Email address": "komasa@darmstadt.ccc.de",
    "City": "Darmstadt, Germany",
    "Location description": "Chaos Computer Club Darmstadt, https://www.chaos-darmstadt.de/hackspace/",
    "Plus.Code Coordinates": "https://plus.codes/8FXCVMC2+8FQ",
    "Date": "10/28/2023",
    "Time": "3:00:00 PM",
    "Notes": "RSVP appreciated, but not required. _IF_ we plan something for food, we will calculate it based on that",
    "GPS Coordinates": "49.870812,8.651187"
  },
  {
    "Region": "Europe",
    "Name": "Omar",
    "Email address": "info@rationality-freiburg.de",
    "City": "Freiburg, Germany",
    "Location description": "Haus des Engagements, Rehlingstraße 9 (inner courtyard), 79100 Freiburg",
    "Plus.Code Coordinates": "https://plus.codes/8FV9XRQQ+QQ",
    "Date": "9/15/2023",
    "Time": "6:00:00 PM",
    "Notes": "https://www.rationality-freiburg.de/events/2023-09-15-poker-and-statistics/",
    "GPS Coordinates": "47.989438,7.839438"
  },
  {
    "Region": "Europe",
    "Name": "Chris",
    "Email address": "acx.hamburg@gmail.com",
    "City": "Hamburg, Germany",
    "Location description": "Planten un Blomen, Japanischer Garten, Pavillon",
    "Plus.Code Coordinates": "https://plus.codes/9F5FHX6M+76X",
    "Date": "9/24/2023",
    "Time": "4:00:00 PM",
    "Notes": "Just looking to get in touch with other interested people, so no knowledge or expertise of any kind necessary to attend the meetup. If you intend to come I would appreciate a short email, but feel free to join spontaneously : ) Bring along what makes for a nice afternoon/evening in the park. In case of harsh weather, we could switch to a cafe or bar (I will check my email regularly and could quickly respond to you with the new location).",
    "GPS Coordinates": "53.560738,9.983109"
  },
  {
    "Region": "Europe",
    "Name": "Roman L",
    "Email address": "roman.leipe@gmx.de",
    "City": "Leipzig, Germany",
    "Location description": "Substanz Biergarten, Täubchenweg 67, look for ACX Meetup sign on the table",
    "Plus.Code Coordinates": "https://plus.codes/9F3J8CP3+H53",
    "Date": "9/12/2023",
    "Time": "6:30:00 PM",
    "GPS Coordinates": "51.336437,12.402938"
  },
  {
    "Region": "Europe",
    "Name": "Simon",
    "Email address": "acxmannheim@mailbox.org",
    "City": "Mannheim and Heidelberg, Germany",
    "Location description": "Murphy's Law, Mannheim",
    "Plus.Code Coordinates": "https://plus.codes/8FXCFFJC+5G",
    "Date": "10/7/2023",
    "Time": "8:00:00 PM",
    "Notes": "Depending on how many people sign up we might need to find a different spot. Let me know if you are interested in coming, so I can estimate!",
    "GPS Coordinates": "49.480438,8.471312"
  },
  {
    "Region": "Europe",
    "Name": "Erich",
    "Email address": "erich@meetanyway.com",
    "City": "Munich, Germany",
    "Location description": "Sandstraße 25, there will be a sign in front of the door, if the weather is good we'll meet it in the inner yard, if it's bad we'll meet in my apartment on the 2nd floor",
    "Plus.Code Coordinates": "https://plus.codes/8FWH4HX4+JF",
    "Date": "9/5/2023",
    "Time": "7:00:00 PM",
    "Notes": "I'll have some drinks, but it would be great if you could also bring some. At around 20:00 we'll order Pizzas.",
    "GPS Coordinates": "48.149062,11.556188"
  },
  {
    "Region": "Europe",
    "Name": "Spyros",
    "Email address": "acx.meetup.athens.greece@gmail.com ",
    "City": "Athens, Greece",
    "Location description": "On the plaza in front of the National Library. Look for the ACX sign.",
    "Plus.Code Coordinates": "https://plus.codes/8G95WMQR+WRP",
    "Date": "9/27/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "37.939813,23.692062"
  },
  {
    "Region": "Europe",
    "Name": "Timothy",
    "Email address": "Timunderwood9@gmail.com",
    "City": "Budapest, Hungary",
    "Location description": "Northeast corner of the Museum Kért, near Kálvin. I'll bring a big purple book by Richard Dawkins, and someone might set up a sign.. If it rains we'll move to Lumen, a nearby cafe.",
    "Plus.Code Coordinates": "https://plus.codes/8FVXF3R7+R8",
    "Date": "9/10/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "47.492062,19.063313"
  },
  {
    "Region": "Europe",
    "Name": "Mauro ",
    "Email address": "acx@cicio.org",
    "City": "Foligno, Umbria, Italy",
    "Location description": "Parco dei Canape, at the open-air bar",
    "Plus.Code Coordinates": "https://plus.codes/8FJJXP22+H9X",
    "Date": "9/24/2023",
    "Time": "5:00:00 PM",
    "GPS Coordinates": "42.951437,12.700938"
  },
  {
    "Region": "Europe",
    "Name": "Raffaele Mauro",
    "Email address": "raffa.mauro@gmail.com",
    "City": "Milano, Lombardia, Italy",
    "Location description": "Viale Majno 18, Milano (MI)",
    "Plus.Code Coordinates": "https://plus.codes/8FQFF6C4+9C",
    "Date": "9/15/2023",
    "Time": "6:30:00 PM",
    "Event Link": "https://www.meetup.com/acx-tokyo/events/293612768/",
    "Notes": "Please contact on email for details ",
    "GPS Coordinates": "45.470937,9.206062"
  },
  {
    "Region": "Europe",
    "Name": "Lorenzo",
    "Email address": "buonanno.lorenzo@gmail.com",
    "City": "Pisa, Italy",
    "Location description": "Orzo Bruno, Via delle Case Dipinte 6, I will be wearing a light blue shirt with VOLUNTEER written on it.",
    "Plus.Code Coordinates": "https://plus.codes/8FMGPC93+47",
    "Date": "10/1/2023",
    "Time": "7:30:00 PM",
    "GPS Coordinates": "43.717813,10.403187"
  },
  {
    "Region": "Europe",
    "Name": "Gregory Efstathiadis",
    "Email address": "Greghero12@gmail.com",
    "City": "Rome, Italy",
    "Location description": "Gardenie train station, i'll be wearing a red shirt",
    "Plus.Code Coordinates": "https://plus.codes/8FHJVHP9+8F",
    "Date": "10/14/2023",
    "Time": "6:00:00 PM",
    "GPS Coordinates": "41.885813,12.568687"
  },
  {
    "Region": "Europe",
    "Name": "Leonardo Taglialegne",
    "Email address": "cmt.miniBill@gmail.com",
    "City": "Udine, Friuli Venezia Giulia, Italy",
    "Location description": "I'll be on the grass with a sign with MEETUP ACX on it",
    "Plus.Code Coordinates": "https://plus.codes/8FRM369P+26",
    "Date": "9/30/2023",
    "Time": "2:30:00 PM",
    "Notes": "If you contact me I can add you to the relevant Telegram group",
    "GPS Coordinates": "46.067563,13.235563"
  },
  {
    "Region": "Europe",
    "Name": "Artūrs and Anastasia",
    "Email address": "latvia@eahub.org",
    "City": "Riga, Latvia",
    "Location description": "Gravity Hall, 11 Puskina iela, Riga",
    "Plus.Code Coordinates": "https://plus.codes/9G86W4RC+PF",
    "Date": "9/13/2023",
    "Time": "6:30:00 PM",
    "GPS Coordinates": "56.941812,24.121187"
  },
  {
    "Region": "Europe",
    "Name": "Tom",
    "Email address": "acx.vilnius@gmail.com",
    "City": "Vilnius, Lithuania",
    "Location description": "Vinco Kudirkos square (Vinco Kudirkos aikštė). I will be in front of the central statue with an ACX MEETUP sign.",
    "Plus.Code Coordinates": "https://plus.codes/9G67M7QJ+26",
    "Date": "9/16/2023",
    "Time": "3:00:00 PM",
    "Notes": "RSVP via LessWrong or email (acx.vilnius@gmail.com) preferred, but not required. Don't have any big plans, anyone who wants to join is welcome.",
    "GPS Coordinates": "54.687562,25.280563"
  },
  {
    "Region": "Europe",
    "Name": "Igor Bakutin",
    "Email address": "Igorbakutin@gmail.com",
    "City": "Amsterdam, Netherlands",
    "Location description": "Houtmankade 105",
    "Plus.Code Coordinates": "https://plus.codes/9F469VPM+HHF",
    "Date": "9/30/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "52.386437,4.883938"
  },
  {
    "Region": "Europe",
    "Name": "Hans Andreas",
    "Email address": "acxoslomeetup@gmail.com",
    "City": "Oslo, Norway",
    "Location description": "Café Billabong",
    "Plus.Code Coordinates": "https://plus.codes/9FFGWPH7+QP",
    "Date": "10/14/2023",
    "Time": "1:00:00 PM",
    "Notes": "You don't need to buy food to attend!",
    "GPS Coordinates": "59.929437,10.714313"
  },
  {
    "Region": "Europe",
    "Name": "Luís Campos",
    "Email address": "luis.filipe.lcampos@gmail.com",
    "City": "Lisbon, Portugal",
    "Location description": "We meet on top of a small hill East of the Linha d'Água café in Jardim Amália Rodrigues. I'll be wearing a pink t-shirt and we'll have a ACX MEETUP sign.",
    "Plus.Code Coordinates": "https://plus.codes/8CCGPRJW+V8",
    "Date": "9/16/2023",
    "Time": "3:00:00 PM",
    "Notes": "For comfort, bring sunglasses and a blanket to sit on. There is some natural shade. Also, it can get quite windy, so bring a jacket.",
    "GPS Coordinates": "38.732188,-9.154187"
  },
  {
    "Region": "Europe",
    "Name": "UselessCommon",
    "Email address": "titon.a@yandex.ru",
    "City": "Moscow, Moscow Oblast, Russia",
    "Location description": "Москва, Русаковская ул. д.31 - торговый центр Сокольники, 2 этаж, фуд-корт/Moscow, Russakovskaya st. 31 - Сокольники trade center, food-court. I will bring an SSC sign.",
    "Plus.Code Coordinates": "https://plus.codes/9G7VQMQH+8F",
    "Date": "9/16/2023",
    "Time": "2:00:00 PM",
    "Notes": "I don't really use LW, and would prefer to be contacted (as uselesscommon) on the ACX discord.",
    "GPS Coordinates": "55.788312,37.678687"
  },
  {
    "Region": "Europe",
    "Name": "Dušan",
    "Email address": "tatiana.n.skuratova@efektivnialtruizam.rs",
    "City": "Belgrade, Serbia",
    "Location description": "Bar Green House, Dr. Dragoslava Popovica 24, Belgrade",
    "Plus.Code Coordinates": "https://plus.codes/8GP2RF7G+36",
    "Date": "9/24/2023",
    "Time": "3:00:00 PM",
    "Notes": "Please RSVP by email to Tatiana on the email above! The meet-up is the monthly meet-up of EA/LW/ACX crowd, usually we discuss some two topics. For example in August we are doing Life Extension and Healthy Relationships.",
    "GPS Coordinates": "44.812687,20.475563"
  },
  {
    "Region": "Europe",
    "Name": "Demjan (Demian)",
    "Email address": "demjan.vester@gmail.com",
    "City": "Ljubljana, Slovenia",
    "Location description": "Vrt Lili Novi",
    "Plus.Code Coordinates": "https://plus.codes/8FRP3F3X+6V",
    "Date": "9/13/2023",
    "Time": "7:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/Aqf3kpFMw9CZKEae4/acx-meetups-everywhere-4",
    "Notes": "Please RSVP on LessWrong",
    "GPS Coordinates": "46.053062,14.499688"
  },
  {
    "Region": "Europe",
    "Name": "Alfonso ",
    "Email address": "alfonso.martinez@upf.edu",
    "City": "Barcelona, Spain",
    "Location description": "Parc de la Ciutadella, by the Lion's Catcher statue",
    "Plus.Code Coordinates": "https://plus.codes/8FH495QP+85",
    "Date": "10/1/2023",
    "Time": "5:00:00 PM",
    "GPS Coordinates": "41.388312,2.185437"
  },
  {
    "Region": "Europe",
    "Name": "Antonio",
    "Email address": "a@olmo-titos.info",
    "City": "Madrid, Spain",
    "Location description": "El Retiro Park, puppet theatre ( https://www.esmadrid.com/en/tourist-information/teatro-de-titeres-de-el-retiro )",
    "Plus.Code Coordinates": "https://plus.codes/8CGRC897+F8M",
    "Date": "9/23/2023",
    "Time": "11:00:00 AM",
    "GPS Coordinates": "40.418688,-3.686687"
  },
  {
    "Region": "Europe",
    "Name": "Stefan",
    "Email address": "acx_gbg@posteo.se",
    "City": "Gothenburg, Sweden",
    "Location description": "Condeco Fredsgatan upper floor, look for a book on the table",
    "Plus.Code Coordinates": "https://plus.codes/9F9HPX4C+4CR",
    "Date": "9/28/2023",
    "Time": "6:00:00 PM",
    "GPS Coordinates": "57.705312,11.971063"
  },
  {
    "Region": "Europe",
    "Name": "Jonatan W",
    "Email address": "jonatanwestholm@hotmail.com",
    "City": "Stockholm, Sweden",
    "Location description": "Scandic Continental near Stockholm Central",
    "Plus.Code Coordinates": "https://plus.codes/9FFW83J5+CR",
    "Date": "9/24/2023",
    "Time": "3:00:00 PM",
    "Notes": "Please RSVP so I know if we'll be more than about 7: if so, we may need to find a bigger place.",
    "GPS Coordinates": "59.331063,18.059562"
  },
  {
    "Region": "Europe",
    "Name": "Daniel",
    "Email address": "Dd14214@gmail.com",
    "City": "Bern, Switzerland ",
    "Location description": "Grosse Schanze, Haller statue",
    "Plus.Code Coordinates": "https://plus.codes/8FR9XC2Q+3G",
    "Date": "9/17/2023",
    "Time": "12:00:00 PM",
    "Notes": "Please RSVP on LessWrong",
    "GPS Coordinates": "46.950187,7.438813"
  },
  {
    "Region": "Europe",
    "Name": "Valts",
    "Email address": "valtskr@inbox.lv",
    "City": "Geneva, Switzerland",
    "Location description": "Alpine Botanical Garden of Meyrin, round chair thingy in northern part, I'll be in a tie-dyed shirt ",
    "Plus.Code Coordinates": "https://plus.codes/8FR863HM+23R",
    "Date": "9/24/2023",
    "Time": "10:00:00 AM",
    "Notes": "Meetup is going to be in English",
    "GPS Coordinates": "46.227563,6.082688"
  },
  {
    "Region": "Europe",
    "Name": "MB",
    "Email address": "acxzurich@proton.me",
    "City": "Zurich, Zurich, Switzerland",
    "Location description": "Blatterwiese in front of the chinese garden. If it rains we will be inside the chinese garden under the roof (free entry).",
    "Plus.Code Coordinates": "https://plus.codes/8FVC9H32+PM",
    "Date": "9/30/2023",
    "Time": "3:00:00 PM",
    "Notes": "I appreciate it when people who have a LW account anyways RSVP there.",
    "GPS Coordinates": "47.354312,8.551687"
  },
  {
    "Region": "Europe",
    "Name": "Nick Lowry",
    "Email address": "bristoleffectivealtruism@gmail.com",
    "City": "Bristol, UK",
    "Location description": "We’ll be meeting at entrance closet to Tesco Express in the Galleries, Broadmean -",
    "Plus.Code Coordinates": "https://plus.codes/9C3VFC45+RJM",
    "Date": "10/21/2023",
    "Time": "2:00:00 PM",
    "Event Link": "https://www.meetup.com/bristol-effective-altruism/events/295259263/?isFirstPublish=true",
    "GPS Coordinates": "51.457062,-2.590937"
  },
  {
    "Region": "Europe",
    "Name": "Hamish",
    "Email address": "hamish.todd1@gmail.com",
    "City": "Cambridge, UK",
    "Location description": "Bath House pub, Upstairs",
    "Plus.Code Coordinates": "https://plus.codes/9F426439+J9",
    "Date": "9/9/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "52.204062,0.118438"
  },
  {
    "Region": "Europe",
    "Name": "Anna",
    "Email address": "strmnova@gmail.com",
    "City": "Cardiff, Wales, UK",
    "Location description": "We'll be in the left hand corner inside Henry's Café, near the front window.",
    "Plus.Code Coordinates": "https://plus.codes/9C3RFRMG+53X",
    "Date": "10/3/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "51.482937,-3.174812"
  },
  {
    "Region": "Europe",
    "Name": "Sam",
    "Email address": "acxedinburgh@gmail.com",
    "City": "Edinburgh, Scotland, UK",
    "Location description": "Pleasance Cafe Bar, Pleasance, Edinburgh EH8 9TJ, United Kingdom",
    "Plus.Code Coordinates": "https://plus.codes/9C7RWRX9+49",
    "Date": "9/16/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "55.947812,-3.181563"
  },
  {
    "Region": "Europe",
    "Name": "Leon",
    "Email address": "leon.citrine@gmail.com",
    "City": "Liverpool, UK",
    "Location description": "The Merchant, 40 Slater St, Liverpool L1 4BX. I am a tall man with long hair and a handlebar moustache, I will be wearing a black shirt with the word YES printed on it in gold.",
    "Plus.Code Coordinates": "https://plus.codes/9C5VC229+QR",
    "Date": "10/8/2023",
    "Time": "12:00:00 PM",
    "GPS Coordinates": "53.401937,-2.980437"
  },
  {
    "Region": "Europe",
    "Name": "Edward Saperia",
    "Email address": "ed@newspeak.house",
    "City": "London, UK",
    "Location description": "Newspeak House",
    "Plus.Code Coordinates": "https://plus.codes/9C3XGWGH+3FG",
    "Date": "10/7/2023",
    "Time": "12:00:00 PM",
    "Notes": "https://lu.ma/ACX-London-Oct-2023",
    "GPS Coordinates": "51.525188,-0.071313"
  },
  {
    "Region": "Europe",
    "Name": "Matthew ",
    "Email address": "melkartmtg@hotmail.com",
    "City": "Manchester, Greater Manchester, U.K",
    "Location description": "St John's Gardens, adjacent to the cenotaph. I'll be there bearded man.",
    "Plus.Code Coordinates": "https://plus.codes/9C5VFPHW+5V",
    "Date": "9/16/2023",
    "Time": "10:00:00 AM",
    "Notes": "Meet in quiet park and can move on from there. Will stay until at least 11 for stragglers.",
    "GPS Coordinates": "53.477937,-2.252813"
  },
  {
    "Region": "Europe",
    "Name": "Chris",
    "Email address": "wardle@live.fr",
    "City": "Newcastle/Durham, NE England, UK",
    "Location description": "Newcastle Central Station portico. I'll be wearing a Hawaiian shirt and suit jacket and holding the Astral Codex Ten sign.",
    "Plus.Code Coordinates": "https://plus.codes/9C6WX99M+J3",
    "Date": "10/1/2023",
    "Time": "11:00:00 AM",
    "GPS Coordinates": "54.969062,-1.617313"
  },
  {
    "Region": "Europe",
    "Name": "Sam Brown",
    "Email address": "ssc@sambrown.eu",
    "City": "Oxford, UK",
    "Location description": "The Star, on Rectory Road",
    "Plus.Code Coordinates": "https://plus.codes/9C3WPQX6+QP7",
    "Date": "10/18/2023",
    "Time": "6:30:00 PM",
    "Notes": "Please RSVP on LessWrong so I know how much food to get",
    "GPS Coordinates": "51.749437,-1.238187"
  },
  {
    "Region": "Europe",
    "Name": "Colin",
    "Email address": "czr@rtnl.org.uk",
    "City": "Sheffield, UK",
    "Location description": "200 Degrees, 25 Division St, S1 4GE. I'll have a piece of paper on the table with ACX written on it.",
    "Plus.Code Coordinates": "https://plus.codes/9C5W9GJG+2M",
    "Date": "9/16/2023",
    "Time": "3:00:00 PM",
    "Notes": "I'll be there from 3pm to at least 5pm, and maybe later if other people want to hang out for longer. So feel free to come join at any point.",
    "GPS Coordinates": "53.380063,-1.473313"
  },
  {
    "Region": "North America",
    "Name": "David Piepgrass",
    "Email address": "qwertie256@gmail.com",
    "City": "Calgary, Alberta, Canada",
    "Location description": "Inner City Brewing, 820 11 Ave SW",
    "Plus.Code Coordinates": "https://plus.codes/95372WVC+52C",
    "Date": "9/16/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "51.042938,-114.079937"
  },
  {
    "Region": "North America",
    "Name": "Joseph",
    "Email address": "ta1hynp09@relay.firefox.com",
    "City": "Edmonton, Alberta, Canada",
    "Location description": "Underground Tap & Grill, 10004 Jasper Ave, Edmonton, AB T5J 1R3. We will have an ACX sign - it usually isn't too busy, so we should be easy to find.",
    "Plus.Code Coordinates": "https://plus.codes/9558GGR5+JP",
    "Date": "9/21/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "53.541562,-113.490688"
  },
  {
    "Region": "North America",
    "Name": "Noah MacAulay",
    "Email address": "usernameneeded@gmail.com",
    "City": "Halifax, Nova Scotia, Canada",
    "Location description": "Seven Bays Bouldering",
    "Plus.Code Coordinates": "https://plus.codes/87PRMC29+99",
    "Date": "9/16/2023",
    "Time": "1:00:00 PM",
    "GPS Coordinates": "44.650937,-63.581563"
  },
  {
    "Region": "North America",
    "Name": "Jenn",
    "Email address": "jenn@kwrationality.ca",
    "City": "Kitchener, Ontario, Canada",
    "Location description": "Meeting Room A, Kitchener Public Library Main Branch, 85 Queen St N, Kitchener, ON N2H 2H1",
    "Plus.Code Coordinates": "https://plus.codes/86MXFG37+5F",
    "Date": "9/16/2023",
    "Time": "1:00:00 PM",
    "Notes": "If you're able to, please RSVP at https://www.lesswrong.com/groups/NiM9cQJ5qXqhdmP5p ! ",
    "GPS Coordinates": "43.452938,-80.486312"
  },
  {
    "Region": "North America",
    "Name": "Brett Reynolds",
    "Email address": "brett.reynolds@humber.ca",
    "City": "Mississauga, Ontario, Canada",
    "Location description": "The gazebo in Pheasant Run Park",
    "Plus.Code Coordinates": "https://plus.codes/87M2G8V2+92",
    "Date": "9/10/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "43.543437,-79.699938"
  },
  {
    "Region": "North America",
    "Name": "Henri",
    "Email address": "acxmontreal@gmail.com",
    "City": "Montreal, Quebec, Canada",
    "Location description": "Jeanne-Mance Park, at the corner of Duluth and Esplanade. We'll have an ACX Meetup sign.",
    "Plus.Code Coordinates": "https://plus.codes/87Q8GC89+37",
    "Date": "9/16/2023",
    "Time": "1:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/ngpZH9gA76CyHhrER/acx-meetups-everywhere-fall-2023-montreal-qc",
    "Notes": "Please RSVP on LessWrong: https://www.lesswrong.com/events/ngpZH9gA76CyHhrER/acx-meetups-everywhere-fall-2023-montreal-qc",
    "GPS Coordinates": "45.515187,-73.581812"
  },
  {
    "Region": "North America",
    "Name": "Tess",
    "Email address": "rationalottawa@gmail.com",
    "City": "Ottawa, Ontario, Canada",
    "Location description": "Meeting in the basement of Rosemount Hall at 41 Rosemount Ave, Ottawa, ON K1Y 1P3",
    "Plus.Code Coordinates": "https://plus.codes/87Q6C72F+FR",
    "Date": "9/15/2023",
    "Time": "7:00:00 PM",
    "Notes": "Please RSVP by any of discord, email, facebook, or lesswrong! The meetup is indoors- kids welcome, but no pets, sorry. We'll be providing food at the meetup.",
    "GPS Coordinates": "45.401187,-75.725437"
  },
  {
    "Region": "North America",
    "Name": "Sergey",
    "Email address": "spam04321@gmail.com",
    "City": "Saint John, New Brunswick, Canada",
    "Location description": "McAllister's Place food court, assuming there's anyone interested in coming :) Meeting place is McAllister Place's food court; I will have some kind of a small sign for 'ACX Meetup'. If you're late -- keep in mind that we might move over to a nearby rest areas if that turns to be more  convenient.  If you are thinking about coming, please get in touch via  e-mail and I'll share a phone number so that's easier to find me if  needed. If you're late by more than ~20 minutes, you might want to get  in touch and confirm as we might move.",
    "Plus.Code Coordinates": "https://plus.codes/87QM8X4M+WC",
    "Date": "9/9/2023",
    "Time": "12:00:00 PM",
    "Notes": "Only happens if someone actually confirms they're coming; hopefully it'll be possible to confirm at a later date if this is happening via LessWrong event or something.",
    "GPS Coordinates": "45.307313,-66.016437"
  },
  {
    "Region": "North America",
    "Name": "Sean Aubin",
    "Email address": "seanaubin@gmail.com",
    "City": "Toronto, Ontario, Canada",
    "Location description": "Enter the Mars Atrium via University Avenue entrance. Enter from University Avenue and walk west until you see escalators. Take the escalators down. The food court is to the west of the escalators. If you are lost/confused, ask a security guard to direct you to the food court in the basement. I'll be wearing a bright neon yellow jacket. ",
    "Plus.Code Coordinates": "https://plus.codes/87M2MJ56+XP",
    "Date": "9/10/2023",
    "Time": "2:00:00 PM",
    "Notes": "Please RSVP on LessWrong. ",
    "GPS Coordinates": "43.659937,-79.388188"
  },
  {
    "Region": "North America",
    "Name": "Francisco",
    "Email address": "fagarrido@gmail.com",
    "City": "Mexico City, Mexico",
    "Location description": "Cafebrería El Péndulo, Av Nuevo León 115, Hipódromo, Cuauhtémoc, 06100 Ciudad de México, CDMX",
    "Plus.Code Coordinates": "https://plus.codes/76F2CR6G+6R",
    "Date": "10/14/2023",
    "Time": "4:00:00 PM",
    "Notes": "Please RSVP on LW, so that I can let you know of any potential change of plans.",
    "GPS Coordinates": "19.413562,-99.171937"
  },
  {
    "Region": "North America",
    "Name": "Andrew",
    "Email address": "andrew.d.cutler@gmail.com",
    "City": "Playa Del Carmen, Mexico",
    "Location description": "Aloft Hotel Rooftop Lounge, Calle 34, Avenida 10, Playa Del Carmen, Mexico",
    "Plus.Code Coordinates": "https://plus.codes/76GJJWPJ+3J",
    "Date": "9/25/2023",
    "Time": "7:00:00 PM",
    "Notes": "Please RSVP via email",
    "GPS Coordinates": "20.635188,-87.068438"
  },
  {
    "Region": "North America",
    "Name": "Matthew",
    "Email address": "7o2wzrybd@mozmail.com",
    "City": "Anchorage, Alaska, USA",
    "Location description": "The Writer's Block Bookstore & Cafe, 3956 Spenard Rd, Anchorage, AK 99517. I'll be wearing a green pullover and have a small sign on the table saying ACX MEETUP",
    "Plus.Code Coordinates": "https://plus.codes/93HG53MF+QG",
    "Date": "10/29/2023",
    "Time": "1:00:00 PM",
    "Notes": "Please RSVP using my provided email, so that I know what I should prepare for!",
    "GPS Coordinates": "61.184438,-149.926188"
  },
  {
    "Region": "North America",
    "Name": "Joseph",
    "Email address": "jwpryorprojects@gmail.com",
    "City": "Ann Arbor, Michigan, USA",
    "Location description": "Friends Meeting House, 1420 Hill St., Ann Arbor, MI 48104 , in the back yard. I'll be wearing black and have a white sign that says ACX. ",
    "Plus.Code Coordinates": "https://plus.codes/86JR77C9+PR6",
    "Date": "9/16/2023",
    "Time": "1:00:00 PM",
    "Event Link": "https://www.meetup.com/ann-arbor-ssc-rationalist-meetup-group/events/295618794/",
    "Notes": "Feel free to contact me through the meetup app or by email. We'll also be meeting on Saturday October 21st. We have Monthly Zoom meetups on Thursday evenings!",
    "GPS Coordinates": "42.271812,-83.730438"
  },
  {
    "Region": "North America",
    "Name": "Vicki Williams",
    "Email address": "VickiRWilliams@gmail.com",
    "City": "Asheville, North Carolina",
    "Location description": "Lake Julian Park. We'll try to grab a picnic table near the playground but rsvp for precise update if you don’t want to hunt for the sign.",
    "Plus.Code Coordinates": "https://plus.codes/867VFFJ6+2G5",
    "Date": "9/16/2023",
    "Time": "11:00:00 AM",
    "Notes": "Please rsvp so I can update on our exact location and in case we need to reschedule for weather.",
    "GPS Coordinates": "35.480063,-82.538687"
  },
  {
    "Region": "North America",
    "Name": "Steve French",
    "Email address": "steve@digitaltoolfactory.net",
    "City": "Atlanta, Georgia, USA",
    "Location description": "1737 Ellsworth Industrial Blvd NW, Atlanta, GA 30318, USA. We will be in the breezeway in the front.",
    "Plus.Code Coordinates": "https://plus.codes/865QRH2F+V96",
    "Date": "9/16/2023",
    "Time": "2:00:00 PM",
    "Notes": "Please RSVP on LessWrong or Meetup.com",
    "GPS Coordinates": "33.802188,-84.426563"
  },
  {
    "Region": "North America",
    "Name": "Silas Barta",
    "Email address": "sbarta@gmail.com",
    "City": "Austin, Texas, USA",
    "Location description": "Park area near stone tables behind Central Market at 4001 N. Lamar Blvd",
    "Plus.Code Coordinates": "https://plus.codes/86248746+9C",
    "Date": "9/30/2023",
    "Time": "12:00:00 PM",
    "Notes": "Feel free to bring kids/dogs. We will have tents set up for shade and provide food.",
    "GPS Coordinates": "30.305937,-97.738937"
  },
  {
    "Region": "North America",
    "Name": "Rivka",
    "Email address": "rivka@adrusi.com",
    "City": "Baltimore, Maryland, USA",
    "Location description": "UMBC outside of the Performing Arts and Humanities Building, on the north side. I will have a sign that says ACX meetup. Parking is free on the weekends. If it’s raining, we will be inside of the Performing Arts building, on the ground floor just inside the entrance.",
    "Plus.Code Coordinates": "https://plus.codes/87F5774P+53",
    "Date": "9/24/2023",
    "Time": "7:00:00 PM",
    "Notes": "There will be snacks and drinks",
    "GPS Coordinates": "39.255437,-76.714813"
  },
  {
    "Region": "North America",
    "Name": "Alex",
    "Email address": "bellinghamrationalish@gmail.com",
    "City": "Bellingham, Washington, USA",
    "Location description": "Elizabeth Station. We'll have a paper sign that says Bellingham Rationalish on it.",
    "Plus.Code Coordinates": "https://plus.codes/84WVQG45+WQ",
    "Date": "9/20/2023",
    "Time": "5:30:00 PM",
    "Notes": "Please RSVP on Meetup so we have an idea of how many people to expect (so we can grab enough table space).",
    "GPS Coordinates": "48.757312,-122.490562"
  },
  {
    "Region": "North America",
    "Name": "Scott and Skyler",
    "Email address": "skyler@rationalitymeetups.org",
    "City": "Berkeley, California, USA",
    "Location description": "Rose Garden Inn",
    "Plus.Code Coordinates": "https://plus.codes/849VVP5R+X5",
    "Date": "10/21/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "37.859938,-122.259563"
  },
  {
    "Region": "North America",
    "Name": "Skyler and Dan",
    "Email address": "skyler@rationalitymeetups.org",
    "City": "Boston and Cambridge, Massachusetts, USA",
    "Location description": "JFK Memorial Park, Cambridge",
    "Plus.Code Coordinates": "https://plus.codes/87JC9VCG+8W",
    "Date": "9/3/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "42.370812,-71.122687"
  },
  {
    "Region": "North America",
    "Name": "Josh Sacks",
    "Email address": "josh.sacks+acx@gmail.com",
    "City": "Boulder, Colorado, USA",
    "Location description": "9191 Tahoe Ln, Boulder, CO 80301",
    "Plus.Code Coordinates": "https://plus.codes/85GP2V96+JR",
    "Date": "9/27/2023",
    "Time": "3:00:00 PM",
    "Event Link": "https://www.lesswrong.com/posts/oC4DJsGTcxMBRE8Ej/acx-ssc-boulder-meetup-september-23",
    "Notes": "Please RSVP on LessWrong so we have a rough guest count!",
    "GPS Coordinates": "40.019063,-105.137937"
  },
  {
    "Region": "North America",
    "Name": "Skyler and Dan",
    "Email address": "skyler@rationalitymeetups.org",
    "City": "Burlington, Vermont, USA",
    "Location description": "In the Oakledge park. I’ll be wearing a tall blue and green hat.",
    "Plus.Code Coordinates": "https://plus.codes/87P8FQ4F+5C",
    "Date": "9/10/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "44.455438,-73.226438"
  },
  {
    "Region": "North America",
    "Name": "Nick",
    "Email address": "naj@njarboe.com",
    "City": "Carbondale, Colorado, USA",
    "Location description": "Sopris Park, Main picnic table area",
    "Plus.Code Coordinates": "https://plus.codes/85FJ9QXP+QM",
    "Date": "9/20/2023",
    "Time": "6:00:00 PM",
    "Notes": "An RSVP is helpful but please come even if you haven’t. Kids are great.",
    "GPS Coordinates": "39.399438,-107.213313"
  },
  {
    "Region": "North America",
    "Name": "Joe",
    "Email address": "joe@cavendishlabs.org",
    "City": "Cavendish, Vermont, USA",
    "Location description": "We'll be by the Phineas Gage Monument in the center of town in Cavendish",
    "Plus.Code Coordinates": "https://plus.codes/87M999JR+WVM",
    "Date": "9/9/2023",
    "Time": "4:00:00 PM",
    "GPS Coordinates": "43.382312,-72.607813"
  },
  {
    "Region": "North America",
    "Name": "Ryan",
    "Email address": "ryan.matera1@gmail.com",
    "City": "Charleston, West Virginia, USA",
    "Location description": "Slack Plaza, by the waterfall",
    "Plus.Code Coordinates": "https://plus.codes/86CW9928+M2F",
    "Date": "9/10/2023",
    "Time": "1:00:00 PM",
    "GPS Coordinates": "38.351687,-81.634938"
  },
  {
    "Region": "North America",
    "Name": "Cat",
    "Email address": "cat.esposito@gmail.com",
    "City": "Charlotte, North Carolina, USA",
    "Location description": "Free Range Brewing - 2320 N. Davidson St., Charlotte, NC. I'll be in the outdoor seating section that is in front of the residential apartment buildings and will have an ACX MEETUP sign with me.",
    "Plus.Code Coordinates": "https://plus.codes/867X65RP+6P",
    "Date": "10/10/2023",
    "Time": "6:30:00 PM",
    "Notes": "It's a brewery that typically serves food on Tuesday nights.",
    "GPS Coordinates": "35.240562,-80.813187"
  },
  {
    "Region": "North America",
    "Name": "Ryan",
    "Email address": "effectivealtruismatuva@gmail.com",
    "City": "Charlottesville, Virginia, USA",
    "Location description": "12 Rotunda Drive Charlottesville, VA 22903 - We’ll meet at the picnic tables across the street from The Virginian. There will be an ACX sign.",
    "Plus.Code Coordinates": "https://plus.codes/87C32FPX+3H4",
    "Date": "9/23/2023",
    "Time": "5:00:00 PM",
    "GPS Coordinates": "38.035187,-78.501063"
  },
  {
    "Region": "North America",
    "Name": "Todd",
    "Email address": "info@chicagorationality.com",
    "City": "Chicago, Illinois, USA",
    "Location description": "Grant Park on the north side Balbo just east of the tracks",
    "Plus.Code Coordinates": "https://plus.codes/86HJV9FH+96",
    "Date": "9/9/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "41.873438,-87.621938"
  },
  {
    "Region": "North America",
    "Name": "Alex Smith",
    "Email address": "acsmith818@gmail.com",
    "City": "Cincinnati, Ohio, USA",
    "Location description": "Bean and Barley, 2005 Madison Road",
    "Plus.Code Coordinates": "https://plus.codes/86FQ4GJP+QW",
    "Date": "10/22/2023",
    "Time": "2:00:00 PM",
    "Notes": "I've hosted various meetings of other kinds here, so I imagine it'll be fine. I'll call first to confirm. If they tell me no for some reason, I'll put it somewhere else in Cincinnati. There are plenty of good places.",
    "GPS Coordinates": "39.131937,-84.462688"
  },
  {
    "Region": "North America",
    "Name": "Andrew",
    "Email address": "ajl161@case.edu",
    "City": "Cleveland, Ohio, USA",
    "Location description": "Nano brew Cleveland- 1859 W 25th St, Cleveland, OH 44113",
    "Plus.Code Coordinates": "https://plus.codes/86HWF7PW+C5",
    "Date": "9/17/2023",
    "Time": "3:00:00 PM",
    "Notes": "Can bring dogs",
    "GPS Coordinates": "41.486063,-81.704562"
  },
  {
    "Region": "North America",
    "Name": "Dan Moller",
    "Email address": "dmoller@umd.edu",
    "City": "College Park, Maryland, USA",
    "Location description": "Steps in front of McKeldin library, UMD campus. Visitor parking by Skinner Building. In case of rain, front of Skinner Building. ",
    "Plus.Code Coordinates": "https://plus.codes/87C5X3P4+97",
    "Date": "9/16/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "38.985937,-76.944312"
  },
  {
    "Region": "North America",
    "Name": "Michael Frost",
    "Email address": "mikefrosttx@gmail.com",
    "City": "College Station, Texas, USA",
    "Location description": "On the outside porch at Torchy’s at 1037 Texas Ave South. I will have a sign that says ACX meetup.",
    "Plus.Code Coordinates": "https://plus.codes/8625JMFC+5J9",
    "Date": "10/21/2023",
    "Time": "7:00:00 PM",
    "Notes": "Please RSVP on LessWrong so that I know how many people are coming or shoot me an email! Students and adults welcome.",
    "GPS Coordinates": "30.622937,-96.328438"
  },
  {
    "Region": "North America",
    "Name": "Russell",
    "Email address": "russell.emmer@gmail.com",
    "City": "Columbus, Ohio, USA",
    "Location description": "Clifton Park Shelterhouse, Jeffrey Park, Bexley. We will be at one of the tables with an ACX sign.",
    "Plus.Code Coordinates": "https://plus.codes/86FVX3C3+QF",
    "Date": "9/10/2023",
    "Time": "3:00:00 PM",
    "Notes": "Please send an email if you'd like to join our mailing list for future invitations.",
    "GPS Coordinates": "39.971937,-82.946313"
  },
  {
    "Region": "North America",
    "Name": "Kenan S.",
    "Email address": "kbitikofer@gmail.com",
    "City": "Corvallis, Oregon, USA",
    "Location description": "Common Fields (outdoor food truck court). We'll aim for the southeast corner.",
    "Plus.Code Coordinates": "https://plus.codes/84PRHP5P+RR6",
    "Date": "9/9/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "44.559562,-123.262937"
  },
  {
    "Region": "North America",
    "Name": "Ethan",
    "Email address": "ethan.morse97@gmail.com",
    "City": "Dallas, Texas, USA",
    "Location description": "We will be in the Whole Foods' upstairs seating area in the room closest to the windows/parking lot.",
    "Plus.Code Coordinates": "https://plus.codes/8645W55W+2JM",
    "Date": "10/8/2023",
    "Time": "1:00:00 PM",
    "GPS Coordinates": "32.907562,-96.803438"
  },
  {
    "Region": "North America",
    "Name": "Arjun Singh",
    "Email address": "arjunsingh8797@gmail.com",
    "City": "Davis, California, USA",
    "Location description": "John Natsoulas Gallery, 521 1st St, Davis, CA 95616. We'll meet on the roof of the gallery, which is accessible by stairs and elevator. The space isn't very large, so there shouldn't be much opportunity for confusion, and I plan to greet everyone as they enter!",
    "Plus.Code Coordinates": "https://plus.codes/84CWG7R5+VJ",
    "Date": "10/7/2023",
    "Time": "1:00:00 PM",
    "Notes": "Please feel free to bring anyone who may be interested in meeting new people, chatting, and playing social deduction board games like Avalon, Secret Hitler, Coup, etc. Dogs likely aren't allowed into the gallery, but children are absolutely fine!",
    "GPS Coordinates": "38.542187,-121.740938"
  },
  {
    "Region": "North America",
    "Name": "Eneasz Brodski",
    "Email address": "embrodski@gmail.com",
    "City": "Denver, Colorado, USA",
    "Location description": "Sloan's Lake, near the North Bicycle Parking Lot. We'll be a little past the old stone building, at a picnic table, with a blue shade-structure set up over it. It will have a white large board leaning against it with ACX MEETUP written on it.",
    "Plus.Code Coordinates": "https://plus.codes/85FPQX22+RM",
    "Date": "9/17/2023",
    "Time": "3:00:00 PM",
    "Notes": "There will be BBQ food and snacks available, including some vegan hot dogs. Feel free to bring kids.",
    "GPS Coordinates": "39.752063,-105.048312"
  },
  {
    "Region": "North America",
    "Name": "Logan",
    "Email address": "logan.the.word@gmail.com",
    "City": "Durham, North Carolina, USA",
    "Location description": "Ponysaurus Brewing Co (219 Hood Street, Durham, NC 27701)",
    "Plus.Code Coordinates": "https://plus.codes/8773X4Q4+Q2C",
    "Date": "9/23/2023",
    "Time": "1:00:00 PM",
    "Notes": "Feel free to say hello at the RTLW google group [RTLW@googlegroups.com]",
    "GPS Coordinates": "35.989438,-78.894937"
  },
  {
    "Region": "North America",
    "Name": "SP",
    "Email address": "spatelcuhsd@gmail.com",
    "City": "El Centro, California, U.S.A",
    "Location description": "Bucklin Park, El Centro, California. I'll be at the pond by the playground with a sign with ACX on it.",
    "Plus.Code Coordinates": "https://plus.codes/8546QCHP+GF4",
    "Date": "10/29/2023",
    "Time": "8:30:00 AM",
    "Notes": "Please RSVP by emailing me by October 26th",
    "GPS Coordinates": "32.778763,-115.563797"
  },
  {
    "Region": "North America",
    "Name": "Ben Smith",
    "Email address": "benjsmith@gmail.com",
    "City": "Eugene, Oregon, USA",
    "Location description": "Beergarden. we'll have a large silver cuboid balloon with an EA logo.",
    "Plus.Code Coordinates": "https://plus.codes/84PR3V3W+C7",
    "Date": "9/20/2023",
    "Time": "6:00:00 PM",
    "GPS Coordinates": "44.053562,-123.104312"
  },
  {
    "Region": "North America",
    "Name": "Antanas",
    "Email address": "antanasriskus27@gmail.com",
    "City": "Fayetteville, Arkansas, USA",
    "Location description": "Wilson Park",
    "Plus.Code Coordinates": "https://plus.codes/86873RFQ+9M",
    "Date": "9/21/2023",
    "Time": "6:30:00 PM",
    "GPS Coordinates": "36.073437,-94.160812"
  },
  {
    "Region": "North America",
    "Name": "Britt",
    "Email address": "miamiacx@gmail.com",
    "City": "Fort Lauderdale, Florida, USA",
    "Location description": "501 SE 17th Street, Fort Lauderdale, FL, USA. Whole Foods Market inside seating area. There should be no cost to park in the Whole Foods Parking Garage. Once inside, go down the escalator and walk through the grocery store towards the checkout lanes. We will be in the seating area right past the self-checkout stations on the south end of the building. Look for a table with an ACX MEETUP sign.",
    "Plus.Code Coordinates": " https://plus.codes/76RX4V26+5W",
    "Date": "9/24/2023",
    "Time": "5:00:00 PM",
    "Notes": "Hosted by the local ACX group that does meetups throughout south Florida, including Palm Beach, Broward, and Miami-Dade counties. Come join our Discord!",
    "GPS Coordinates": "26.100437,-80.137687"
  },
  {
    "Region": "North America",
    "Name": "Max Harms",
    "Email address": "Raelifin@gmail.com",
    "City": "Grass Valley, California, USA",
    "Location description": "18154 Justice Ct. (It's a residence at the end of a long, mostly-dirt road.)",
    "Plus.Code Coordinates": "https://plus.codes/84FX5235+WRW",
    "Date": "9/9/2023",
    "Time": "2:00:00 PM",
    "Notes": "Please RSVP on LessWrong or email the organizer at raelifin@gmail.com if you're planning to come.",
    "GPS Coordinates": "39.154812,-120.990437"
  },
  {
    "Region": "North America",
    "Name": "Christian",
    "Email address": "christian@metaculus.com",
    "City": "Gulf Breeze, Florida, USA",
    "Location description": "Perfect Plain Brewing",
    "Plus.Code Coordinates": "https://plus.codes/862JCQ7P+9C",
    "Date": "10/18/2023",
    "Time": "8:00:00 PM",
    "Notes": "Please email me if you'll make it. Would love to chat. If there are no takers, I won't be there. ",
    "GPS Coordinates": "30.413438,-87.213938"
  },
  {
    "Region": "North America",
    "Name": "Phil Persing",
    "Email address": "acxharrisburg@gmail.com",
    "City": "Harrisburg, Pennsylvania, USA",
    "Location description": "Millworks - 340 Verbeke St, Harrisburg, PA 17102. We'll plan to be on the rooftop biergarten if the weather is suitable, or inside downstairs otherwise. Look for the ACX Meetup sign on the table.",
    "Plus.Code Coordinates": "https://plus.codes/87G574C6+7X9",
    "Date": "9/9/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "40.270688,-76.887563"
  },
  {
    "Region": "North America",
    "Name": "Dawson",
    "Email address": "dawson.beatty@gmail.com",
    "City": "Hartford, Connecticut, USA",
    "Location description": "Tisane Euro-Asian Cafe, 537 Farmington Ave, Hartford, CT 06105",
    "Plus.Code Coordinates": "https://plus.codes/87H9Q78Q+CX",
    "Date": "9/23/2023",
    "Time": "10:00:00 AM",
    "GPS Coordinates": "41.766063,-72.710063"
  },
  {
    "Region": "North America",
    "Name": "Joe Brenton",
    "Email address": "joe.brenton@yahoo.com",
    "City": "Houston, Texas, USA",
    "Location description": "711 Milby St, Houston, TX 77023. Segundo Coffee Lab, inside the IRONWORKS through the big orange door, look for the ACX MEETUP sign at the entrance",
    "Plus.Code Coordinates": "https://plus.codes/76X6PMV6+V6",
    "Date": "10/8/2023",
    "Time": "1:00:00 PM",
    "GPS Coordinates": "29.744687,-95.339438"
  },
  {
    "Region": "North America",
    "Name": "Mike",
    "Email address": "mjhouse@protonmail.com",
    "City": "Huntsville, Alabama, USA",
    "Location description": "300 The Bridge St, Huntsville, AL 35806. We will be in the cafe with a whiteboard that says ACX Meetup",
    "Plus.Code Coordinates": "https://plus.codes/866MP88G+4V",
    "Date": "10/14/2023",
    "Time": "5:00:00 PM",
    "Notes": "I don't think they allow animals except for service dogs.",
    "GPS Coordinates": "34.715312,-86.672813"
  },
  {
    "Region": "North America",
    "Name": "Joseph",
    "Email address": "jwpryorprojects@gmail.com",
    "City": "Jackson, Michigan, USA",
    "Location description": "325 Carr Street, Jackson Mi 49201. The house is green with a fire hydrant in the front yard. The driveway is shared with my neighbor so please park on the street.",
    "Plus.Code Coordinates": "https://plus.codes/86JQ7H2H+96",
    "Date": "9/23/2023",
    "Time": "3:00:00 PM",
    "Notes": "Please rsvp by email. I organize the Ann Arbor meetups but I live in Jackson, looking to see if there's anyone interested in a Jackson meetup as well! I'll have some snacks and drinks. Unless the weather is bad we'll hang out in the back yard and have a small fire. Bring your favorite camping chair.",
    "GPS Coordinates": "42.250937,-84.421937"
  },
  {
    "Region": "North America",
    "Name": "George H",
    "Email address": "ggherold@gmail.com",
    "City": "Java Village/Buffalo, New York, USA",
    "Location description": "932 Welch Rd. Java Center NY 14082",
    "Plus.Code Coordinates": "https://plus.codes/87J3MH9P+X5",
    "Date": "9/10/2023",
    "Time": "1:00:00 PM",
    "GPS Coordinates": "42.669938,-78.414563"
  },
  {
    "Region": "North America",
    "Name": "Alex Hedtke",
    "Email address": "alex.hedtke@gmail.com",
    "City": "Kansas City, Missouri, USA",
    "Location description": "Minsky's Pizza: 427 Main St, Kansas City, MO 64105 (we will be in the upstairs conference room, tell the hostess you are here for the conference room meeting)",
    "Plus.Code Coordinates": "https://plus.codes/86F74C58+CW",
    "Date": "10/27/2023",
    "Time": "6:30:00 PM",
    "Notes": "Please RSVP at: https://www.meetup.com/kc_rat_ea/events/295571893/",
    "GPS Coordinates": "39.108563,-94.582687"
  },
  {
    "Region": "North America",
    "Name": "Dan Uebele",
    "Email address": "daniel@westsalemtool.com",
    "City": "La Crosse, Wisconsin, USA",
    "Location description": "The Turtle Stack Brewery @ 125 2nd St S, La Crosse, WI 54601",
    "Plus.Code Coordinates": "https://plus.codes/86MCRP7W+28",
    "Date": "9/9/2023",
    "Time": "2:00:00 PM",
    "Notes": "No need to drink, even though it's a brewery, it just has good ambiance. Please RSVP on Meetup.com, because then the app will ding me and I'll know someone is coming. Search for Rationality La Crosse.",
    "GPS Coordinates": "43.812562,-91.254188"
  },
  {
    "Region": "North America",
    "Name": "Jonathan Ray",
    "Email address": "Ray.Jonathan.W@gmail.com",
    "City": "Las Vegas, Nevada, USA",
    "Location description": "At Little Avalon with an ACX sign",
    "Plus.Code Coordinates": "https://plus.codes/85864MWX+PJ",
    "Date": "9/24/2023",
    "Time": "12:00:00 PM",
    "Notes": "We use discord for all meetup announcements and communications: https://discord.gg/9rgzTgeHC8",
    "GPS Coordinates": "36.146812,-115.300938"
  },
  {
    "Region": "North America",
    "Name": "J Ladner",
    "Email address": "jladner20vpa@gmail.com",
    "City": "Logan, Utah, USA",
    "Location description": "Picnic tables on the north side of Adams Park. I will be wearing a cowboy hat.",
    "Plus.Code Coordinates": "https://plus.codes/85HCP5RH+P4",
    "Date": "9/23/2023",
    "Time": "4:00:00 PM",
    "Notes": "I'll bring a few games.",
    "GPS Coordinates": "41.741813,-111.822187"
  },
  {
    "Region": "North America",
    "Name": "Vishal",
    "Email address": "Direct questions to Vishal on the LAR discord. Invite here: https://discord.gg/",
    "City": "Los Angeles, California, USA",
    "Location description": "11841 Wagner Street Culver City",
    "Plus.Code Coordinates": "https://plus.codes/8553XHWM+GP",
    "Date": "9/13/2023",
    "Time": "6:30:00 PM",
    "Notes": "Please RSVP on LessWrong (not mandatory however): https://www.lesswrong.com/events/PqKq5qKLt5Rvvo5Yg/los-angeles-ca-acx-autumn-meetups-everywhere-2023-lw-acx. Direct questions to Vishal on the LAR discord. Invite here: https://discord.gg/TaYjsvN",
    "GPS Coordinates": "33.996313,-118.415688"
  },
  {
    "Region": "North America",
    "Name": "Gordon",
    "Email address": "gojoelder@gmail.com",
    "City": "Lubbock, Texas, USA",
    "Location description": "Sugar Browns Coffee",
    "Plus.Code Coordinates": "https://plus.codes/855WG393+M73",
    "Date": "9/17/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "33.519188,-101.946812"
  },
  {
    "Region": "North America",
    "Name": "Sidney",
    "Email address": "sidneyparham@gmail.com",
    "City": "Madison, Wisconsin, USA",
    "Location description": "Hugel Park - 5902 Williamsburg Way, at the picnic shelter",
    "Plus.Code Coordinates": "https://plus.codes/86MG2GF8+J5",
    "Date": "9/30/2023",
    "Time": "12:00:00 PM",
    "GPS Coordinates": "43.024062,-89.484562"
  },
  {
    "Region": "North America",
    "Name": "Robi Rahman",
    "Email address": "robirahman94@gmail.com",
    "City": "Manhattan, New York, USA",
    "Location description": "Pumphouse Park",
    "Plus.Code Coordinates": "https://plus.codes/87G7PX6M+RG",
    "Date": "9/24/2023",
    "Time": "4:00:00 PM",
    "GPS Coordinates": "40.712063,-74.016188"
  },
  {
    "Region": "North America",
    "Name": "Gabe",
    "Email address": "gabeaweil@gmail.com",
    "City": "Massapequa (Long Island), New York, USA",
    "Location description": "47 clinton pl., Massapequa NY, 11758",
    "Plus.Code Coordinates": "https://plus.codes/87G8MG4F+3W",
    "Date": "10/13/2023",
    "Time": "7:00:00 PM",
    "Notes": "Please RSVP via email so I know how much food to get.",
    "GPS Coordinates": "40.655187,-73.475188"
  },
  {
    "Region": "North America",
    "Name": "Michael",
    "Email address": "michael@postlibertarian.com",
    "City": "Memphis, Tennessee, USA",
    "Location description": "French Truck Coffee, Crosstown Concourse, Central Atrium, 1350 Concourse Ave #167, Memphis, TN 38104. We'll be at a table in front of French Truck Coffee with an ACX MEETUP sign on it.",
    "Plus.Code Coordinates": "https://plus.codes/867F5X2P+QJJ",
    "Date": "9/9/2023",
    "Time": "1:30:00 PM",
    "GPS Coordinates": "35.151938,-90.013437"
  },
  {
    "Region": "North America",
    "Name": "Pedro",
    "Email address": "pedroakroeff@gmail.com",
    "City": "Miami, Florida, USA",
    "Location description": "Margaret Pace Park in Edgewater, northeast corner on the benches overlooking the bay",
    "Plus.Code Coordinates": "https://plus.codes/76QXQRW7+7M",
    "Date": "10/5/2023",
    "Time": "6:30:00 PM",
    "GPS Coordinates": "25.795687,-80.185812"
  },
  {
    "Region": "North America",
    "Name": "Timothy M.",
    "Email address": "tmbond@gmail.com",
    "City": "Minneapolis, Minnesota, USA",
    "Location description": "Meet at Sisters' Sludge Coffee Cafe and Wine Bar. I will be wearing a Wall Drug souvenir shirt with a Jackalope being abducted by a UFO.",
    "Plus.Code Coordinates": "https://plus.codes/86P8WQM6+P9",
    "Date": "9/16/2023",
    "Time": "1:00:00 PM",
    "Notes": "Make sure to RSVP on LessWrong -  https://www.lesswrong.com/events/6xBdodMhyYMTGonG4/acx-meetup-september-2023 - so I can give a headcount to the Sisters. Also, they don't charge me for a large reservation but they do ask that everybody who attends purchase something - if you prefer I will buy you something, no questions asked.",
    "GPS Coordinates": "44.934313,-93.239063"
  },
  {
    "Region": "North America",
    "Name": "Blake",
    "Email address": "blake@bertuccelli-booth.org",
    "City": "New Orleans, Louisiana, USA",
    "Location description": "Hey! Cafe on the corner of General Pershing and Derbingy.",
    "Plus.Code Coordinates": "https://plus.codes/76XFWVRX+G2",
    "Date": "9/9/2023",
    "Time": "11:11:00 AM",
    "Notes": "Text/Signal/WhatsApp me (Blake) at +1 504 377 3650 or email 1111@philosophers.group ... Happy to answer any questions.",
    "GPS Coordinates": "29.941313,-90.102438"
  },
  {
    "Region": "North America",
    "Name": "Michael Michalchik",
    "Email address": "michaelmichalchik@gmail.com",
    "City": "Newport Beach, California, USA",
    "Location description": "We usually start in the front patio of my yard at 1970 port Laurent and weather permitting go for a walk in the park and the surround wild areas.",
    "Plus.Code Coordinates": "https://plus.codes/8554J47R+Q8",
    "Date": "9/2/2023",
    "Time": "2:00:00 PM",
    "Notes": "This meeting repeats most Saturdays year around. Email me with the subject line ACXLW to be added to the mailing list.",
    "GPS Coordinates": "33.614438,-117.859188"
  },
  {
    "Region": "North America",
    "Name": "duck_master",
    "Email address": "duckmaster0@protonmail.com",
    "City": "Newton, Massachusetts, USA",
    "Location description": "Newton Centre Green at 1221 Centre St, Newton, MA, USA",
    "Plus.Code Coordinates": "https://plus.codes/87JC8RJ4+76",
    "Date": "9/9/2023",
    "Time": "12:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/fMcxBfAimukmqpAzB/2023-acx-meetups-everywhere-newton-ma",
    "Notes": "If I run this it'll be totally open-ended (I'm planning ~12pm to ~2pm, but can totally go to any time). Also open beyond the rat community proper (I'll welcome postrats, alignment researchers, predictors, effective altruists, and rationalists).",
    "GPS Coordinates": "42.330687,-71.194438"
  },
  {
    "Region": "North America",
    "Name": "Willa",
    "Email address": "walambert@pm.me",
    "City": "Norfolk, Virginia, USA",
    "Location description": "Fair Grounds (cafe), we'll aim to be at the big round table to the right of the  ordering counter. Address: 806 Baldwin Ave # 2, Norfolk, VA 23517",
    "Plus.Code Coordinates": "https://plus.codes/8785VP82+XH",
    "Date": "10/1/2023",
    "Time": "9:00:00 AM",
    "Notes": "Please RSVP on LessWrong or email me, walambert@pm.me. ",
    "GPS Coordinates": "36.867438,-76.298563"
  },
  {
    "Region": "North America",
    "Name": "Alex Liebowitz",
    "Email address": "alex@alexliebowitz.com",
    "City": "Northampton, Massachusetts, USA",
    "Location description": "Packard's (we have the Library Room in the back reserved), 14 Masonic St., Northampton, MA 01060",
    "Plus.Code Coordinates": "https://plus.codes/87J98998+7M",
    "Date": "9/2/2023",
    "Time": "6:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/Zxd2Sa4HaeESZWHXD/northampton-ma-acx-meetup-meetups-everywhere-fall-2023",
    "Notes": "We're meeting in the Library Room in the way back of Packard's (we have it reserved). This has been one of our go-to meeting spots in the past and it works pretty well.",
    "GPS Coordinates": "42.318188,-72.633313"
  },
  {
    "Region": "North America",
    "Name": "Wes",
    "Email address": "rationalphilly@gmail.com",
    "City": "Philadelphia, Pennslyvania, USA",
    "Location description": "Ethical Society of Philadelphia, 1906 Rittenhouse Square",
    "Plus.Code Coordinates": "https://plus.codes/87F6WRXG+FQ",
    "Date": "9/25/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "39.948687,-75.173063"
  },
  {
    "Region": "North America",
    "Name": "Nathan",
    "Email address": "natoboo2000@gmail.com",
    "City": "Phoenix, Arizona, USA",
    "Location description": "Meeting at the picnic tables near the playground, I'll put up an ACX MEETUP sign and be wearing a funny hat you can't miss. ",
    "Plus.Code Coordinates": "https://plus.codes/8559FWG5+9V9",
    "Date": "9/30/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "33.475938,-112.090312"
  },
  {
    "Region": "North America",
    "Name": "Justin",
    "Email address": "pghacx@gmail.com",
    "City": "Pittsburgh, Pennsylvania, USA",
    "Location description": "DEFAULT OUTDOOR MEETING LOCATION: Mellon Park (the portion SOUTH of Fifth Ave, and WEST of Beechwood Blvd). Look for us at the Rose Garden picnic tables, or the benches just outside the Rose Garden.",
    "Plus.Code Coordinates": "https://plus.codes/87G2F32J+QX",
    "Date": "9/16/2023",
    "Time": "2:00:00 PM",
    "Notes": "INDOOR CONTINGENCY OPTION: In the event of rain, we will instead meet at City Kitchen at Bakery Square, which is a short walk from Melon Park. (City Kitchen has two levels, so be sure to check upstairs if you can't find us.) If we shift meeting locations, Justin will send an email update >2 hours before the scheduled meetup time, as well as a follow-up email with the table number once we have arrived and claimed a space; please contact pghacx@gmail.com if you would like to be added to the email list in advance.",
    "GPS Coordinates": "40.451937,-79.917563"
  },
  {
    "Region": "North America",
    "Name": "Sam Celarek",
    "Email address": "scelarek@gmail.com",
    "City": "Portland, Oregon, USA",
    "Location description": "1548 NE 15th Ave - There will be a large PEAR sign outside of the meetup area! ",
    "Plus.Code Coordinates": "https://plus.codes/84QVG8MX+JV",
    "Date": "9/9/2023",
    "Time": "5:00:00 PM",
    "Notes": "Please RSVP on our meetup site! ",
    "GPS Coordinates": "45.534063,-122.650312"
  },
  {
    "Region": "North America",
    "Name": "Danny Kumpf",
    "Email address": "dskumpf@gmail.com",
    "City": "Princeton, New Jersey, USA",
    "Location description": "Palmer square, by the picnic tables near the large pine tree. I'll have an ACX MEETUP sign.",
    "Plus.Code Coordinates": "https://plus.codes/87G7982Q+2C2",
    "Date": "9/21/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "40.350062,-74.661438"
  },
  {
    "Region": "North America",
    "Name": "Surendar",
    "Email address": "surendargoud@gmail.com",
    "City": "Redmond, Washington, USA",
    "Location description": "18651 NE 61st Ct",
    "Plus.Code Coordinates": "https://plus.codes/84VVMW65+C5",
    "Date": "10/13/2023",
    "Time": "6:00:00 PM",
    "GPS Coordinates": "47.661062,-122.092062"
  },
  {
    "Region": "North America",
    "Name": "Ella",
    "Email address": "ellahoeppner@gmail.com",
    "City": "Richmond, Virginia, USA",
    "Location description": "Whole Foods at 2024 W Broad St, Richmond, VA 23220, second floor cafe area",
    "Plus.Code Coordinates": "https://plus.codes/8794HG5Q+7G",
    "Date": "9/17/2023",
    "Time": "4:00:00 PM",
    "GPS Coordinates": "37.558188,-77.461188"
  },
  {
    "Region": "North America",
    "Name": "Jens",
    "Email address": "jensfiederer@gmail.com",
    "City": "Rochester, New York, USA",
    "Location description": "Spot Coffee",
    "Plus.Code Coordinates": "https://plus.codes/87M45C42+H9",
    "Date": "10/14/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "43.156437,-77.599063"
  },
  {
    "Region": "North America",
    "Name": "Willsen from Sacramento",
    "Email address": "nightfall9@gmail.com",
    "City": "Sacramento, California, USA",
    "Location description": "Backyard of private residence at 23rd and W St, in Midtown",
    "Plus.Code Coordinates": "https://plus.codes/84CWHG69+M2",
    "Date": "10/29/2023",
    "Time": "3:00:00 PM",
    "Notes": "Email me for the specific address, it's easy to find",
    "GPS Coordinates": "38.561688,-121.482438"
  },
  {
    "Region": "North America",
    "Name": "Adam ",
    "Email address": "adam.r.isom@gmail.com",
    "City": "Salt Lake City, Utah, USA",
    "Location description": "Liberty Park, west side, just north of Chargepoint Station",
    "Plus.Code Coordinates": "https://plus.codes/85GCP4WF+VJ",
    "Date": "10/14/2023",
    "Time": "3:00:00 PM",
    "GPS Coordinates": "40.747187,-111.875937"
  },
  {
    "Region": "North America",
    "Name": "Alexander",
    "Email address": "alexander@sferrella.com",
    "City": "San Antonio, Texas, USA",
    "Location description": "Elsewhere Bar and Grill",
    "Plus.Code Coordinates": "https://plus.codes/76X3CGP9+JJ",
    "Date": "9/16/2023",
    "Time": "12:00:00 PM",
    "Notes": "I will be wearing a black cowboy hat",
    "GPS Coordinates": "29.436563,-98.480937"
  },
  {
    "Region": "North America",
    "Name": "Julius",
    "Email address": "julius.simonelli@gmail.com",
    "City": "San Diego, California, USA",
    "Location description": "Bird Park",
    "Plus.Code Coordinates": "https://plus.codes/8544PVQ8+P6",
    "Date": "9/2/2023",
    "Time": "1:00:00 PM",
    "Notes": "We'll have an ACX sign and I'll be wearing a red shirt.",
    "GPS Coordinates": "32.739312,-117.134438"
  },
  {
    "Region": "North America",
    "Name": "Jill & Daniel",
    "Email address": "jill.dma@gmail.com",
    "City": "San Francisco, California, USA",
    "Location description": "The giant wooden bench overlooking the city right outside Cafe Josephine, by the Randall Museum in Corona Heights Park. We'll bring an ACX sign.",
    "Plus.Code Coordinates": "https://plus.codes/849VQH76+PWW",
    "Date": "9/16/2023",
    "Time": "10:00:00 AM",
    "Notes": "Kids and dogs are very welcome. Great bathrooms, café, and children's museum on premises. Also tree shade and stunning view of the city.",
    "GPS Coordinates": "37.764313,-122.437687"
  },
  {
    "Region": "North America",
    "Name": "Spencer Pearson",
    "Email address": "speeze.pearson+acx@gmail.com",
    "City": "Seattle, Washington, USA",
    "Location description": "Volunteer Park amphitheater! I'll have a table and a couple of signs saying Astral Codex Ten Meetup.",
    "Plus.Code Coordinates": "https://plus.codes/84VVJMJM+547",
    "Date": "9/9/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "47.630437,-122.317188"
  },
  {
    "Region": "North America",
    "Name": "S.C.",
    "Email address": "villainsplus@protonmail.com",
    "City": "Sioux Falls, South Dakota, USA",
    "Location description": "Pavilion at McKennan Park, or near it if it's occupied. I will have a laptop with a sign saying ACX MEETUP.",
    "Plus.Code Coordinates": "https://plus.codes/86M5G7JH+W5V",
    "Date": "10/2/2023",
    "Time": "5:30:00 PM",
    "Notes": "Please RSVP on LessWrong or EMail me (but don't do both!)",
    "GPS Coordinates": "43.532313,-96.722062"
  },
  {
    "Region": "North America",
    "Name": "Darcey Riley",
    "Email address": "darcey.riley@gmail.com",
    "City": "South Bend, Indiana, USA",
    "Location description": "Chicory Cafe in Downtown South Bend (*not* the one in Mishawaka)",
    "Plus.Code Coordinates": "https://plus.codes/86HMMPGX+3W",
    "Date": "9/23/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "41.675187,-86.250187"
  },
  {
    "Region": "North America",
    "Name": "John Buridan",
    "Email address": "littlejohnburidan@gmail.com",
    "City": "St. Louis, Missouri, USA",
    "Location description": "Cypress Shelter South Pavilion, Tower Grove Park.",
    "Plus.Code Coordinates": "https://plus.codes/86CFJQ32+XC",
    "Date": "9/9/2023",
    "Time": "11:30:00 AM",
    "Notes": "Please RSVP on LessWrong so I know how much food to get and feel free to bring kids/dogs",
    "GPS Coordinates": "38.604937,-90.248937"
  },
  {
    "Region": "North America",
    "Name": "Allison",
    "Email address": "theswamphere@gmail.com",
    "City": "Stone Lake, Wisconsin, USA",
    "Location description": "Stone Lake Lions' Hall. Come to the main door which has the accessible ramp. ACX Meetup will be in the cafe portion, which you can see from the main door.",
    "Plus.Code Coordinates": "https://plus.codes/86QCRFW6+5J6",
    "Date": "9/9/2023",
    "Time": "5:00:00 PM",
    "Notes": "A regularly scheduled 2nd Saturday Barn Dance will be held in the dance hall portion of the building, at 7. You're welcome to stay, or welcome to leave after the ACX meetup.",
    "GPS Coordinates": "45.845437,-91.538438"
  },
  {
    "Region": "North America",
    "Name": "Allison",
    "Email address": "southbaymeetup@gmail.com",
    "City": "Sunnyvale, California, USA",
    "Location description": "Washington Park (840 W Washington Ave, Sunnyvale, CA 94086, USA). We will be on the roundish grassy area in the northeast corner of the park. Look for the folding table with attached ACX Meetup sign",
    "Plus.Code Coordinates": "https://plus.codes/849V9XG6+X9F",
    "Date": "10/14/2023",
    "Time": "2:00:00 PM",
    "Event Link": "https://www.lesswrong.com/events/8v8KcRGRBesXaXeox/south-bay-acx-ssc-spring-meetups-everywhere",
    "Notes": "Please RSVP on LessWrong so I bring enough food/drinks. Children and on-leash dogs are welcome.",
    "GPS Coordinates": "37.377437,-122.039063"
  },
  {
    "Region": "North America",
    "Name": "Jess",
    "Email address": "jordanslowik52@gmail.com",
    "City": "Taos, New Mexico, USA",
    "Location description": "Kit Carson Park by the stage",
    "Plus.Code Coordinates": "https://plus.codes/858PCC5H+6R",
    "Date": "9/23/2023",
    "Time": "1:00:00 PM",
    "Notes": "Please RSVP to my email so I know if I should expect anyone. ",
    "GPS Coordinates": "36.408062,-105.570437"
  },
  {
    "Region": "North America",
    "Name": "Norman Perlmutter",
    "Email address": "NLPerlmutter+ACX@gmail.com",
    "City": "Toledo, Ohio, USA",
    "Location description": "Toledo Botanical Garden. If coming by car, park in the north parking lot (entrance off Elmer Road). We will be at one of the picnic tables near the parking lot.  I'll be wearing an orange shirt and carrying or posting on the table a sign reading ACX MEETUP. In case of bad weather, alternate location will be posted on LessWrong and on the Meetup group.",
    "Plus.Code Coordinates": "https://plus.codes/86HRM89H+43F",
    "Date": "9/10/2023",
    "Time": "3:00:00 PM",
    "Notes": "Please RSVP on LessWrong or on the Meetup group (but not on both, it would make it harder to count RSVPs.)",
    "GPS Coordinates": "41.667812,-83.672313"
  },
  {
    "Region": "North America",
    "Name": "Chris",
    "Email address": "acx@cmart.today",
    "City": "Tucson, Arizona, USA",
    "Location description": "Boxyard at 238 N 4th Ave. Look for ACX tabletop sign. I'll try to get the big shaded table way in the back (next to Los Perches).",
    "Plus.Code Coordinates": "https://plus.codes/854F62FM+VWW",
    "Date": "10/7/2023",
    "Time": "11:15:00 AM",
    "Notes": "Boxyard is outdoor seating. It's likely that we'll have shade, but not a guarantee, so dress for possible sun.",
    "GPS Coordinates": "32.224688,-110.965187"
  },
  {
    "Region": "North America",
    "Name": "Nate",
    "Email address": "natestrum@rocketmail.com",
    "City": "Tuscaloosa, Alabama, USA",
    "Location description": "Strange Brew Coffeehouse: 1101 University Blvd, Tuscaloosa, AL 35401. I'll be inside with a blue shirt and a laptop.",
    "Plus.Code Coordinates": "https://plus.codes/865J6C6W+5X",
    "Date": "9/2/2023",
    "Time": "12:00:00 PM",
    "Notes": "If you can't make the meetup, email me so we can hang out some other time.",
    "GPS Coordinates": "33.210437,-87.552563"
  },
  {
    "Region": "North America",
    "Name": "Ben",
    "Email address": "cu.acx.meetups@gmail.com",
    "City": "Urbana-Champaign, Illinois, USA",
    "Location description": "UIUC, Siebel Center for Computer Science, Room 3401",
    "Plus.Code Coordinates": "https://plus.codes/86GH4Q7G+H8F",
    "Date": "10/22/2023",
    "Time": "3:00:00 PM",
    "Notes": "RSVPs are appreciated but not at all required. You can RSVP on LW or by email or by pinging me in the Discord server. Suggested entrance is the East side of the building - we'll try to make sure at least that door is unlocked, but if it isn't then ping us on email or Discord.",
    "GPS Coordinates": "40.113937,-88.224187"
  },
  {
    "Region": "North America",
    "Name": "John Bennett",
    "Email address": "WashingtonDCAstralCodexTen@gmail.com",
    "City": "Washington, DC, USA",
    "Location description": "Froggy Bottom Pub, 2021 K St NW, Washington, DC 20006",
    "Plus.Code Coordinates": "https://plus.codes/87C4WX33+3J",
    "Date": "9/9/2023",
    "Time": "6:00:00 PM",
    "Notes": "We've rented out the Froggy Bottom Pub for the night, dinner and soft drinks will be provided. Alcohol available for purchase if desired, but no purchases are required. There is metered street parking on nearby blocks; the closest Metro stations are Farragut West and Farragut North.",
    "GPS Coordinates": "38.902687,-77.045938"
  },
  {
    "Region": "North America",
    "Name": "NR",
    "Email address": "mapreader4@gmail.com",
    "City": "West Lafayette, Indiana, USA",
    "Location description": "We'll be in the south of the Earhart Hall lobby (not the dining court) near the piano, and I will be wearing a shirt with a lemur and carrying a sign with ACX MEETUP on it.",
    "Plus.Code Coordinates": "https://plus.codes/86GMC3GG+728",
    "Date": "9/16/2023",
    "Time": "1:00:00 PM",
    "Notes": "We've had a couple meetups during previous rounds of ACX Everywhere and they were quite enjoyable!",
    "GPS Coordinates": "40.425687,-86.924937"
  },
  {
    "Region": "North America",
    "Name": "Charlie",
    "Email address": "chuckwilson477@yahoo.com",
    "City": "West Palm Beach, Florida, USA",
    "Location description": "Grandview Public Market. 1401 Clare Ave, West Palm Beach, FL 33401. We'll be at the northeast outside seating area, sitting at a table with an ACX MEETUP sign on it. Parking is free at an adjacent lot and there is also a free valet service.",
    "Plus.Code Coordinates": "https://plus.codes/76RXMWXP+GH",
    "Date": "9/2/2023",
    "Time": "1:00:00 PM",
    "Notes": "The meetup will go on for several hours so don't worry if you have to arrive later than 1pm. Also, if you need to show up earlier, reach out since we can be flexible about the time.  We regularly host local events and also have members in Boca Raton, Boynton Beach, and Delray Beach. If you can't make it to this event, connect with us to stay tuned for future opportunities!",
    "GPS Coordinates": "26.698813,-80.063563"
  },
  {
    "Region": "North America",
    "Name": "Jacob Elliott",
    "Email address": "jake@gnomidion.com",
    "City": "Westlake, Texas, USA",
    "Location description": "Social Oak Lounge, Trophy Club",
    "Plus.Code Coordinates": "https://plus.codes/8644XRV5+6W",
    "Date": "9/8/2023",
    "Time": "7:00:00 PM",
    "GPS Coordinates": "32.993063,-97.190188"
  },
  {
    "Region": "South America",
    "Name": "David",
    "Email address": "david.f.rivadeneira@gmail.com",
    "City": "Buenos Aires, Argentina",
    "Location description": "Café Cortázar, José A. Cabrera 3797. En la entrada.",
    "Plus.Code Coordinates": "https://plus.codes/48Q3CH3J+F3",
    "Date": "9/9/2023",
    "Time": "11:30:00 AM",
    "GPS Coordinates": "-34.596312,-58.419812"
  },
  {
    "Region": "South America",
    "Name": "Tiago Macedo",
    "Email address": "tiago.s.m.macedo@gmail.com",
    "City": "Rio de Janeiro, RJ, Brazil",
    "Location description": "Praça Nelson Mandela, right at the Botafogo subway station. It is possible that, once everyone is there, we'll go to a nearby Starbucks, just one street-crossing from the initial location.",
    "Plus.Code Coordinates": "https://plus.codes/589R2RX8+H7",
    "Date": "9/15/2023",
    "Time": "4:00:00 PM",
    "Notes": "I'll bring a chessboard. If at most 5 people show up (other than me), I'll either order pizza or coffee for everyone.",
    "GPS Coordinates": "-22.951062,-43.184313"
  },
  {
    "Region": "South America",
    "Name": "Manu",
    "Email address": "astralcodexten@maraoz.com",
    "City": "Punta del Este, Uruguay",
    "Location description": "Borneo Coffee",
    "Plus.Code Coordinates": "https://plus.codes/48Q734PQ+58",
    "Date": "10/14/2023",
    "Time": "2:00:00 PM",
    "GPS Coordinates": "-34.914563,-54.861688"
  }
]

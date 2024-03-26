import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';
import { createMutator, Utils } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { mapsAPIKeySetting } from '../../components/form-components/LocationFormComponent';
import { getLocalTime } from '../mapsUtils';
import {userFindOneByEmail} from "../commonQueries";
import { writeFile } from 'fs/promises';

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
  name: "importACXMeetupsSpring24",
  dateWritten: "2024-03-19",
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
        const username = await Utils.getUnusedSlugByCollectionName("Users", row["Name"].toLowerCase());
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
              username: `${username}-spring-acx-24`,
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
      const title = `${row["City"]} – ACX Meetups Everywhere Spring 2024`

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
              data: `<p>This year's Spring ACX Meetup everywhere in ${row["City"]}.</p>
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
    "Region": "Asia-Pacific",
    "Name": "Ben",
    "Email address": "greenblue4004@gmail.com",
    "City": "Cairns",
    "Location description": "Near the Cairns Esplanade Fun Ship Playground. I will be wearing a green t-shirt and a black legionnaire hat.",
    "Plus.Code Coordinates": "https://plus.codes/5RM73QW7+383",
    "Date": "4/6/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "Feel free to bring kids/dogs.",
    "GPS Coordinates": "-16.9048625,145.7632969"
  },
  {
    "Region": "South America",
    "Name": "Nuño Sempere",
    "Email address": "nuno.semperelh@protonmail.com",
    "City": "Asunción",
    "Location description": "Mburicao; RSVP to nuno.semperelh@protonmail.com at least one hour beforehand to get the precise location",
    "Plus.Code Coordinates": "https://plus.codes/5864P92W+9V",
    "Date": "4/13/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "Meetup is at my apartment. RSVP to nuno.semperelh@protonmail.com to get the precise location",
    "GPS Coordinates": "-25.2990625,-57.60281249999999"
  },
  {
    "Region": "South America",
    "Name": "Adiel",
    "Email address": "adiel@airpost.net",
    "City": "Florianópolis",
    "Location description": "Angeloni Beira Mar, at the food court. I'll be wearing a yellow hat.",
    "Plus.Code Coordinates": "https://plus.codes/584HCFGF+326",
    "Date": "4/13/2024",
    "Time": "04:00 PM",
    "Event Link": "",
    "Notes": "Everyone is welcome!  Email me and I'll add you to the WhatsApp group.",
    "GPS Coordinates": "-27.5748375,-48.5274844"
  },
  {
    "Region": "South America",
    "Name": "Checho",
    "Email address": "checho2211_05@hotmail.com",
    "City": "Santiago",
    "Location description": "Parque Bicentenario, next to the Vitacura municipality, next to the stairs and fountain. Will be wearing a blue hoodie and jeans. ",
    "Plus.Code Coordinates": "https://plus.codes/47RFJ92X+RF",
    "Date": "4/6/2024",
    "Time": "11:30 AM",
    "Event Link": "",
    "Notes": "Meetup can be in Spanish and English. Anyone can come, family and pets welcome. Please confirm assistance with 1 day of anticipation.  ",
    "GPS Coordinates": "-33.3979375,-70.60131249999999"
  },
  {
    "Region": "South America",
    "Name": "Iñaki ",
    "Email address": "inaki.escarate@gmail.com",
    "City": "Santiago",
    "Location description": "Centro GAM, llevo un cartel que dice ACX",
    "Plus.Code Coordinates": "https://plus.codes/47RFH966+83",
    "Date": "5/11/2024",
    "Time": "04:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "-33.4391875,-70.63981249999999"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Bairuk",
    "Email address": "bairuk@pm.me",
    "City": "Parramatta",
    "Location description": "Club Parramatta",
    "Plus.Code Coordinates": "https://plus.codes/4RRG5XPX+9R",
    "Date": "4/6/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "Everyone is welcome. in the future, with feedback from anyone who might be interested, I would like to organise meetings in different suburbs to give more people chance to attend. Having to drive over 30 minutes or use public transport for over an hour is a turn off for most.",
    "GPS Coordinates": "-33.8140625,150.9995625"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Chris Waterguy ",
    "Email address": "singkong+rat@gmail.com",
    "City": "Sydney",
    "Location description": "Club Sydney (RSL Sydney) 565 George St, Sydney NSW 2000 Instructions: entry needs photo ID. We meet on Level 2, the Chinese restaurant, in the glassed-off section. ",
    "Plus.Code Coordinates": "https://plus.codes/4RRH46F4+98",
    "Date": "4/18/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "-33.8765625,151.2058125"
  },
  {
    "Region": "South America",
    "Name": "David Rivadeneira",
    "Email address": "david.f.rivadeneira@gmail.com",
    "City": "Buenos Aires",
    "Location description": "Gorriti 5996, C1414 BKL, Buenos Aires",
    "Plus.Code Coordinates": "https://plus.codes/48Q3CH95+5C",
    "Date": "4/4/2024",
    "Time": "07:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "-34.5820625,-58.4414375"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Ryan",
    "Email address": "xgravityx@hotmail.com",
    "City": "Melbourne",
    "Location description": "Queensberry hotel (dining room) 593 Swanston Street Carlton ",
    "Plus.Code Coordinates": "https://plus.codes/4RJ65XW7+46",
    "Date": "4/5/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP by email/WhatsApp/Facebook for booking purposes (not a strict requirement)",
    "GPS Coordinates": "-37.8046875,144.9630625"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "William W",
    "Email address": "Napaproject@gmail.com",
    "City": "Ubud Bali",
    "Location description": "Parq Ubud",
    "Plus.Code Coordinates": "https://plus.codes/6P3QG789+F7",
    "Date": "3/24/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP",
    "GPS Coordinates": "-8.483812499999999,115.2681875"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Andrew",
    "Email address": "mindupgrade@protonmail.com",
    "City": "Singapore",
    "Location description": "Maxwell (will send more details in email)",
    "Plus.Code Coordinates": "https://plus.codes/6PH57RJV+5W",
    "Date": "4/14/2024",
    "Time": "04:00 PM",
    "Event Link": "",
    "Notes": "Feel free to send an email about topic sentences that you are interested in or want to have a conversation with others about. Topic sentences will be collated and shared with the other attendees.",
    "GPS Coordinates": "1.2804375,103.8448125"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Matthias",
    "Email address": "matthias.goergens@gmail.com",
    "City": "Singapore",
    "Location description": "Yeast Side pub in Farrer Park.",
    "Plus.Code Coordinates": "https://plus.codes/6PH58V74+27Q",
    "Date": "4/13/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Kids are fine, no dogs please. RSVP via email or the WhatsApp group would be good. (Yeast Side has pizzas, beer and non-alcoholic drinks.  It's in Little India with plenty of other food options.  It's inside of Lyf, which has a bit of breakout space, too.)",
    "GPS Coordinates": "1.3125875,103.8557344"
  },
  {
    "Region": "Central America",
    "Name": "Timeless",
    "Email address": "pvspam-acxorganiser@hacklab.net",
    "City": "Tamarindo",
    "Location description": "El Mercadito Food Court",
    "Plus.Code Coordinates": "https://plus.codes/762P75X5+QMR",
    "Date": "4/7/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "Feel free to bring kids/dogs. I will wear a nerdy t-shirt and stay close to Asian Fusion Sushi section of the court.",
    "GPS Coordinates": "10.2994875,-85.8408594"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Hiep",
    "Email address": "hiepbq14408@gmail.com",
    "City": "Ho Chi Minh",
    "Location description": "In the library on the third floor of Trung Nguyen Legend coffee. The coffee shop is at 603 Tran Hung Dao St., Dist. 1 at an intersection.",
    "Plus.Code Coordinates": "https://plus.codes/7P28QM4P+H57",
    "Date": "4/14/2024",
    "Time": "09:00 AM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "10.7564125,106.6854219"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Vatsal",
    "Email address": "mehra.vatsal@gmail.com",
    "City": "Hyderabad",
    "Location description": "The Weekend Cafe, Plot No D-3, beside vac's bakery, Vikrampuri Colony, Lane, Secunderabad, Telangana 500015, India",
    "Plus.Code Coordinates": "https://plus.codes/7J9WFF4X+4P",
    "Date": "4/27/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "17.4553125,78.4993125"
  },
  {
    "Region": "North America",
    "Name": "Francisco",
    "Email address": "fagarrido@gmail.com",
    "City": "Mexico City",
    "Location description": "Cafebreria El Pendulo",
    "Plus.Code Coordinates": "https://plus.codes/76F2CR6G+6R",
    "Date": "4/13/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "19.4105625,-99.17293749999999"
  },
  {
    "Region": "North America",
    "Name": "Silvia Fernández",
    "Email address": "silviafidelina@hotmail.com",
    "City": "Mérida",
    "Location description": "Centro de Estudios e Investigaciones Sociales y Culturales Efrain Calderon, calle 38 No. 453 por 35 y 37 Barrio Obrero: Jesús Carranza, Mérida, Mexico",
    "Plus.Code Coordinates": "https://plus.codes/76GGX9JV+W6",
    "Date": "4/20/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "Favor de reservar por mail",
    "GPS Coordinates": "20.9823125,-89.6069375"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Jord Nguyen",
    "Email address": "jordnguyen43@gmail.com",
    "City": "Hanoi",
    "Location description": "The Keep Cafe & Board Game, 76 P. Kim Mã Thượng, Cống Vị, Ba Đình, Hà Nội, Vietnam. ",
    "Plus.Code Coordinates": "https://plus.codes/7PH72RP6+GG",
    "Date": "5/5/2024",
    "Time": "10:00 AM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "21.0363125,105.8113125"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Max Bolingbroke",
    "Email address": "acx@alpha.engineering",
    "City": "Hong Kong",
    "Location description": "Private flat in The Oakhill, 28 Wood Road, Wan Chai",
    "Plus.Code Coordinates": "https://plus.codes/7PJP75GG+HP",
    "Date": "4/13/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Email me to RSVP and I will let you know which flat number to come to & give you an invite link to the ACX Hong Kong WhatsApp group. For those who couldn't RSVP in time I will also put an \"ACX Meetup\" sign outside the entrance of the building with the number of my flat on it.",
    "GPS Coordinates": "22.2764375,114.1768125"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Jake and Brandon",
    "Email address": "jakessolo+acxmeetup@gmail.com",
    "City": "Taipei",
    "Location description": "Daan Park - northeast field next to the basketball courts (backup: Learn Bar if it's raining)",
    "Plus.Code Coordinates": "https://plus.codes/7QQ32GJP+PG3",
    "Date": "4/28/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Backup location coordinates: https://plus.codes/7QQ32GMJ+GHR",
    "GPS Coordinates": "25.0317625,121.5362969"
  },
  {
    "Region": "North America",
    "Name": "Eric",
    "Email address": "eric135033@gmail.com",
    "City": "Miami",
    "Location description": "111 Brickell Ave, Miami, FL 33131. If lobby doors are locked, enter through the Carrot Express.",
    "Plus.Code Coordinates": "https://plus.codes/76QXQR75+3C",
    "Date": "4/14/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "25.7626875,-80.19143749999999"
  },
  {
    "Region": "North America",
    "Name": "Dante",
    "Email address": "danteac94@gmail.com",
    "City": "Hollywood",
    "Location description": "At the beach, on the Hollywood beach boulevard. ",
    "Plus.Code Coordinates": "https://plus.codes/76RX2V6M+CM",
    "Date": "4/20/2024",
    "Time": "11:00 AM",
    "Event Link": "",
    "Notes": "I might be there earlier to watch the sunrise and then having the morning at the beach",
    "GPS Coordinates": "26.0110625,-80.11581249999999"
  },
  {
    "Region": "North America",
    "Name": "Britt",
    "Email address": "miamiacx@gmail.com",
    "City": "Fort Lauderdale",
    "Location description": "Whole Foods Market inside seating area 501 SE 17th Street, Fort Lauderdale, FL, USA. Parking: There should be no cost to park in the Whole Foods Parking Garage. Once inside, go down the escalator and walk through the grocery store towards the checkout lanes. We will be in the seating area right past the self-checkout stations near the cafe section. Look for a table with an ACX MEETUP sign.",
    "Plus.Code Coordinates": "https://plus.codes/76RX4V26+5XP",
    "Date": "4/27/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "Our group also hosts events in Miami and West Palm Beach. Please join our Discord if you would like more information about upcoming events (https://discord.gg/tDf8fYPRRP). ",
    "GPS Coordinates": "26.1004625,-80.13754689999999"
  },
  {
    "Region": "North America",
    "Name": "Shawn Spilman",
    "Email address": "Shawn.Spilman@gmail.com",
    "City": "Cape Coral",
    "Location description": "929 SW 54th Ln, Cape Coral, FL  33914",
    "Plus.Code Coordinates": "https://plus.codes/76RWH224+44",
    "Date": "5/4/2024",
    "Time": "12:01 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "26.5503125,-81.9946875"
  },
  {
    "Region": "North America",
    "Name": "Charlie",
    "Email address": "chuckwilson477@yahoo.com",
    "City": "West Palm Beach",
    "Location description": "Grandview Public Market. 1401 Clare Ave, West Palm Beach, FL 33401. We'll be at the northeast outside area, sitting at a table with an ACX MEETUP sign on it. Parking is free at an adjacent lot, and there may also be a free valet service.",
    "Plus.Code Coordinates": "https://plus.codes/76RXMWXP+GH",
    "Date": "5/11/2024",
    "Time": "11:00 AM",
    "Event Link": "",
    "Notes": "Hosted by the south Florida ACX group that also does meetups in Palm Beach and Broward communities such as Boca Raton, Boynton Beach, Delray and many others. Come join our Discord, we're always welcoming!",
    "GPS Coordinates": "26.6988125,-80.0635625"
  },
  {
    "Region": "North America",
    "Name": "Ethan Huyck",
    "Email address": "ethanhuyck@gmail.com",
    "City": "Orlando",
    "Location description": "UCF, at the covered pavilion near the Breezeway, I'll have a sign",
    "Plus.Code Coordinates": "https://plus.codes/76WWJQ2X+72R",
    "Date": "4/26/2024",
    "Time": "07:00 PM",
    "Event Link": "",
    "Notes": "please let me know in the discord if you will be there so I can plan snacks for everyone.",
    "GPS Coordinates": "28.6007375,-81.2024844"
  },
  {
    "Region": "North America",
    "Name": "Russell",
    "Email address": "rchestnut1520@gmail.com",
    "City": "Gainseville",
    "Location description": "4th Ave Food Park, outside picnic table. Will have a sign if it's not obvious.",
    "Plus.Code Coordinates": "https://plus.codes/76XVJMXC+5C2",
    "Date": "4/22/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "29.6478875,-82.3289844"
  },
  {
    "Region": "North America",
    "Name": "Blake Bertuccelli-Booth",
    "Email address": "blake@philosophers.group",
    "City": "New Orleans",
    "Location description": "Petite Clouet Cafe",
    "Plus.Code Coordinates": "https://plus.codes/76XFXX74+H7",
    "Date": "5/5/2024",
    "Time": "11:11 AM",
    "Event Link": "",
    "Notes": "Feel free to reach out to me on signal. My name: blake.1111",
    "GPS Coordinates": "29.9639375,-90.04431249999999"
  },
  {
    "Region": "North America",
    "Name": "CM",
    "Email address": "cmataya64@gmail.com",
    "City": "New Orleans",
    "Location description": "Flora Cafe in Marigny Bywater. I'll be at one of the tables wearing a Grateful Dead tshirt (probably)",
    "Plus.Code Coordinates": "https://plus.codes/76XFXW7X+VF",
    "Date": "4/20/2024",
    "Time": "02:30 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "29.9646875,-90.0513125"
  },
  {
    "Region": "Africa & Middle East",
    "Name": "Gruns",
    "Email address": "aviram.ben.eliav@gmail.com",
    "City": "Jerusalem",
    "Location description": "Gan Sacher near the gan sipur cafe",
    "Plus.Code Coordinates": "https://plus.codes/8G3QQ6J5+V4",
    "Date": "4/17/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "please email me so we can know how many people to expect",
    "GPS Coordinates": "31.7821875,35.2078125"
  },
  {
    "Region": "Africa & Middle East",
    "Name": "Inbar",
    "Email address": "inbar192@gmail.com",
    "City": "Tel Aviv",
    "Location description": "Sarona Park, grass area close to the Benedict restaurant, will have ACX sign and red balloons",
    "Plus.Code Coordinates": "https://plus.codes/8G4P3QCP+MJ9",
    "Date": "4/25/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "Everyone is welcome! Feel free to bring snacks.",
    "GPS Coordinates": "32.0716625,34.7866094"
  },
  {
    "Region": "North America",
    "Name": "Julius",
    "Email address": "julius.simonelli@gmail.com",
    "City": "San Diego",
    "Location description": "Bird Park",
    "Plus.Code Coordinates": "https://plus.codes/8544PVQ8+P7",
    "Date": "4/27/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "32.7393125,-117.1343125"
  },
  {
    "Region": "North America",
    "Name": "Ethan Morse",
    "Email address": "ethan.morse97@gmail.com",
    "City": "Dallas",
    "Location description": "Whole Foods off Preston and Forest (11700 Preston Rd Suite 714, Dallas, TX 75230). We'll be in the upstairs seating area closest to the windows.",
    "Plus.Code Coordinates": "https://plus.codes/8645W55W+2J",
    "Date": "4/21/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "32.9075625,-96.8034375"
  },
  {
    "Region": "North America",
    "Name": "Michael",
    "Email address": "michaelmichalchik@gmail.com",
    "City": "Newport Beach",
    "Location description": "1970 Port Laurent place, Newport Beach 92660",
    "Plus.Code Coordinates": "https://plus.codes/8554J47R+Q8",
    "Date": "4/6/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "By the time this annual Meetup happens we will have had over 60 meetups almost every single one of which was attended. I would say our attendance rate is about 96 or 97%. Sometimes it's just the two of us, but there have been as many as 15 people. Typical turnouts are three to five. We usually like being outdoors and will often go for a walk that lasts between one and two and a half hours after a preliminary gathering and introductions that lasts about an hour to 90 minutes. Sometimes refreshments are provided, there are always water and bathroom facility.",
    "GPS Coordinates": "33.6144375,-117.8591875"
  },
  {
    "Region": "North America",
    "Name": "Todd",
    "Email address": "todd.ramsey.shopping@gmail.com",
    "City": "Palm Desert",
    "Location description": "Palm Desert Civic Center Park. Picnic shelter 5 if available; if not, try picnic shelter 4; then 3, then 2, then 1. (I'm not reserving a space but will get there early to claim a picnic shelter) I'll be wearing a loud tie-dye tee shirt to help you identify me.",
    "Plus.Code Coordinates": "https://plus.codes/8555PJJ9+WV",
    "Date": "4/14/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Please provide for your own food and drink. ",
    "GPS Coordinates": "33.7323125,-116.3803125"
  },
  {
    "Region": "North America",
    "Name": "Vishal",
    "Email address": "Contact \"Vishal\" on the LAR discord",
    "City": "Los Angeles",
    "Location description": "11841 Wagner St., Culver City",
    "Plus.Code Coordinates": "https://plus.codes/8553XHWM+GP",
    "Date": "4/10/2024",
    "Time": "06:30 PM",
    "Event Link": "",
    "Notes": "RSVPs on the LessWrong event are not necessary but recommended: https://www.lesswrong.com/events/ziyNTuMGquENeYyaN/los-angeles-ca-acx-spring-meetups-everywhere-2024-lw-acx",
    "GPS Coordinates": "33.9963125,-118.4156875"
  },
  {
    "Region": "North America",
    "Name": "Sean",
    "Email address": "acxsean@gmail.com",
    "City": "Santa Barbara",
    "Location description": "Tables next to UCSB Lot 10 (near Engineering)",
    "Plus.Code Coordinates": "https://plus.codes/8562C575+XW",
    "Date": "4/7/2024",
    "Time": "12:30 PM",
    "Event Link": "",
    "Notes": "Please join the discord to help me coordinate/calibrate group size",
    "GPS Coordinates": "34.4149375,-119.8401875"
  },
  {
    "Region": "North America",
    "Name": "Michael",
    "Email address": "michael@postlibertarian.com",
    "City": "Memphis",
    "Location description": "French Truck Coffee in Crosstown Concourse, Central Atrium, 1350 Concourse Ave #167, Memphis, TN 38104. I'll be at a table with a sign that says ACX MEETUP",
    "Plus.Code Coordinates": "https://plus.codes/867F5X2P+QHW",
    "Date": "4/6/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "35.1519875,-90.0135469"
  },
  {
    "Region": "North America",
    "Name": "Denis",
    "Email address": "denis.lantsman@gmail.com",
    "City": "San Luis Obispo",
    "Location description": "Meadow Park, just south of the public restrooms ",
    "Plus.Code Coordinates": "https://plus.codes/847X789R+4C",
    "Date": "4/7/2024",
    "Time": "12:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "35.2678125,-120.6589375"
  },
  {
    "Region": "North America",
    "Name": "Vicki Williams",
    "Email address": "Vickirwilliams@gmail.com",
    "City": "Asheville",
    "Location description": "Biltmore Lake Fire Pit, 80 Lake Dr. Candler, NC. Parking in front of the basketball court, then walk along the lake to the fire pit behind the tennis court.",
    "Plus.Code Coordinates": "https://plus.codes/867VG8MW+9G",
    "Date": "4/27/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP so I can get in touch in case of change in plans.",
    "GPS Coordinates": "35.5334375,-82.65368749999999"
  },
  {
    "Region": "North America",
    "Name": "Randall Hayes",
    "Email address": "vsi.beacon@gmail.com",
    "City": "Greensboro",
    "Location description": "Old Town Draught House, 1205 Spring Garden St, Greensboro, NC 27403 ",
    "Plus.Code Coordinates": "https://plus.codes/8782358Q+7P",
    "Date": "4/6/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "This is a place of business, so no outside food or drink. Sorry. https://oldtowndraught.com/ If you're interested in Sci-Fi, there's a con going on down the block!\"",
    "GPS Coordinates": "36.0656875,-79.8106875"
  },
  {
    "Region": "North America",
    "Name": "Jonathan Ray",
    "Email address": "ray.jonathan.w@gmail.com",
    "City": "Las Vegas",
    "Location description": "Tree Top Park",
    "Plus.Code Coordinates": "https://plus.codes/85865MR8+3JM",
    "Date": "4/6/2024",
    "Time": "11:00 AM",
    "Event Link": "",
    "Notes": "Feel free to talk about anything you want to talk about!  Please actually show up if you RSVP!",
    "GPS Coordinates": "36.1902125,-115.3334531"
  },
  {
    "Region": "Europe",
    "Name": "Annalise",
    "Email address": "annalisetarhan@gmail.com",
    "City": "Antalya",
    "Location description": "Beach Park, Shakespeare, on the patio",
    "Plus.Code Coordinates": "https://plus.codes/8G8GVMMC+4VR",
    "Date": "5/11/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "36.8828625,30.6721406"
  },
  {
    "Region": "North America",
    "Name": "Eric F",
    "Email address": "Ericf14159@gmail.com",
    "City": "Bedford",
    "Location description": "Bridge Street Cafe. 210 N Bridge St, Bedford, VA 24523",
    "Plus.Code Coordinates": "https://plus.codes/87928FPG+6V",
    "Date": "4/20/2024",
    "Time": "10:00 AM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "37.3355625,-79.5228125"
  },
  {
    "Region": "North America",
    "Name": "Skyler",
    "Email address": "skyler@rationalitymeetups.org",
    "City": "Berkeley",
    "Location description": "2740 Telegraph Avenue",
    "Plus.Code Coordinates": "https://plus.codes/849VVP5R+X5",
    "Date": "5/26/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Kids are welcome, no pets please!",
    "GPS Coordinates": "37.8599375,-122.2595625"
  },
  {
    "Region": "Europe",
    "Name": "Will",
    "Email address": "will.worth@gmail.com",
    "City": "Alicante",
    "Location description": "Parque Canalejas(park next to the esplanada and port, central Alicante)",
    "Plus.Code Coordinates": "https://plus.codes/8CCX8GR7+C6",
    "Date": "4/20/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "Hispanohablantes, sois bienvenidos/English speakers welcome",
    "GPS Coordinates": "38.34106250000001,-0.4869375"
  },
  {
    "Region": "North America",
    "Name": "Julia and Andrew",
    "Email address": "amethyst.eggplant@gmail.com, nightfall9@gmail.com",
    "City": "Sacramento",
    "Location description": "A house at 22nd and W St in Midtown Sacramento",
    "Plus.Code Coordinates": "https://plus.codes/84CWHG68+MV",
    "Date": "4/14/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP on LessWrong so I know how much food to get. I'll have podcasting equipment set up if anyone wants to record a spicy conversation, opt in only obviously",
    "GPS Coordinates": "38.5616875,-121.4828125"
  },
  {
    "Region": "North America",
    "Name": "Vast",
    "Email address": "acx.meetup.debtless191@passmail.net",
    "City": "Woodbridge",
    "Location description": "Chinn Park Library",
    "Plus.Code Coordinates": "https://plus.codes/87C4MMC8+4M",
    "Date": "4/13/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "38.6703125,-77.33331249999999"
  },
  {
    "Region": "Europe",
    "Name": "Luis Campos",
    "Email address": "luis.filipe.lcampos@gmail.com",
    "City": "Lisbon",
    "Location description": "We meet on top of a small hill East of the Linha d'Água café in Jardim Amália Rodrigues. I'll be wearing a pinkish shirt.",
    "Plus.Code Coordinates": "https://plus.codes/8CCGPRJW+V9",
    "Date": "4/20/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "For comfort, bring sunglasses and a blanket to sit on. There is some natural shade. Also, it can get quite windy, so bring a jacket.",
    "GPS Coordinates": "38.73218749999999,-9.1540625"
  },
  {
    "Region": "North America",
    "Name": "Michael Tint",
    "Email address": "tint.michael@gmail.com",
    "City": "Washington DC",
    "Location description": "1002 N Street NW, 20001",
    "Plus.Code Coordinates": "https://plus.codes/87C4WX4F+VC",
    "Date": "4/20/2024",
    "Time": "07:00 PM",
    "Event Link": "",
    "Notes": "the link to the email list is  https://groups.google.com/g/dc-acx",
    "GPS Coordinates": "38.9071875,-77.0264375"
  },
  {
    "Region": "North America",
    "Name": "Chris",
    "Email address": "Chriswarr45@gmail.com",
    "City": "Washington DC",
    "Location description": "Hook Hall, 3400 Georgia Ave NW, Washington, DC 20010, I'll be wearing a blue hat ",
    "Plus.Code Coordinates": "https://plus.codes/87C4WXJG+WC",
    "Date": "",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "38.9323125,-77.0239375"
  },
  {
    "Region": "North America",
    "Name": "jpt4",
    "Email address": "jpt4@proton.me",
    "City": "Bloomington",
    "Location description": "Bloominglabs, the local hackerspace, at 1840 S Walnut St. Follow the sign to the entrance at the rear of the building.",
    "Plus.Code Coordinates": "https://plus.codes/86FM4FW8+GF4",
    "Date": "4/13/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Family friendly. Please RSVP for headcount purposes, and include any food allergies. Hackerspace policy requires all guests to sign a liability waiver once on-site, but be not dissuaded.",
    "GPS Coordinates": "39.1462625,-86.5337969"
  },
  {
    "Region": "North America",
    "Name": "Max Harms",
    "Email address": "Raelifin@gmail.com",
    "City": "Grass Valley",
    "Location description": "The prospector statue in Condon Park if the weather is nice, otherwise my house nearby (send an email for the address)",
    "Plus.Code Coordinates": "https://plus.codes/84FW6W8H+F4",
    "Date": "5/18/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP by email or on LessWrong ",
    "GPS Coordinates": "39.2161875,-121.0721875"
  },
  {
    "Region": "North America",
    "Name": "Rivka",
    "Email address": "rivka@adrusi.com",
    "City": "Baltimore",
    "Location description": "Outside of the Performing Arts and Humanities Building at UMBC. The address is 1000 Hilltop Cir, Baltimore, MD 21250. There will be a sign that says \"ACX Meetup\". ",
    "Plus.Code Coordinates": "https://plus.codes/87F5774P+53",
    "Date": "5/5/2024",
    "Time": "07:00 PM",
    "Event Link": "",
    "Notes": "Parking is free on the weekend. In case of rain or inclement weather, we will be inside on the first floor of the building. There will be food and drinks (likely pizza). RSVPs are useful so I know how much food to get, but are not required. ",
    "GPS Coordinates": "39.2554375,-76.7148125"
  },
  {
    "Region": "North America",
    "Name": "Siddhesh",
    "Email address": "ranade.siddhesh@gmail.com",
    "City": "Philadelphia",
    "Location description": "La Colombe Coffee Roasters on 6th and Market (100 S Independence Mall W #110)",
    "Plus.Code Coordinates": "https://plus.codes/87F6XR2X+6M",
    "Date": "4/6/2024",
    "Time": "11:00 AM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "39.9505625,-75.1508125"
  },
  {
    "Region": "North America",
    "Name": "Russell",
    "Email address": "russell.emmer@gmail.com",
    "City": "Columbus",
    "Location description": "Clifton Park Shelterhouse, Jeffrey Park, Bexley. We will be at one of the tables with an ACX sign.",
    "Plus.Code Coordinates": "https://plus.codes/86FVX3C3+QF",
    "Date": "4/14/2023",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Please send an email if you'd like to join our mailing list for future invitations.",
    "GPS Coordinates": "39.9719375,-82.94631249999999"
  },
  {
    "Region": "North America",
    "Name": "Josh Sacks",
    "Email address": "josh.sacks+acx@gmail.com",
    "City": "Boulder",
    "Location description": "(our house- same as previous meetups)- 9191 Tahoe Ln, Boulder, CO 80301. About 8 miles east of CU-Boulder",
    "Plus.Code Coordinates": "https://plus.codes/85GP2V96+HV",
    "Date": "4/20/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP on LessWrong so we can estimate snacks.",
    "GPS Coordinates": "40.0189375,-105.1378125"
  },
  {
    "Region": "North America",
    "Name": "Phil",
    "Email address": "acxharrisburg@gmail.com",
    "City": "Harrisburg",
    "Location description": "Zeroday Brewing Company Taproom, 925 N 3rd St, Harrisburg, PA 17102",
    "Plus.Code Coordinates": "https://plus.codes/87G57487+R7",
    "Date": "4/13/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "40.2670625,-76.88681249999999"
  },
  {
    "Region": "Europe",
    "Name": "Luis F",
    "Email address": "rydly@hotmail.com",
    "City": "Madrid",
    "Location description": "Puppet theatre (Teatro de Títeres) Retiro park (North-West corner not far from Puerta de Alcalá)",
    "Plus.Code Coordinates": "https://plus.codes/8CGRC897+G8",
    "Date": "4/20/2024",
    "Time": "11:30 AM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "40.4188125,-3.686687499999999"
  },
  {
    "Region": "North America",
    "Name": "Mik Zlatin",
    "Email address": "poidude7@gmail.com",
    "City": "Pittsburgh",
    "Location description": "Frick park, beechwood gate entrance ",
    "Plus.Code Coordinates": "https://plus.codes/87G2C3PR+QP",
    "Date": "4/13/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "40.4369375,-79.9081875"
  },
  {
    "Region": "North America",
    "Name": "Justin",
    "Email address": "pghacx@gmail.com",
    "City": "Pittsburgh",
    "Location description": "DEFAULT OUTDOOR LOCATION: CMU Campus, Jared L Cohon University Center, at the picnic tables outside the east entrance (the side of the building that faces the track).  Look for the \"ACX\" banner. CONTINGENCY INDOOR LOCATION (in case of rain): Jared L Cohon University Center, Danforth Lounge (upstairs, 2nd floor)",
    "Plus.Code Coordinates": "https://plus.codes/87G2C3V5+6C",
    "Date": "4/6/2024",
    "Time": "01:30 PM",
    "Event Link": "",
    "Notes": "The Pittsburgh ACX group meets around once a month, with most meetups taking place around Shady or East Liberty.  If you'd like to be notified about future meetups, email pghacx@gmail.com to be added to the mailing list.",
    "GPS Coordinates": "40.4430625,-79.94143749999999"
  },
  {
    "Region": "North America",
    "Name": "Robi Rahman",
    "Email address": "robirahman94@gmail.com",
    "City": "Manhattan",
    "Location description": "We'll meet at Pumphouse Park unless it's raining, in which case we'll be inside the adjacent building, Brookfield Place.",
    "Plus.Code Coordinates": "https://plus.codes/87G7PX6M+RG",
    "Date": "4/27/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "If it is raining, we will meet in the atrium of Brookfield Place, located at https://plus.codes/87G7PX7M+3R",
    "GPS Coordinates": "40.71206249999999,-74.0161875"
  },
  {
    "Region": "North America",
    "Name": "Stefan",
    "Email address": "stefanlenoach@gmail.com",
    "City": "Brooklyn",
    "Location description": "My apartment",
    "Plus.Code Coordinates": "https://plus.codes/87G8P3G2+2G",
    "Date": "5/4/2024",
    "Time": "07:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP - my apartment can handle ~40 people.",
    "GPS Coordinates": "40.7250625,-73.94868749999999"
  },
  {
    "Region": "North America",
    "Name": "Tyler S",
    "Email address": "Tylers@duck.com",
    "City": "Arcata",
    "Location description": "“The pub at the creamery” in Arcata. 824 L St suite a, Arcata, CA 95521. I will have an ACX Meetup Sign",
    "Plus.Code Coordinates": "https://plus.codes/84GQVW95+WC",
    "Date": "5/25/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "40.86981249999999,-124.0914375"
  },
  {
    "Region": "Europe",
    "Name": "Ozge",
    "Email address": "ozgeco@yahoo.com",
    "City": "Istanbul",
    "Location description": "We meet in Kadıkoy at Kahve Dunyası at Yeni Iskele. Yeni Iskele is the seaport where we take ferry to get to Eminonu/Karakoy from Kadıkoy ( not to Besiktas). Please go upstairs, walk through the bookstore Istanbul Kitapcisi to meet me at the terrace. I will have a ACX MEETUP sign. If it rains, we meet inside the cafe, or under large cafe umbrellas.",
    "Plus.Code Coordinates": "https://plus.codes/8GGFX2VC+4R",
    "Date": "5/4/2024",
    "Time": "12:00 PM",
    "Event Link": "",
    "Notes": "I hope we chat with coffee.",
    "GPS Coordinates": "40.9928125,29.0220625"
  },
  {
    "Region": "North America",
    "Name": "Gesild Muka",
    "Email address": "gemuka@my.bridgeport.edu",
    "City": "Danbury",
    "Location description": "255 White St, Danbury, CT 06810",
    "Plus.Code Coordinates": "https://plus.codes/87H89HX7+VG",
    "Date": "4/19/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "It's a bar/restaurant, there are tables so kids are allowed. They're known for their wings.",
    "GPS Coordinates": "41.3996875,-73.4361875"
  },
  {
    "Region": "Europe",
    "Name": "Dmitrii",
    "Email address": "overfull_jailbird656@simplelogin.com",
    "City": "Tbilisi",
    "Location description": "https://f0rth.space",
    "Plus.Code Coordinates": "https://plus.codes/8HH6PQ4J+MJ",
    "Date": "4/6/2024",
    "Time": "12:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "41.7066875,44.7815625"
  },
  {
    "Region": "North America",
    "Name": "Todd",
    "Email address": "info@chicagorationality.com",
    "City": "Chicago",
    "Location description": "We'll be in Grant Park just between the train tracks and Columbus on the north side of Balbo. There's a shaded area with some trees.",
    "Plus.Code Coordinates": "https://plus.codes/86HJV9FH+95",
    "Date": "5/18/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "41.8734375,-87.6220625"
  },
  {
    "Region": "Europe",
    "Name": "Giulio",
    "Email address": "giulio.starace@gmail.com",
    "City": "Rome",
    "Location description": "Villa Doria Pamphili (park), just south of the \"Cedro del Libano\" on the grass opening.",
    "Plus.Code Coordinates": "https://plus.codes/8FHJVCMX+PP",
    "Date": "4/20/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "41.8843125,12.4493125"
  },
  {
    "Region": "North America",
    "Name": "duck_master",
    "Email address": "duckmaster0@protonmail.com",
    "City": "Newton",
    "Location description": "Upper Falls Greenway (Easy St, Newton, MA, USA 02461; just off Needham St, near the intersection with Dedham St and Winchester St)",
    "Plus.Code Coordinates": "https://plus.codes/87JC8Q8Q+QH",
    "Date": "4/7/2024",
    "Time": "12:00 PM",
    "Event Link": "",
    "Notes": "Mostly unstructured talking. Anywhere along the Upper Falls Greenway (between Easy St and the Charles River, paralleling Needham St) works, since I expect we'll be walking to and fro. However, newbies should show up **at the Easy St end** so we don't get lost. If there's demand for it we can also migrate to the footpath on the Needham side of the river as well (between Highland Ave and 2nd Ave). I plan on bringing my plush duck. I may or may not bring nametags. If I don't bring nametags, I'll ask everyone to introduce their names (internet names are ok for this meetup). Other types of people beyond rationalists (eg postrats, alignment researchers, predictors, EAs, etc.) are welcome!",
    "GPS Coordinates": "42.31693749999999,-71.2110625"
  },
  {
    "Region": "North America",
    "Name": "duck_master",
    "Email address": "duckmaster0@protonmail.com",
    "City": "Newton",
    "Location description": "Farlow Park/Chaffin Park (Centre St & Church St, Newton, MA, USA 02458; near Interstate 90/the Mass Pike)",
    "Plus.Code Coordinates": "https://plus.codes/87JC9R38+J3",
    "Date": "4/7/2024",
    "Time": "12:00 PM",
    "Event Link": "",
    "Notes": "I will ask every attendee to introduce their name (and/or wear a nametag); otherwise this will mostly be general small talk",
    "GPS Coordinates": "42.3540625,-71.18481249999999"
  },
  {
    "Region": "North America",
    "Name": "Skyler",
    "Email address": "Skyler@rationalitymeetups.org",
    "City": "Cambridge",
    "Location description": "JFK Memorial Park, Cambridge. Look for the tall blue and green hat. We'll have a canopy in case it rains.",
    "Plus.Code Coordinates": "https://plus.codes/87JC9VCG+8W",
    "Date": "4/20/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Please feel free to bring kids or pets! I'll be the one in the tall green and blue hat.",
    "GPS Coordinates": "42.3708125,-71.1226875"
  },
  {
    "Region": "Europe",
    "Name": "Dan",
    "Email address": "bensen.daniel@gmail.com",
    "City": "Sofia",
    "Location description": "The Mr. Pizza on Vasil Levski (Sofia Center, Vasil Levski Blvd 53, 1142 Sofia)",
    "Plus.Code Coordinates": "https://plus.codes/8GJ5M8QH+FM",
    "Date": "4/21/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "42.6886875,23.3291875"
  },
  {
    "Region": "North America",
    "Name": "Peter",
    "Email address": "pjvh@umich.edu",
    "City": "Grand Rapids",
    "Location description": "Lookout Park.  I’ll have a nametag and a hammock (weather permitting).",
    "Plus.Code Coordinates": "https://plus.codes/86JPX8GJ+VV",
    "Date": "4/13/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "Updates will be here- https://petervh.com/GR-ACX",
    "GPS Coordinates": "42.97718750000001,-85.6678125"
  },
  {
    "Region": "North America",
    "Name": "Cory",
    "Email address": "cpf3rd@gmail.com",
    "City": "Milwaukee",
    "Location description": "1701 N Lincoln Memorial Dr, Milwaukee, WI 53202, The patio outside the Lakefront Colectivo. I will be wearing a red T-shirt",
    "Plus.Code Coordinates": "https://plus.codes/86MJ3437+C8W",
    "Date": "4/13/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "43.0536125,-87.8866719"
  },
  {
    "Region": "Europe",
    "Name": "Félix",
    "Email address": "ffk@fastmail.fr",
    "City": "Marseille",
    "Location description": "Cours Julien, at the bar \"Brasserie Communale\"",
    "Plus.Code Coordinates": "https://plus.codes/8FM779VM+GCC",
    "Date": "4/2/2024",
    "Time": "07:30 PM",
    "Event Link": "",
    "Notes": "We'll meet at the bar but can go to any place around if needed",
    "GPS Coordinates": "43.2938125,5.3835156"
  },
  {
    "Region": "North America",
    "Name": "S.C.",
    "Email address": "Villainsplus@protonmail.com",
    "City": "Sioux Falls",
    "Location description": "Picnic shelter at McKennan Park, or tables south of it if it's occupied. Will have a sign saying \"ACX.\"",
    "Plus.Code Coordinates": "https://plus.codes/86M5G7JH+W5V",
    "Date": "5/19/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP on LW",
    "GPS Coordinates": "43.5323625,-96.72207809999999"
  },
  {
    "Region": "North America",
    "Name": "Tim",
    "Email address": "tim.r.burr@gmail.com",
    "City": "Boise",
    "Location description": "Ann Morrison Park. I will bring my dog and some lawn games, and set up in the grass on the northwest side.",
    "Plus.Code Coordinates": "https://plus.codes/85M5JQ7G+QX",
    "Date": "4/13/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "Feel free to bring dogs, kids, games, tasty beverages...",
    "GPS Coordinates": "43.6144375,-116.2225625"
  },
  {
    "Region": "North America",
    "Name": "Deon Don",
    "Email address": "contact@deondon.com",
    "City": "Toronto",
    "Location description": "Terry Fox Park Covered Area",
    "Plus.Code Coordinates": "https://plus.codes/87M2RM7H+WV",
    "Date": "4/4/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "43.8148125,-79.3203125"
  },
  {
    "Region": "Europe",
    "Name": "Toni",
    "Email address": "skyrimtracer@gmail.com",
    "City": "Bucharest",
    "Location description": "Splaiul Independenței 210, București 060012 - Grozavesti - Carrefour Orhideea Food Court -  Popeyes",
    "Plus.Code Coordinates": "https://plus.codes/8GP8C3W7+35",
    "Date": "4/21/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP at the email address",
    "GPS Coordinates": "44.4451875,26.0629375"
  },
  {
    "Region": "North America",
    "Name": "Kenan",
    "Email address": "kbitikofer@gmail.com",
    "City": "Corvallis",
    "Location description": "Laughing Planet, downtown Corvallis, Oregon.",
    "Plus.Code Coordinates": "https://plus.codes/84PRHP7R+R7C",
    "Date": "4/19/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "Kids/babies welcome.",
    "GPS Coordinates": "44.5645625,-123.2593594"
  },
  {
    "Region": "Europe",
    "Name": "Sergei",
    "Email address": "thesiegebot@gmail.com",
    "City": "Belgrade",
    "Location description": "D59B coffee shop",
    "Plus.Code Coordinates": "https://plus.codes/8GP2RFC5+Q7V",
    "Date": "4/6/2024",
    "Time": "11:00 AM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "44.8219875,20.4581719"
  },
  {
    "Region": "Europe",
    "Name": "Fantin",
    "Email address": "fantin.seguin@live.fr",
    "City": "Grenoble",
    "Location description": "We'll be in the Jardin de Ville, on the lawn near the cable car, with a small ACX Meetup sign",
    "Plus.Code Coordinates": "https://plus.codes/8FQ75PVG+3H",
    "Date": "4/20/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "I gave this meeting place but we can go to a bar or somewhere else afterwards",
    "GPS Coordinates": "45.1926875,5.726437499999999"
  },
  {
    "Region": "North America",
    "Name": "Sam Celarek",
    "Email address": "scelarek@gmail.com",
    "City": "Portland",
    "Location description": "1548 NE 15th Ave, Portland, OR 97232 - There will be a large sign outside of a building with the print \"Encorepreneur Cafe\" on the outside. Call me at 513-432-3310 if you can't find it!",
    "Plus.Code Coordinates": "https://plus.codes/84QVG8MX+MV4",
    "Date": "4/19/2024",
    "Time": "06:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP on Meetup so I know how much food to get.",
    "GPS Coordinates": "45.53413750000001,-122.6502969"
  },
  {
    "Region": "North America",
    "Name": "A J ",
    "Email address": "theswamp.here@gmail.com",
    "City": "Stone Lake",
    "Location description": "Stone Lake Lion's Hall, in the cafe area",
    "Plus.Code Coordinates": "https://plus.codes/86QCRFW6+5J6",
    "Date": "5/11/2024",
    "Time": "05:30 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "45.84541249999999,-91.5384844"
  },
  {
    "Region": "Europe",
    "Name": "Valts",
    "Email address": "valtskr@inbox.lv",
    "City": "Geneva",
    "Location description": "Alpine Botanical Garden in Meyrin, the round table/bench in the northern part",
    "Plus.Code Coordinates": "https://plus.codes/8FR863HM+23",
    "Date": "4/14/2024",
    "Time": "11:00 AM",
    "Event Link": "",
    "Notes": "I will be wearing a high vis jacket",
    "GPS Coordinates": "46.2275625,6.0826875"
  },
  {
    "Region": "Europe",
    "Name": "MB",
    "Email address": "acxzurich@proton.me",
    "City": "Zurich",
    "Location description": "Blatterwiese in front of the chinese garden. If it rains we will be under the roof inside the chinese garden (free entry).",
    "Plus.Code Coordinates": "https://plus.codes/8FVC9H32+V8",
    "Date": "4/27/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Please drop me a line at the email address given to be added to the mailing list.",
    "GPS Coordinates": "47.3546875,8.5508125"
  },
  {
    "Region": "Europe",
    "Name": "Timothy Underwood",
    "Email address": "timunderwood9@gmail.com",
    "City": "Budapest",
    "Location description": "The North East corner of Muzeumkert is the plan. There are a bunch of benches that we can move around to sit in a circle. If the weather is raining, or otherwise bad, we'll squeeze into the California Coffee co next to the Muzeumkert, which will hopefully have enough room since it will be on a Sunday.",
    "Plus.Code Coordinates": "https://plus.codes/8FVXF3R7+Q8",
    "Date": "4/14/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "47.4919375,19.0633125"
  },
  {
    "Region": "North America",
    "Name": "Nikita Sokolsky",
    "Email address": "Sokolx@gmail.com",
    "City": "Seattle",
    "Location description": "Stoup Brewing, 1158 Broadway, Seattle, WA 98122",
    "Plus.Code Coordinates": "https://plus.codes/84VVJM7H+4P",
    "Date": "4/28/2024",
    "Time": "05:00 PM",
    "Event Link": "https://www.lesswrong.com/events/cQBu6o8z894gRA6dj/acx-lw-seattle-spring-meetup-2024",
    "Notes": "Meetup will be in a brewery, they serve alcoholic and non alcoholic drinks. You can bring your own food. Event is here - https://www.facebook.com/events/925938142241186 If you need to get in touch 206-458-4791",
    "GPS Coordinates": "47.6128125,-122.3206875"
  },
  {
    "Region": "Europe",
    "Name": "Omar",
    "Email address": "info@rationality-freiburg.de",
    "City": "Freiburg im Breisgau",
    "Location description": "Haus des Engagements, Rehlingstraße 9 (inner courtyard), 79100 Freiburg",
    "Plus.Code Coordinates": "https://plus.codes/8FV9XRQQ+QQ9",
    "Date": "4/12/2024",
    "Time": "06:00 PM",
    "Event Link": "https://www.lesswrong.com/events/gfehNpbqqCvu5Boxn/freiburg-acx-spring-meetups-everywhere-2024",
    "Notes": "",
    "GPS Coordinates": "47.9894125,7.8394844"
  },
  {
    "Region": "Europe",
    "Name": "Levi",
    "Email address": "culyma@yahoo.fr",
    "City": "Munich",
    "Location description": "Botanical garden in Nymphenburg, under the roof of an east asian Pagoda",
    "Plus.Code Coordinates": "https://plus.codes/8FWH5G63+P2V",
    "Date": "5/11/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "48.1618625,11.5025469"
  },
  {
    "Region": "Europe",
    "Name": "Benjamin",
    "Email address": "b.rothenhaeusler@gmail.com",
    "City": "Ulm",
    "Location description": "Please RSVP on LessWrong so I know a bit how much snacks to bring: If the weather is bad, we will keep this meeting point, but will move over together to Cafe BellaVista. If the weather is fine, feel free to bring food, a blanket and cozy stuff, we'll picknick and chat in the meadow.",
    "Plus.Code Coordinates": "https://plus.codes/8FWF9XWR+3VV",
    "Date": "4/13/2024",
    "Time": "03:00 PM",
    "Event Link": "https://www.lesswrong.com/events/zNhJdX5atRCuk7e8S/ulm-germany-acx-meetups-everywhere-2024",
    "Notes": "Please RSVP on LessWrong so I know a bit how much snacks to bring: If the weather is bad, we will keep this meeting point, but will move over together to Cafe BellaVista. If the weather is fine, feel free to bring food, a blanket and cozy stuff, we'll picknick and chat in the meadow. ",
    "GPS Coordinates": "48.3952375,9.992171899999999"
  },
  {
    "Region": "Europe",
    "Name": "Benjamin Rothenhäusler",
    "Email address": "b.rothenhaeusler@gmail.com",
    "City": "Stuttgart",
    "Location description": "We'll meet at the Jubiläumssäule at the Schlossplatz and then search for a nice spot nearby. Watch for the guy with the white hat.",
    "Plus.Code Coordinates": "https://plus.codes/8FWFQ5HH+CW",
    "Date": "5/25/2024",
    "Time": "03:00 PM",
    "Event Link": "ttps://www.lesswrong.com/events/zNhJdX5atRCuk7e8S/ulm-germany-acx-meetups-everywhere-2024",
    "Notes": "Please RSVP on LessWrong so I know how much food to get. If the weather is bad, we will keep this meeting point, but will move over together to Cafe Mela. If the weather is fine, feel free to bring food, a blanket and cozy stuff, we'll picknick and chat in the meadow. ",
    "GPS Coordinates": "48.7785625,9.179812499999999"
  },
  {
    "Region": "Europe",
    "Name": "Marcus",
    "Email address": "acx@marcuswilhelm.de",
    "City": "Karlsruhe",
    "Location description": "location not sure yet, but I hope to reserve: Leih-Lokal Freiräume,  Gerwigstr. 41 76131 Karlsruhe",
    "Plus.Code Coordinates": "https://plus.codes/8FXC2C5H+CR",
    "Date": "4/27/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "49.0085625,8.4295625"
  },
  {
    "Region": "North America",
    "Name": "Jordan",
    "Email address": "j.verasamy@gmail.com",
    "City": "Vancouver",
    "Location description": "Dude Chilling Park, NW corner, with a big sign.",
    "Plus.Code Coordinates": "https://plus.codes/84XR7W73+P9",
    "Date": "4/13/2024",
    "Time": "11:00 AM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "49.2643125,-123.0965625"
  },
  {
    "Region": "Europe",
    "Name": "John",
    "Email address": "Jangliss@hotmail.com",
    "City": "Guernsey",
    "Location description": "Dorset Arms Public Bar (right hand side) ",
    "Plus.Code Coordinates": "https://plus.codes/8CXVFF26+32J",
    "Date": "5/11/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "49.4502125,-2.5399844"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Doris",
    "Email address": "siroddoris13@gmail.com",
    "City": "Georgetown",
    "Location description": "Hin Bus Deport, Matcha.Lah",
    "Plus.Code Coordinates": "https://plus.codes/6PQ2C86H+V7",
    "Date": "4/13/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "5.4121875,100.3281875"
  },
  {
    "Region": "Europe",
    "Name": "Frank",
    "Email address": "phraneck@gmail.com",
    "City": "Kraków",
    "Location description": "Rynek Dębnicki 3",
    "Plus.Code Coordinates": "https://plus.codes/9F2X3W2G+VQ",
    "Date": "4/6/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "50.0521875,19.9269375"
  },
  {
    "Region": "Europe",
    "Name": "Artem Batogovsky (or Forux)",
    "Email address": "https://t.me/forux",
    "City": "Kyiv",
    "Location description": "Ziferblat Cafe (Циферблат кафе)",
    "Plus.Code Coordinates": "https://plus.codes/9G2GCGW8+X8",
    "Date": "4/5/2024",
    "Time": "07:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP on our telegram: https://t.me/lwkyiv to make sure we are prepared for you =)",
    "GPS Coordinates": "50.4474375,30.5158125"
  },
  {
    "Region": "Europe",
    "Name": "Martin ",
    "Email address": "acxac@enc0.com ",
    "City": "Aachen",
    "Location description": "At Cafe Papillon, table will have an ACX sign. ",
    "Plus.Code Coordinates": "https://plus.codes/9F28Q3JH+8G",
    "Date": "4/6/2024",
    "Time": "07:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "50.7808125,6.078812500000001"
  },
  {
    "Region": "Europe",
    "Name": "Marcel Müller",
    "Email address": "marcel_mueller@mail.de",
    "City": "Cologne",
    "Location description": "Marienweg 43, 50858 Köln (Cologne)",
    "Plus.Code Coordinates": "https://plus.codes/9F28WRMX+97",
    "Date": "4/13/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "50.9334375,6.8481875"
  },
  {
    "Region": "North America",
    "Name": "David P",
    "Email address": "qwertie256@gmail.com",
    "City": "Calgary",
    "Location description": "Side Street Pub: 1167 Kensington Crescent NW. I'll bring an \"ACX\" sign with red letters.",
    "Plus.Code Coordinates": "https://plus.codes/95373W26+R8G",
    "Date": "4/27/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP on LessWrong",
    "GPS Coordinates": "51.0520625,-114.0891719"
  },
  {
    "Region": "North America",
    "Name": "Ryan W",
    "Email address": "marcus.infinitum@gmail.com",
    "City": "Calgary",
    "Location description": "Rising tides taproom, I'll have a sign with ACX Meetup on it.",
    "Plus.Code Coordinates": "https://plus.codes/95373RCR+F9",
    "Date": "4/13/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "The space is quietish and has games, good coffee, and good beer. Kids are ok. RSVP via my email so I know if anyone/how many are coming. Pick a couple of your favorite ACX-or-related articles to talk about.",
    "GPS Coordinates": "51.0711875,-114.1590625"
  },
  {
    "Region": "Europe",
    "Name": "Chris",
    "Email address": "ReadingACX@gmail.com",
    "City": "Reading",
    "Location description": "Double-Barrelled Brewery",
    "Plus.Code Coordinates": "https://plus.codes/9C3WFX7Q+7W",
    "Date": "4/13/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "51.4631875,-1.0101875"
  },
  {
    "Region": "Europe",
    "Name": "Sam",
    "Email address": "ssc@sambrown.eu",
    "City": "Oxford",
    "Location description": "The Star, Rectory Road - We'll be in the beer garden round the back, with a sign <3",
    "Plus.Code Coordinates": "https://plus.codes/9C3WPQX6+QM",
    "Date": "4/17/2024",
    "Time": "06:30 PM",
    "Event Link": "https://www.lesswrong.com/events/vnuaj5rCGnfXvaLac/oxrat-acx-meetups-everywhere-spring-2024",
    "Notes": "",
    "GPS Coordinates": "51.7494375,-1.2383125"
  },
  {
    "Region": "Europe",
    "Name": "Stian",
    "Email address": "stian.sgronlund@outlook.com",
    "City": "Nijmegen",
    "Location description": "The Yard Sportcafe in the Elinor Ostromgebouw, or possibly moving outside if there's nice weather.",
    "Plus.Code Coordinates": "https://plus.codes/9F37RV96+GX",
    "Date": "4/20/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "51.8188125,5.8624375"
  },
  {
    "Region": "Europe",
    "Name": "Hamish Todd",
    "Email address": "hamish.todd1@gmail.com",
    "City": "Cambridge",
    "Location description": "The Bath House",
    "Plus.Code Coordinates": "https://plus.codes/9F426439+J9",
    "Date": "4/20/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "We meet third Saturday afternoon of every month, in the same place (upstairs at the Bath house)! If you want to be alerted every time, you have to email me asking for that, we *don't* usually have lesswrong event pages",
    "GPS Coordinates": "52.2040625,0.1184375"
  },
  {
    "Region": "Europe",
    "Name": "Jan Rzymkowski",
    "Email address": "j.rzymkowski@gmail.com",
    "City": "Warsaw",
    "Location description": "Południk Zero, Wilcza 25",
    "Plus.Code Coordinates": "https://plus.codes/9G4362G8+2V",
    "Date": "5/12/2024",
    "Time": "04:00 PM",
    "Event Link": "",
    "Notes": "We're usually given the room downstairs. I'll be wearing a pink t-shirt.",
    "GPS Coordinates": "52.2250625,21.0171875"
  },
  {
    "Region": "Europe",
    "Name": "Milli",
    "Email address": "acx-meetups@martinmilbradt.de",
    "City": "Berlin",
    "Location description": "Big lawn at the center of Humboldthain",
    "Plus.Code Coordinates": "https://plus.codes/9F4MG9WP+36",
    "Date": "5/26/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "52.5451875,13.3855625"
  },
  {
    "Region": "Europe",
    "Name": "Rory",
    "Email address": "roryjordan525@gmail.com",
    "City": "Dublin",
    "Location description": "St. Steven's Green Shopping Centre Cafeteria  ",
    "Plus.Code Coordinates": "https://plus.codes/9C5M8PQQ+XH",
    "Date": "4/6/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "Time and date are highly flexible, if we can get more onboard. ",
    "GPS Coordinates": "53.3399375,-6.2610625"
  },
  {
    "Region": "Europe",
    "Name": "Lewis",
    "Email address": "acx.manchester@lcwf.de",
    "City": "Manchester",
    "Location description": "Ezra & Grill, 20 Hilton St, Manchester M1 1FR. I'll have a sign/whiteboard with 'ACX Meetup' on it. https://maps.app.goo.gl/BFQDGHgNL3cJ6hk6A",
    "Plus.Code Coordinates": "https://plus.codes/9C5VFQJ8+RR",
    "Date": "5/4/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP by email so I can book a sufficiently sized table/know if we'll outgrow it!",
    "GPS Coordinates": "53.4820625,-2.2329375"
  },
  {
    "Region": "Europe",
    "Name": "Peter W",
    "Email address": "mittgfu+acx@gmail.com",
    "City": "Hamburg",
    "Location description": "Paledo - Soulfood & Drinks, Kegelhofstraße 46, 20251 Hamburg",
    "Plus.Code Coordinates": "https://plus.codes/9F5FHXWH+38R",
    "Date": "4/6/2024",
    "Time": "01:00 PM",
    "Event Link": "",
    "Notes": "Please RSVP by email and optionally share your number. I'm expecting <= 4 people turnout and will change venue if more come.",
    "GPS Coordinates": "53.5952375,9.9782656"
  },
  {
    "Region": "Europe",
    "Name": "Tom",
    "Email address": "acx.vilnius@gmail.com",
    "City": "Vilnius",
    "Location description": "Lukiškių aikštė (Lukiškės Square). I'll be somewhere in the middle near the big flag pole holding an ACX sign.",
    "Plus.Code Coordinates": "https://plus.codes/9G67M7QC+Q8",
    "Date": "4/7/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "RSVP on LessWrong is preferred, but optional. Anyone even remotely interested in ACX, LW, or EA is welcome!",
    "GPS Coordinates": "54.6894375,25.2708125"
  },
  {
    "Region": "Europe",
    "Name": "Chris Goodall",
    "Email address": "wardle@live.fr",
    "City": "Newcastle-Durham",
    "Location description": "\"The Food Pit\" in the centre of Riverwalk mall, Framwelgate, next to the river. I will wear the Hawaiian shirt and hold the Astral Codex10 sign. Hopefully we'll make it up the steps to the cathedral but this is a step-free place to start.",
    "Plus.Code Coordinates": "https://plus.codes/9C6WQCGC+VH",
    "Date": "4/28/2024",
    "Time": "12:00 PM",
    "Event Link": "",
    "Notes": "If you're coming a long way by East Coast Main Line, be sure to check if breaking the journey saves you money.",
    "GPS Coordinates": "54.7771875,-1.5785625"
  },
  {
    "Region": "Europe",
    "Name": "Martin",
    "Email address": "martinpetersen64.mp@outlook.dk",
    "City": "Esbjerg",
    "Location description": "Meetup will be at a café named Bean Machine, at Kronprinsensgade 99, 6700 Esbjerg - Outside the Café there will be a little sign with \"ACX Meetup\" written upon it - and an additional sign will be at the relevant table. ",
    "Plus.Code Coordinates": "https://plus.codes/9F7CFCFX+G4",
    "Date": "4/20/2024",
    "Time": "10:00 AM",
    "Event Link": "",
    "Notes": "I will be there from 10 o'clock in the morning If noone shows up I will be gone by 2 in the afternoon. After 2 the café will close. But there is place right next to the café named Spiritusklubben where the meetup can be continued or we might go to my private home nearby depending on what we feel like. ",
    "GPS Coordinates": "55.47381249999999,8.4478125"
  },
  {
    "Region": "Europe",
    "Name": "Søren Elverlin",
    "Email address": "soeren.elverlin@gmail.com",
    "City": "Copenhagen",
    "Location description": "Rundholtsvej 10, 2300 Copenhagen S",
    "Plus.Code Coordinates": "https://plus.codes/9F7JMH38+GFM",
    "Date": "5/11/2024",
    "Time": "03:00 PM",
    "Event Link": "",
    "Notes": "RSVP on LessWrong",
    "GPS Coordinates": "55.65383749999999,12.5661719"
  },
  {
    "Region": "Europe",
    "Name": "Sam",
    "Email address": "acxedinburgh@gmail.com",
    "City": "Edinburgh",
    "Location description": "Braid room, 2nd floor, Pleasance (turn right when you go under an archway into the courtyard)",
    "Plus.Code Coordinates": "https://plus.codes/9C7RWRW9+W7",
    "Date": "5/4/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "We generally 'assign' 3 essays to lightly guide the discussion, so make sure you join the mailing list to find out what they'll be for this meetup (I haven't decided yet)",
    "GPS Coordinates": "55.9473125,-3.1818125"
  },
  {
    "Region": "Europe",
    "Name": "ildar",
    "Email address": "niya3@mail.ru",
    "City": "Nizhny Novgorod",
    "Location description": "We will be sitting on benches next to the stage in the center of Pushkin Park. There will be an \"ACX MEETUP\" sign",
    "Plus.Code Coordinates": "https://plus.codes/9H858X5W+FP",
    "Date": "5/25/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "56.3086875,43.9968125"
  },
  {
    "Region": "Europe",
    "Name": "Andrew",
    "Email address": "andrew_n_west@yahoo.co.uk",
    "City": "Tallinn",
    "Location description": "Tops, Soo 15, Kalamaja.  I'll bring a sign, hopefully.",
    "Plus.Code Coordinates": "https://plus.codes/9GF6CPWQ+8H",
    "Date": "4/13/2024",
    "Time": "07:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "59.4458125,24.7389375"
  },
  {
    "Region": "Europe",
    "Name": "Mak",
    "Email address": "kellendros95@gmail.com",
    "City": "Saint-Petersburg",
    "Location description": "пер. Гривцова 22, открытое пространство \"Каледонский Лес\", малый или средний зал",
    "Plus.Code Coordinates": "https://plus.codes/9GFGW8H8+8Q",
    "Date": "4/10/2024",
    "Time": "05:00 PM",
    "Event Link": "",
    "Notes": "",
    "GPS Coordinates": "59.9283125,30.3169375"
  },
  {
    "Region": "Europe",
    "Name": "Anna",
    "Email address": "2002anna.anna2002@gmail.com",
    "City": "Oslo",
    "Location description": "We'll meet up at the Songsvann metro station at 14:00, I'll be holding an ACX sign. If the weather is good, we'll be outside by the lake. If the weather is bad, we can go to my apartment in Kringsjå. ",
    "Plus.Code Coordinates": "https://plus.codes/9FFGXP8M+WF",
    "Date": "5/11/2024",
    "Time": "02:00 PM",
    "Event Link": "",
    "Notes": "Please send an email if you plan on coming. If the weather is good, kids and dogs are very welcome!",
    "GPS Coordinates": "59.96731249999999,10.7336875"
  },
  {
    "Region": "North America",
    "Name": "\"Ferret\"",
    "Email address": "meetup2024.exposure178@passinbox.com",
    "City": "Fort Meade",
    "Location description": "Burba Lake; Coordinator will *not* sponsor attendees to location",
    "Plus.Code Coordinates": "Email coordinator for precise location",
    "Date": "5/4/2024",
    "Time": "12:00 PM",
    "Event Link": "",
    "Notes": "Techies and family types alike are welcome. Title/position agnostic (wear comfortable clothes). 🦗",
    "GPS Coordinates": "Invalid URL"
  }
]
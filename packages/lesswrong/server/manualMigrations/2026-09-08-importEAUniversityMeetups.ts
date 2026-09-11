import { registerMigration } from './migrationUtils';
import { Posts } from '../../server/collections/posts/collection';
import { mapsAPIKeySetting } from '@/lib/publicSettings';
import { getLocalTime } from '../mapsUtils';
import {userFindOneByEmail} from "../commonQueries";
import { writeFile } from 'fs/promises';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';
import { createUser } from '../collections/users/mutations';
import { createPost } from '../collections/posts/mutations';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';

function stubGoogleLocation({ lat, lng }: { lat: string, lng: string }) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  return {
    formatted_address: `${lat},${lng}`,
    geometry: {
      location: { lat: latitude, lng: longitude },
    },
  };
}

async function coordinatesToGoogleLocation({ lat, lng }: { lat: string, lng: string }) {
  const apiKey = mapsAPIKeySetting.get();
  if (!apiKey) {
    return stubGoogleLocation({ lat, lng });
  }

  try {
    const requestOptions: any = {
      method: 'GET',
      redirect: 'follow'
    };

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`, requestOptions)
    const responseText = await response.text()
    const responseData = JSON.parse(responseText)
    return responseData.results[0] ?? stubGoogleLocation({ lat, lng });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log({ err, lat, lng }, 'Geocoding failed, using coordinate stub');
    return stubGoogleLocation({ lat, lng });
  }
}

function primaryEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  return email.split(';')[0].trim() || undefined;
}

function plusCodeFromField(raw: string): string {
  const match = raw.match(/[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
  if (match) return match[0].toUpperCase();
  return raw.replace(/^https?:\/\/plus\.codes\//i, '').trim();
}

function plusCodeHref(raw: string): string {
  const code = plusCodeFromField(raw);
  if (code.startsWith('http')) return code;
  return `https://plus.codes/${code}`;
}

function meetupTitle(row: EAUniversityMeetup, allRows: EAUniversityMeetup[]) {
  const base = `${row["University"]} (${row["City"]}) – EA University Meetups Fall 2026`;
  const collisions = allRows.filter(other => other["University"] === row["University"] && other["City"] === row["City"]);
  return collisions.length > 1 ? `${base} – ${row["Date"]}` : base;
}

export default registerMigration({
  name: "importEAUniversityMeetupsFall26",
  dateWritten: "2026-09-08",
  idempotent: true,
  action: async () => {
    const eventCacheContents: { _id: string, lat: number, lng: number }[] = [];

    // LessWrong default reviewer. Used when creating accounts for new organizers.
    const adminId = 'XtphY3uYHwruKqDyG';

    // eslint-disable-next-line no-console
    console.log("Begin importing EA University Meetups");
    for (const row of eaUniversityMeetupData) {
      let eventOrganizer
      // Figure out whether user with email address already exists
      // This used to be userFindByEmail from /lib/vulcan-users/helpers. That seems to have become userFindOneByEmail from /lib/collections/users/commonQueries, but you should check that those actually behaved the same.
      const email = primaryEmail(row["Email address"]);
      const existingUser = email ? await userFindOneByEmail(email) : undefined;
      // If not, create them (and send them an email, maybe?)
      if (existingUser) {
        eventOrganizer = existingUser
      } else {
        const username = await getUnusedSlugByCollectionName("Users", row["Name"].toLowerCase());
        try {
          const userDoc = {
            username,
            displayName: row["Name"],
            email: email,
            reviewedByUserId: adminId,
            reviewedAt: new Date()
          };

          const newUser = await createUser({ data: userDoc }, createAnonymousContext());
          eventOrganizer = newUser
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log({ err, email, row }, 'Error when creating a new user, using a different username');

          const userDoc = {
            username: `${username}-fall-ea-uni-26`,
            displayName: row["Name"],
            email: email,
            reviewedByUserId: adminId,
            reviewedAt: new Date()
          };

          const newUser = await createUser({ data: userDoc }, createAnonymousContext());
          eventOrganizer = newUser
        }
      }
      
      //Use the coordinates to get the location
      const [latitude, longitude] = row["GPS Coordinates"].split(",");
      const title = meetupTitle(row, eaUniversityMeetupData);
      const plusCode = plusCodeFromField(row["Plus.Code Coordinates"]);
      const plusCodeUrl = plusCodeHref(row["Plus.Code Coordinates"]);

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
          contactInfo: email,
          location: `${row["University"]}, ${row["City"]}`,
          startTime: eventTimePretendingItsUTC.getTime() ? actualTime : undefined,
          meetupLink: meetupUrlExists ? eventUrl : undefined,
          facebookLink: fbUrlExists ? eventUrl : undefined,
          googleLocation,
          contents: {
            originalContents: {
              type: 'ckEditorMarkup',
              data: `<p>This year's Fall EA University Meetup at ${row["University"]} in ${row["City"]}.</p>
                <p>Location: ${row["Location description"]} – <a href="${plusCodeUrl}">${plusCode}</a></p>
                ${row["Group Link"] ? `<p>Group Link: ${row["Group Link"]}</p>` : ""}
                ${row["Notes"] ? `<p>${row["Notes"]}</p>` : ""}
                <p>Contact: ${email ?? ""} ${row["Additional contact info"] ? `– ${row["Additional contact info"]}` : ""}</p>`
            },
            updateType: 'minor',
            commitMessage: ''
          },
          moderationStyle: 'easy-going',
          af: false,
          authorIsUnreviewed: false,
          types: [
            'EA'
          ],
        };
        
        const newPost = await createPost({ data: newPostData }, await computeContextFromUser({ user: eventOrganizer, isSSR: false }));

        // eslint-disable-next-line no-console
        console.log("Created new EA University Meetup: ", newPost.title);
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
    console.log("End importing EA University Meetups.");

    await writeFile('eventCache.json', JSON.stringify(eventCacheContents, null, 2))
  }
})

interface EAUniversityMeetup {
  Region: string
  "Name": string
  "Email address": string
  "University": string
  "City": string
  "State/Province": string
  "Country": string
  "Location description": string
  "Plus.Code Coordinates": string
  "Date": string
  "Time": string
  "GPS Coordinates": string
  "Event Link"?: string
  "Group Link"?: string
  Notes?: string
  "Additional contact info"?: string
}

// Paste the Fall 2026 EA University Meetup rows here.
const eaUniversityMeetupData: EAUniversityMeetup[] = [
  {
    "Region": "North America",
    "Name": "Mohamed Abdelmeguid",
    "Email address": "impact-exec@mit.edu",
    "University": "MIT (Massachusetts Institute of Technology)",
    "City": "Cambridge",
    "State/Province": "Massachusetts",
    "Country": "United States of America",
    "Location description": "Room not confirmed yet and will most likely not be the one here. We are filling this form on Aug 29th, as we just learned about it \nMIT Building 5, Room 5-133. Go to the entrance on Mass Ave. Go up the stairs and then turn left. There will be a door with an EA Meetup Sign.",
    "Plus.Code Coordinates": "87JC9W54+CV",
    "Date": "9/23/2026",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "RSVP encouraged for food estimate but not required: https://forms.gle/4YCWFyxXWEy1Hd1U7",
    "GPS Coordinates": "42.358562500000005,-71.09281250000001"
  },
  {
    "Region": "North America",
    "Name": "Eliana Du",
    "Email address": "elianadu24@gmail.com",
    "University": "Rutgers University, New Brunswick",
    "City": "New Brunswick",
    "State/Province": "NJ",
    "Country": "USA",
    "Location description": "College Ave Student Center - I don't have a room booked, but I'll be in a common area with an EA MEETUP sign.",
    "Plus.Code Coordinates": "87G7GG3X+37",
    "Date": "10/10/2026",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Please RSVP at https://tinyurl.com/rutgerseameetup (you can edit your response later)! \n\nIf you can't make this meetup but are interested in future Rutgers EA events, please fill out the RSVP with your contact info and RSVP 'No'.",
    "GPS Coordinates": "40.5026875,-74.4518125"
  },
  {
    "Region": "North America",
    "Name": "Adit",
    "Email address": "organizers@eautexas.org",
    "University": "University of Texas at Austin",
    "City": "Austin",
    "State/Province": "Texas",
    "Country": "United States",
    "Location description": "At the tables behind Cava. I'll be at a table with an EA meetup sign. This is the address of the Cava: 2426 Guadalupe StreetAustin, TX, 78705",
    "Plus.Code Coordinates": "862477Q5+96V",
    "Date": "9/17/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "Here's an invite link to our Slack: https://join.slack.com/t/effectivealtr-4mk3608/shared_invite/zt-46ndoavyp-w37LxnI~aYDinGbZFHk7yg",
    "Notes": "",
    "GPS Coordinates": "30.2884875,-97.741953125"
  },
  {
    "Region": "North America",
    "Name": "Aman Kai Sidhant",
    "Email address": "amansidhant@gmail.com",
    "University": "Columbia University - Columbia Business School",
    "City": "New York",
    "State/Province": "New York",
    "Country": "United States",
    "Location description": "Columbia Business School campus (will book room based on sign ups)",
    "Plus.Code Coordinates": "87G8R29R+5P",
    "Date": "10/2/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/E9NbA15mpxLE1SadPFS3zi?s=cl&p=i&ilr=4&amv=0",
    "Notes": "Please RSVP so I know how much food to get\n\nhttps://partiful.com/e/FYwwEW4kkZt6qlHFPtf7?c=QOUhn8UT",
    "GPS Coordinates": "40.8179375,-73.95818750000001"
  },
  {
    "Region": "North America",
    "Name": "Annika and Ben",
    "Email address": "annikalb@umich.edu",
    "University": "University of Michigan -- Ann Arbor",
    "City": "Ann Arbor",
    "State/Province": "MI",
    "Country": "United States",
    "Location description": "Most likely Mason Hall (meeting room will be determined on August 31st)",
    "Plus.Code Coordinates": "86JR77G6+R6",
    "Date": "9/16/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/EkbPwP798A4ALXL4pv15k8?mode=gi_t",
    "Notes": "Open to students and non-students. Vegan dinner will be provided. PLEASE RSVP here so we can order enough food: https://partiful.com/e/FF4Cznbev7oOKbrlgJva?c=QDJ_yKhk",
    "GPS Coordinates": "42.2770625,-83.73943750000001"
  },
  {
    "Region": "North America",
    "Name": "Utkarsh",
    "Email address": "utkarsh6@illinois.edu",
    "University": "University of Illinois Urbana Champaign",
    "City": "Champaign",
    "State/Province": "Illinois",
    "Country": "United States",
    "Location description": "Not confirmed yet. Best guess - EA Meetup Table at Anniversary Plaza (In front of Illini Union, towards the Main Quad)",
    "Plus.Code Coordinates": "86GH4Q5F+H4W",
    "Date": "9/27/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/N7TNwvzE4",
    "Notes": "Come chat and eat free pizza!",
    "GPS Coordinates": "40.1089875,-88.227171875"
  },
  {
    "Region": "North America",
    "Name": "Isaac",
    "Email address": "ismalley@usc.edu",
    "University": "University of Southern California",
    "City": "Los Angeles",
    "State/Province": "California",
    "Country": "United States",
    "Location description": "The tables in front of Leavey Library towards the McCarthy Quad. Just go up the few steps towards the main entrance of the library and you should see us on your right. I'll have a USC EA MEETUP sign on the table!",
    "Plus.Code Coordinates": "85632PC8+JVF",
    "Date": "9/16/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "RSVP here for guaranteed free pizza: https://luma.com/xl62hrz1. Or just show up!",
    "GPS Coordinates": "34.0215625,-118.282828125"
  },
  {
    "Region": "North America",
    "Name": "Andrew",
    "Email address": "andrew.cai@yale.edu",
    "University": "Yale University",
    "City": "New Haven",
    "State/Province": "Connecticut",
    "Country": "USA",
    "Location description": "The area in front of Sterling memorial library facing the grass",
    "Plus.Code Coordinates": "87H9836C+9Q",
    "Date": "9/23/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "41.3109375,-72.9280625"
  },
  {
    "Region": "North America",
    "Name": "Harper",
    "Email address": "tucsoneffectivealtruism@gmail.com",
    "University": "University of Arizona",
    "City": "Tucson",
    "State/Province": "Arizona",
    "Country": "USA",
    "Location description": "Room booking not confirmed yet. Most likely Main Library Data Studio (Main Library, B201)",
    "Plus.Code Coordinates": "854F63J2+CC5",
    "Date": "9/18/2026",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/BHaphQ9ZJc",
    "Notes": "Free food, a short intro presentation, and conversation starters",
    "GPS Coordinates": "32.231012500000006,-110.94889062499999"
  },
  {
    "Region": "North America",
    "Name": "Tyler Tone",
    "Email address": "tyler.tone517@gmail.com",
    "University": "University of Virginia",
    "City": "Charlottesville",
    "State/Province": "Virginia",
    "Country": "United States",
    "Location description": "The Virginian Restaurant on University Avenue, I'll have a sign and white polo",
    "Plus.Code Coordinates": "87C32FPX+4P",
    "Date": "9/24/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "I'd be happy to create a Partiful if that's advised, but I don't think it's necessary.",
    "GPS Coordinates": "38.03531249999999,-78.5006875"
  },
  {
    "Region": "North America",
    "Name": "Micah Hees",
    "Email address": "micahhees@gmail.com",
    "University": "University of Wisconsin-Madison",
    "City": "Madison",
    "State/Province": "Wisconsin",
    "Country": "USA",
    "Location description": "Room booking tbd, but could be the caucus room on the 4th floor",
    "Plus.Code Coordinates": "86MG3JF2+2C",
    "Date": "9/13/2026",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://eauw.org/",
    "Notes": "",
    "GPS Coordinates": "43.072562500000004,-89.3989375"
  },
  {
    "Region": "North America",
    "Name": "Joseph Kostousov",
    "Email address": "yosya.kostousov@proton.me",
    "University": "University of Toronto",
    "City": "Toronto",
    "State/Province": "Ontario",
    "Country": "Canada",
    "Location description": "Kings College Circle, in front of the Gerstein library steps.",
    "Plus.Code Coordinates": "87M2MJ64+R7",
    "Date": "9/20/2026",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/EHzqkBXsPF",
    "Notes": "Free pizza, open to students and non-students alike.",
    "GPS Coordinates": "43.662062500000005,-79.3943125"
  },
  {
    "Region": "North America",
    "Name": "Silas",
    "Email address": "silas1james@gmail.com",
    "University": "American University - Washington, DC (AU)",
    "City": "Washington",
    "State/Province": "DC",
    "Country": "USA",
    "Location description": "The basement patio at the American University School of International Service. Walk to the Davenport Coffee Lounge, then walk along the right side of the SIS Building (across from the library) and you will see the steps to the patio on your left. There will be signs pointing you toward the meetup. The SIS building is across from the corner of Nebraska Ave NW and New Mexico Ave NW.",
    "Plus.Code Coordinates": "87C4WWP6+6G3",
    "Date": "9/14/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Open to students and non-students alike. Open to people involved in EA, along with anyone who cares about AI policy.",
    "GPS Coordinates": "38.9355125,-77.088703125"
  },
  {
    "Region": "North America",
    "Name": "Will Ryan",
    "Email address": "Wkryan2005@gmail.com",
    "University": "University of California, Los Angeles",
    "City": "Los Angeles",
    "State/Province": "CA",
    "Country": "United States",
    "Location description": "Ackerman Student Union Building, Room 2408",
    "Plus.Code Coordinates": "85633HC4+58",
    "Date": "9/28/2026",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/EpHzRuS8x",
    "Notes": "Meeting is open to students and non-students. Free food (falafel!) will be served! Please RSVP using this google form so we know how much food to order. \n\nhttps://docs.google.com/forms/d/e/1FAIpQLSebNt6sztCmb0o_FQEFF5lo4PC0i0B7NkOYTNrpVmcx9zB1ow/viewform?usp=publish-editor",
    "GPS Coordinates": "34.0704375,-118.4441875"
  },
  {
    "Region": "North America",
    "Name": "Armie R.",
    "Email address": "ar21@williams.edu",
    "University": "Williams College",
    "City": "Williamstown",
    "State/Province": "MA",
    "Country": "United States",
    "Location description": "Paresky Center, 39 Chapin Hall Dr, Williamstown, MA 01267; Room TBA (will be posted on Partiful)",
    "Plus.Code Coordinates": "87J8PQ7W+G4",
    "Date": "10/4/2026",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Both students and non-students are welcome. Please RSVP using Partiful: https://partiful.com/e/JYWrD34MBTzsMI9VQUCs",
    "GPS Coordinates": "42.71381249999999,-73.2046875"
  },
  {
    "Region": "North America",
    "Name": "Sofia",
    "Email address": "sguimaraes@uchicago.edu",
    "University": "University of Chicago",
    "City": "Chicago",
    "State/Province": "IL",
    "Country": "USA",
    "Location description": "1100 E 58th St, Chicago, IL 60637",
    "Plus.Code Coordinates": "86HJQCQ2+R4",
    "Date": "10/22/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://uchicagoea.org/",
    "Notes": "Please RSVP here: https://forms.gle/sPzvh8cFhi9Pw8gd7",
    "GPS Coordinates": "41.78956249999999,-87.5996875"
  },
  {
    "Region": "North America",
    "Name": "Lily Z",
    "Email address": "effectivealtruismwashu@gmail.com",
    "University": "Washington University in St. Louis",
    "City": "St. Louis",
    "State/Province": "Missouri",
    "Country": "USA",
    "Location description": "Danforth University Center (DUC) Room 241",
    "Plus.Code Coordinates": "86CFJMWQ+XR",
    "Date": "9/13/2026",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "washuimpact.com",
    "Notes": "Free pizza",
    "GPS Coordinates": "38.647437499999995,-90.3104375"
  },
  {
    "Region": "North America",
    "Name": "Binit",
    "Email address": "binitm@protonmail.com",
    "University": "George Mason University",
    "City": "Fairfax",
    "State/Province": "VA",
    "Country": "USA",
    "Location description": "A room in the JC that has not been booked. Will meet in a meet in a public common area as a backup.",
    "Plus.Code Coordinates": "87C4RMHV+W3",
    "Date": "9/11/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "Signal: https://signal.group/#CjQKIAi1t0A__ZD7kUf6pJXihgaVIyy8T5WFUr4rJksSE711EhAI1z9CBR_0oJLT2MMOJ_ue",
    "Notes": "Open to anyone who is interested. Join the signal group and introduce yourself!",
    "GPS Coordinates": "38.82981249999999,-77.3073125"
  },
  {
    "Region": "North America",
    "Name": "Daniel Lee, Niranjan Nair, and Sarvesh Prabhu",
    "Email address": "cornelleffectivealtruism@gmail.com",
    "University": "Cornell University",
    "City": "Ithaca",
    "State/Province": "NY",
    "Country": "US",
    "Location description": "Willard Straight Hall 414 - International Lounge (above Okenshields Dining Hall back door)",
    "Plus.Code Coordinates": "87J5CGW7+JQ",
    "Date": "9/26/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "https://join.slack.com/t/cornelleffect-ncy9991/shared_invite/zt-48ka3sdjk-rjIz2pXiOrtYkdKziMD9Mw",
    "Notes": "Please RSVP so we can get enough food for everyone!",
    "GPS Coordinates": "42.4465625,-76.4855625"
  },
  {
    "Region": "North America",
    "Name": "Enzo DiMasi",
    "Email address": "enzo_dimasi@brown.edu",
    "University": "Brown University",
    "City": "Providence",
    "State/Province": "RI",
    "Country": "USA",
    "Location description": "Sayles Hall 306\nEnter on the Main Green and walk up to the third floor. Look for the EA MEETUP sign. \n\n(I requested this room but it hasn’t been approved yet)",
    "Plus.Code Coordinates": "87HCRHGW+FX",
    "Date": "9/17/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "41.82618749999999,-71.4025625"
  },
  {
    "Region": "North America",
    "Name": "Will",
    "Email address": "effectivealtruismatuva@gmail.com",
    "University": "University of Virginia",
    "City": "Charlottesville",
    "State/Province": "Virginia",
    "Country": "United States",
    "Location description": "Clark Hall 101 (first door on the left when entering main entrance)",
    "Plus.Code Coordinates": "87C32FMR+8XF",
    "Date": "9/21/2026",
    "Time": "08:30 PM",
    "Event Link": "",
    "Group Link": "eauva.org",
    "Notes": "",
    "GPS Coordinates": "38.033312499999994,-78.507578125"
  },
  {
    "Region": "North America",
    "Name": "Finn",
    "Email address": "fjamescairns@gmail.com",
    "University": "Dartmouth College",
    "City": "Hanover",
    "State/Province": "NH",
    "Country": "United States",
    "Location description": "Kemeny/Haldeman courtyard, at the tables at the patio (not the ones on the path down below). I'll have a sign that says EA. If weather is poor will be in a Novack room (plan for 70, but will have a sign still).",
    "Plus.Code Coordinates": "87M9PP46+GCJ",
    "Date": "9/21/2026",
    "Time": "03:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "43.706337500000004,-72.288984375"
  },
  {
    "Region": "North America",
    "Name": "Elanor",
    "Email address": "eb3760@barnard.edu",
    "University": "Columbia University",
    "City": "New York",
    "State/Province": "NY",
    "Country": "USA",
    "Location description": "Room booking is not confirmed yet but will most likely be a study room in Butler Library or a reserved classroom in Hamilton Hall",
    "Plus.Code Coordinates": "87G8R24Q+M7",
    "Date": "10/23/2026",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "To the organizers of this document: because Columbia's EA chapter is not yet officially recognized by the University there are quite a few hoops to jump through in order to secure a meeting spot thus it's subject to change. Where I have listed is most likely, but the location and/or the date may have to change in order to accommodate the university and a certain capacity of attendees. I will of course communicate should these changes occur. \n\nFree Pizza!!\nCasual info session, no previous knowledge required, everyone welcome!\nRSVP at this form: https://forms.gle/KaHov385To4RqrxE6",
    "GPS Coordinates": "40.806687499999995,-73.96181250000001"
  },
  {
    "Region": "North America",
    "Name": "Ava",
    "Email address": "georgetowneffectivealtruism@gmail.com",
    "University": "Georgetown University, Hilltop Campus",
    "City": "Georgetown",
    "State/Province": "DC",
    "Country": "USA",
    "Location description": "White-Gravenor Hall Esplanade, which is just in front of White-Gravenor",
    "Plus.Code Coordinates": "87C4WW5H+G2",
    "Date": "9/14/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://airtable.com/appj06Ih7eMNGZGBq/shraE60zqjSNMjdJ0",
    "Notes": "Open to both undergrad and graduate.",
    "GPS Coordinates": "38.908812499999996,-77.0724375"
  },
  {
    "Region": "North America",
    "Name": "Peach Tree",
    "Email address": "peachtreecity1234@gmail.com",
    "University": "Georgia Tech",
    "City": "Atlanta",
    "State/Province": "Georgia",
    "Country": "USA",
    "Location description": "​Balcony b/w Crosland & Price Gilbert Library, Georgia Tech\nDirections to find: When you walk along the pathway between Crosland tower and the Price Gilbert library, you'll be able to walk into a balcony on the side of Crosland tower. It's right outside the first floor. I'll be wearing a black shirt with an EA Meetup sign on the table. There'll also be food!",
    "Plus.Code Coordinates": "865QQJF3+PR5",
    "Date": "9/15/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "https://luma.com/7gwdwkga",
    "Notes": "Free Moe's! Please RSVP because I might change location (though if you forget, that's cool too)! Link: https://luma.com/7gwdwkga",
    "GPS Coordinates": "33.774262500000006,-84.39539062499999"
  },
  {
    "Region": "North America",
    "Name": "Adele and Sefika",
    "Email address": "adele.l.shen@vanderbilt.edu",
    "University": "Vanderbilt University",
    "City": "Nashville",
    "State/Province": "TN",
    "Country": "The United States",
    "Location description": "Rand Hall - Rand 306",
    "Plus.Code Coordinates": "868M45WW+HP",
    "Date": "9/26/2026",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "https://groupme.com/join_group/117035240/K9BGQbDT",
    "Notes": "Will send link to RSVP in the Vanderbilt GroupMe",
    "GPS Coordinates": "36.146437500000005,-86.8031875"
  },
  {
    "Region": "North America",
    "Name": "ZG",
    "Email address": "eacaltech@gmail.com",
    "University": "Caltech",
    "City": "Pasadena",
    "State/Province": "California",
    "Country": "USA",
    "Location description": "Red Door Patio",
    "Plus.Code Coordinates": "85634VPG+WG",
    "Date": "10/13/2026",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Let's revive EA at Caltech! I will need help to organize further events, so please get in touch!",
    "GPS Coordinates": "34.1373125,-118.1236875"
  },
  {
    "Region": "North America",
    "Name": "Brittney Nial",
    "Email address": "bnial@ucsd.edu",
    "University": "University of California, San Diego",
    "City": "San Diego",
    "State/Province": "California",
    "Country": "United States of America",
    "Location description": "We will be in one of the group study rooms in the Geisel Library. Booking opens 2 weeks prior, so the exact room is not yet confirmed, but we will aim for the Leisure Lounge (1 Southwest) or the Geisel Large Adaptive Study Room (GLASS).",
    "Plus.Code Coordinates": "8544VQJ6+FX",
    "Date": "10/10/2026",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "\"Free pizza\"; \"Open to UCSD students, staff, and faculty!\"; \"Please RSVP so we can order enough food\"\n\nhttps://partiful.com/e/GWPxZiaktd82wBz1Wum6?c=dIKPQaSx",
    "GPS Coordinates": "32.881187499999996,-117.2375625"
  },
  {
    "Region": "North America",
    "Name": "Micah Zarin & Lily Curry",
    "Email address": "micahzarin@gmail.com",
    "University": "Binghamton University",
    "City": "Binghamton",
    "State/Province": "NY",
    "Country": "USA",
    "Location description": "Chenango Champlain Collegiate Center (C4), 662 East Drive, Vestal, NY 13850. C4 is the collegiate center shared by the Newing and Dickinson residential communities. Look for an “EA MEETUP” sign, and we’ll direct you to the room",
    "Plus.Code Coordinates": "87J632QP+2V",
    "Date": "9/17/2026",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://www.instagram.com/binghamtoneffectivealtruism?igsi=MWJoYW1nMHJpdTFyNA%3D%3D&utm_source=qr",
    "Notes": "Free food. Lots of food.",
    "GPS Coordinates": "42.087562500000004,-75.9628125"
  },
  {
    "Region": "North America",
    "Name": "Idan",
    "Email address": "idan.davidovich@case.edu",
    "University": "Case Western Reserve University",
    "City": "Cleveland",
    "State/Province": "Ohio",
    "Country": "United States",
    "Location description": "Kevin Smith Library Lower Level (Tentative)",
    "Plus.Code Coordinates": "86HWG94R+X5",
    "Date": "10/5/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/HgBsUDr7Z",
    "Notes": "The inaugural EA meeting at CWRU!\nPlease RSVP so we can notify you if the location changes: https://forms.gle/yhj8CUBVJNmKLUsh7",
    "GPS Coordinates": "41.5074375,-81.6095625"
  },
  {
    "Region": "North America",
    "Name": "Hazem Hassan",
    "Email address": "upenneffectivealtruism@gmail.com",
    "University": "Penn",
    "City": "Philadelphia",
    "State/Province": "PA",
    "Country": "US",
    "Location description": "Lauder Media Room, Lauder College House, 3335 Woodland Walk, Philadelphia, PA 19104",
    "Plus.Code Coordinates": "87F6XR35+FF",
    "Date": "9/11/2026",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://www.eapenn.org/events",
    "Notes": "Food provided!",
    "GPS Coordinates": "39.9536875,-75.1913125"
  },
  {
    "Region": "North America",
    "Name": "Matthew",
    "Email address": "harvardea@gmail.com",
    "University": "Harvard University",
    "City": "Cambridge",
    "State/Province": "MA",
    "Country": "United States",
    "Location description": "Harvard Yard, Cambridge, MA 02138 — on the lawn in front of the Widener Library steps.\n\nEasiest route: enter through Johnston Gate, the big ornamental iron gate on Massachusetts Ave across from the Smith Campus Center and the Harvard Square T stop. Walk straight ahead through the Yard. You'll pass University Hall with the John Harvard statue in front of it. Keep going past it into the open lawn — Widener Library is the enormous building with the wide stone steps and columns on your right, and Memorial Church with the white steeple is on your left. We'll be on the grass near the bottom of the Widener steps. There will likely be a sign that says something like \"EA Meetup\"",
    "Plus.Code Coordinates": "87JC9VFM+JF",
    "Date": "10/24/2026",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "https://harvardundergradea.org/",
    "Notes": "",
    "GPS Coordinates": "42.3740625,-71.1163125"
  },
  {
    "Region": "North America",
    "Name": "Jack",
    "Email address": "jcm27@rice.edu",
    "University": "Rice University",
    "City": "Houston",
    "State/Province": "Texas",
    "Country": "United States",
    "Location description": "Ralph S. O’Connor Building for Engineering and Science (Room TBD)",
    "Plus.Code Coordinates": "76X6PH9W+4X",
    "Date": "9/19/2026",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://www.instagram.com/impactrice/",
    "Notes": "Free food — open to students and non-students alike.",
    "GPS Coordinates": "29.7178125,-95.4025625"
  },
  {
    "Region": "North America",
    "Name": "Ahmad Dagher",
    "Email address": "StanfordEAexec@gmail.com",
    "University": "Stanford University",
    "City": "Palo Alto",
    "State/Province": "California",
    "Country": "United States",
    "Location description": "Room booking isn't confirmed yet! Here's our best guess:\n\nToyon Hall Lounge--eastern side of campus, 455 Arguello Way, Stanford, CA 94305, main entrance, first floor. There will be an EA MEETUP sign on the door.",
    "Plus.Code Coordinates": "849VCRGP+CJ",
    "Date": "10/13/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "Mailing list: https://mailman.stanford.edu/mailman/listinfo/effective-altruism",
    "Notes": "Free Pizza (vegan & nonvegan) and Boba!",
    "GPS Coordinates": "37.4260625,-122.1634375"
  },
  {
    "Region": "North America",
    "Name": "Ayan",
    "Email address": "ayan.sivaram@gmail.com",
    "University": "New York University",
    "City": "New York",
    "State/Province": "NY",
    "Country": "United States",
    "Location description": "Kimmel Center for University Life (). Go through the main entrance that directly faces the park and look for a person in the lobby with a sign that says EA Meetup!",
    "Plus.Code Coordinates": "87G8P2H2+XR",
    "Date": "9/16/2026",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "https://engage.nyu.edu/organization/effective-altruism-at-nyu-all-university",
    "Notes": "",
    "GPS Coordinates": "40.7299375,-73.9979375"
  },
  {
    "Region": "North America",
    "Name": "Xiyue Zhang",
    "Email address": "xiyue@unc.edu",
    "University": "University of North Carolina at Chapel Hill",
    "City": "Chapel Hill",
    "State/Province": "North Carolina",
    "Country": "United States",
    "Location description": "Most likely in the Carolina Union, though I'm still finalizing the details.",
    "Plus.Code Coordinates": "8772WX62+3X",
    "Date": "9/18/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "GroupMe: https://groupme.com/join_group/117197590/LxRWmCqk",
    "Notes": "Food will be provided, and since I have the budget, I plan to offer something a bit more elevated than just pizza.",
    "GPS Coordinates": "35.9101875,-79.0475625"
  },
  {
    "Region": "North America",
    "Name": "Johnalbert Garnica",
    "Email address": "johnnyas@u.northwestern.edu",
    "University": "Northwestern University",
    "City": "Evanston",
    "State/Province": "Illinois",
    "Country": "United States",
    "Location description": "room not confirmed but planned to be in the Northwestern Pritzker School of law. We've chosen to reserve a room based on rsvp size.",
    "Plus.Code Coordinates": "86HJV9WM+C3",
    "Date": "9/25/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/VbMC6SEQ",
    "Notes": "Open to students & Non-students : Please RSVP so we know how large of a size room to get and inform the security to let you in.\n\nRSVP: https://luma.com/4s2lo3hx",
    "GPS Coordinates": "41.8960625,-87.6173125"
  },
  {
    "Region": "North America",
    "Name": "Toby Satake",
    "Email address": "tobys010101@gmail.com",
    "University": "University of British Columbia, Vancouver Campus",
    "City": "Vancouver",
    "State/Province": "British Columbia",
    "Country": "Canada",
    "Location description": "Grassy area by Sopron Gate, https://maps.app.goo.gl/WkoCY3L7itgFCJEr5\nWe'll have a sign saying effective altruism club",
    "Plus.Code Coordinates": "84XR7Q52+WG",
    "Date": "9/23/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/2FAZDj35z",
    "Notes": "Free pizza. \nRSVP encouraged (so I know how much food to get): https://docs.google.com/forms/d/e/1FAIpQLSeDxlnxxoZwKTmBUteDnFfrPk8P9_I4y6chdtaiv7VQiyEOow/viewform?usp=sharing&ouid=113362444358115050317",
    "GPS Coordinates": "49.259812499999995,-123.2486875"
  },
  {
    "Region": "North America",
    "Name": "Robi Rahman",
    "Email address": "robirahman94@gmail.com",
    "University": "College of William and Mary",
    "City": "Williamsburg",
    "State/Province": "Virginia",
    "Country": "United States",
    "Location description": "Sadler Center terrace near Crim Dell Bridge and James Blair Drive",
    "Plus.Code Coordinates": "879577CP+MH",
    "Date": "10/23/2026",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "37.2716875,-76.7135625"
  },
  {
    "Region": "Europe",
    "Name": "SL",
    "Email address": "sophielamb@live.com",
    "University": "Edinburgh Napier University",
    "City": "Edinburgh",
    "State/Province": "N/A",
    "Country": "Scotland",
    "Location description": "TBC",
    "Plus.Code Coordinates": "9C7RWQMP+CJ",
    "Date": "9/15/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "55.9335625,-3.2134375"
  },
  {
    "Region": "North America",
    "Name": "EW",
    "Email address": "emilynrwatkins@gmail.com",
    "University": "Brigham Young University Provo",
    "City": "Provo",
    "State/Province": "Utah",
    "Country": "USA",
    "Location description": "Not confirmed yet, probably somewhere in the library. We can have an EA Meetup sign on the door.",
    "Plus.Code Coordinates": "85GC69X2+G8",
    "Date": "10/1/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "If I can get funding for food that would be great to advertise that",
    "GPS Coordinates": "40.2488125,-111.6491875"
  },
  {
    "Region": "North America",
    "Name": "Kamran",
    "Email address": "kamran.hermann@cwu.edu",
    "University": "Central Washington University",
    "City": "Ellensburg",
    "State/Province": "Washington",
    "Country": "United States",
    "Location description": "Not confirmed: The Bistro, 807 N Walnut St. (Door is on the NE corner of Turnstall Commons right across from Bouillon Hall.) There will be an EA MEETUP sign.",
    "Plus.Code Coordinates": "84VX2F26+74",
    "Date": "9/30/2026",
    "Time": "05:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "47.0006875,-120.5396875"
  },
  {
    "Region": "North America",
    "Name": "LN",
    "Email address": "laibanas20@gmail.com",
    "University": "University of Calgary",
    "City": "Calgary",
    "State/Province": "Alberta",
    "Country": "Canada",
    "Location description": "Shirley Anastasia Lounge, behind the Q centre.",
    "Plus.Code Coordinates": "95373VH9+FW",
    "Date": "10/3/2026",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "RSVP if you can",
    "GPS Coordinates": "51.0786875,-114.1301875"
  },
  {
    "Region": "North America",
    "Name": "Hari",
    "Email address": "hariharprasad2006@gmail.com",
    "University": "Johns Hopkins University - Homewood",
    "City": "Baltimore",
    "State/Province": "Maryland",
    "Country": "United States of America",
    "Location description": "The room booking isn't confirmed yet, since I haven't had an opportunity to register the EA club at Hopkins.\n\nI'll be standing in the middle of Keyser Quad holding a big EA MEETUP sign. I'll be there for the first ~20 minutes of the meetup, after which we'll move to an approved room on campus. If you arrive after this 20 minute window and want to know where we are, feel free to shoot me an email closer to the date of the meetup.",
    "Plus.Code Coordinates": "87F589HH+JR",
    "Date": "9/19/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/UPtUV2aa7F",
    "Notes": "Open to students and non-students alike. If you're reading this and are super excited about EA and the sheer amount of good you can do in the world, please feel free to reach out to me the moment you step foot on campus! I'm always open to good conversations, and would love to meet you :)",
    "GPS Coordinates": "39.3290625,-76.62043750000001"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Lydia Finer",
    "Email address": "liaodeyan123@gmail.com",
    "University": "Renmin University of China",
    "City": "Beijing",
    "State/Province": "N/A",
    "Country": "China",
    "Location description": "Lide Student Growth Space (立德学生成长空间)",
    "Plus.Code Coordinates": "8PFRX899+HX",
    "Date": "9/26/2026",
    "Time": "10:00 AM",
    "Event Link": "",
    "Group Link": "https://discord.gg/H6xEKn4Ec or add HJPEVfan on WeChat",
    "Notes": "meetup time is flexible (tho I like Petrov's Day), open to people of any nationality / university, students and non-students alike, LGBTQ+ friendly, free bubble tea",
    "GPS Coordinates": "39.968937499999996,116.3199375"
  },
  {
    "Region": "Africa",
    "Name": "Nana Abrafi Opoku Philipa",
    "Email address": "naoabrafi@gmail.com",
    "University": "Kwame Nkrumah University of Science and Technology, Tech",
    "City": "Tech, Ayeduase",
    "State/Province": "Kumasi",
    "Country": "Ghana",
    "Location description": "Its not confirmed yet but we would want to use a conference room at the impact building, knust",
    "Plus.Code Coordinates": "6CRWMCHG+M8",
    "Date": "10/31/2026",
    "Time": "11:30 AM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Come let's have some fun! Free Pizza and food",
    "GPS Coordinates": "6.679187499999999,-1.5741874999999999"
  },
  {
    "Region": "Europe",
    "Name": "Yannick",
    "Email address": "exeteraltruism@gmail.com",
    "University": "University of Exeter",
    "City": "Exeter",
    "State/Province": "Devon",
    "Country": "England, United Kingdom",
    "Location description": "The Ram (student bar in Forum). I'll be at an outdoor table with an \"EA CONSPIRACY\" sign.",
    "Plus.Code Coordinates": "9C2RPFP8+37",
    "Date": "9/29/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Open to students and non-students. No need to drink, The Ram does soft drinks and food. RSVP to the email above appreciated but not required.",
    "GPS Coordinates": "50.735187499999995,-3.5343125"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Aaron",
    "Email address": "aarond_jshk@proton.me",
    "University": "Indian Institute of Technology, Kanpur",
    "City": "Kanpur",
    "State/Province": "Uttar Pradesh",
    "Country": "India",
    "Location description": "In front of the PK Kelkar library, near the fountain and CCD. I will be there with an EA meetup sign. (May have to change, join the Whatsapp group for updates)",
    "Plus.Code Coordinates": "7MR2G66M+QG",
    "Date": "9/22/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/DVQA34ri0zNBOF2jBvk88G",
    "Notes": "",
    "GPS Coordinates": "26.511937500000002,80.2338125"
  },
  {
    "Region": "North America",
    "Name": "Cal",
    "Email address": "cbilenkin@gmail.com",
    "University": "University of Toronto",
    "City": "Toronto",
    "State/Province": "Ontario",
    "Country": "Canada",
    "Location description": "Queen's Park near Al Purdy statue (across from Teefy Hall); in the event of rain, we will meet in Robarts Library food court instead. Either way, I will have a big EA MEETUP sign!",
    "Plus.Code Coordinates": "87M2MJ85+47F",
    "Date": "9/15/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Free pizza! Please RSVP so I know how much food to get.",
    "GPS Coordinates": "43.6653125,-79.39182812499999"
  },
  {
    "Region": "North America",
    "Name": "Brian Foerster",
    "Email address": "effectivealtruismpurdue@gmail.com",
    "University": "Purdue University - West Lafayette",
    "City": "West Lafayette",
    "State/Province": "Indiana",
    "Country": "United States",
    "Location description": "WALC B058, in the basement",
    "Plus.Code Coordinates": "86GMC3GP+XP",
    "Date": "9/19/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "https://groupme.com/join_group/102154699/KZdddBsC",
    "Notes": "We will have general meetings at the same time and location every Friday starting September 4th.",
    "GPS Coordinates": "40.427437499999996,-86.9131875"
  },
  {
    "Region": "Africa",
    "Name": "Joshua Amo",
    "Email address": "amojoshua473@gmail.com",
    "University": "University of Ghana",
    "City": "Accra",
    "State/Province": "Greater Accra",
    "Country": "Ghana",
    "Location description": "SRC Union Building, Opposite to the Student Clinic",
    "Plus.Code Coordinates": "6CQXJRW6+QW",
    "Date": "10/24/2026",
    "Time": "10:00 AM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/BrR3fims4n52U1akErZkJ0?s=cl&p=a&mlu=4",
    "Notes": "Everyone welcome, students and non-students! Just RSVP please, it really helps.\n\n\nLuma link: https://luma.com/7vz4p0yk",
    "GPS Coordinates": "5.6469375,-0.1876875"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Matthew",
    "Email address": "matthewshing02@gmail.com",
    "University": "University of New South Wales (UNSW)",
    "City": "Sydney",
    "State/Province": "N/A",
    "Country": "Australia",
    "Location description": "Out at Michael Birt Lawn Right next to UNSW light rail station, there will be a sign that says EA MEETUP",
    "Plus.Code Coordinates": "4RRH36MP+54",
    "Date": "9/30/2026",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "https://www.instagram.com/effectivealtruism_unsw/",
    "Notes": "Open this students and non-students.",
    "GPS Coordinates": "-33.9170625,151.23531250000002"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Joe",
    "Email address": "joemacdermottzz@gmail.com",
    "University": "University of Queensland, St Lucia",
    "City": "Brisbane",
    "State/Province": "Queensland",
    "Country": "Australia",
    "Location description": "Phizz food court, building 63 - If you're coming from the Great Court/northern side, follow the sign for building 69 then continue straight until you see the food court on your right. I'll be wearing a blue shirt/jumper and will have an EA MEETUP sign.",
    "Plus.Code Coordinates": "5R4MG226+9RX",
    "Date": "9/14/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Anyone is welcome to come. Email me for any questions/issues, or if you can't find me.",
    "GPS Coordinates": "-27.4990125,153.012109375"
  },
  {
    "Region": "North America",
    "Name": "Andrew Davis",
    "Email address": "andrew.davis@acadiau.ca",
    "University": "Acadia University",
    "City": "Wolfville",
    "State/Province": "Nova Scotia",
    "Country": "Canada",
    "Location description": "Patterson 213 - go in the front door of the business building (right below the KCIC on University Ave), go up one floor via the stairs directly on your left, and there'll be a meetup sign.",
    "Plus.Code Coordinates": "87QQ3JQJ+9MV",
    "Date": "9/22/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "45.0884875,-64.36832812499999"
  },
  {
    "Region": "North America",
    "Name": "Jordan Wesley",
    "Email address": "jtwesley2007@gmail.com",
    "University": "University of Maryland, Baltimore County",
    "City": "Baltimore",
    "State/Province": "Maryland",
    "Country": "United States",
    "Location description": "1000 Hilltop Cir, Baltimore, MD 21227, the first floor of the Performing Arts and Humanities Building",
    "Plus.Code Coordinates": "87F5775R+46",
    "Date": "9/14/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "39.2578125,-76.7094375"
  },
  {
    "Region": "North America",
    "Name": "Rachael",
    "Email address": "rharper011901@gmail.com",
    "University": "Greater Rochester Area (not a university specific meetup)",
    "City": "Rochester NY",
    "State/Province": "New York",
    "Country": "United States",
    "Location description": "Irondequoit Public Library",
    "Plus.Code Coordinates": "87M46C69+PH",
    "Date": "9/23/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Everyone is welcome! This meetup isn't just for EAs and students :) Please come even if you feel like you don't fit the “traditional” rationalist demographic—we'd love to have you. \n\nEmail for further details.",
    "GPS Coordinates": "43.21177,-77.58101599999999"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Max McWhae",
    "Email address": "hi2foomax@gmail.com",
    "University": "University of Western Autralia - UWA",
    "City": "Perth",
    "State/Province": "WA",
    "Country": "Australia",
    "Location description": "Venture coworking space - Go to UWA guild village (329 on maze map). Walk towards uniprint and you will see a stairwell with a big 'venture coworking space' banner. Go upstairs and look around (its not that big)",
    "Plus.Code Coordinates": "4PWQ2R99+PJH",
    "Date": "9/21/2026",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/V3ZyDdZVX",
    "Notes": "free pizza. say hi in discord #introductions.",
    "GPS Coordinates": "-31.980687500000002,115.81910937500001"
  },
  {
    "Region": "Europe",
    "Name": "Marcel",
    "Email address": "hello@effectivealtruism.ch",
    "University": "ETH Zurich",
    "City": "Zurich",
    "State/Province": "N/A",
    "Country": "Switzerland",
    "Location description": "Zeughausstrasse 31, 8004 Zurich",
    "Plus.Code Coordinates": "8FVC9GGJ+57",
    "Date": "9/16/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "https://luma.com/1bn0pv9z",
    "Notes": "Join us for our Fall Semester 2026 Launch 🚀\nFind all information and RSVP here: https://luma.com/1bn0pv9z",
    "GPS Coordinates": "47.375437500000004,8.530687499999999"
  },
  {
    "Region": "Europe",
    "Name": "Kieran",
    "Email address": "kierandaltonscience@gmail.com",
    "University": "ETH Zurich",
    "City": "Zurich",
    "State/Province": "N/A",
    "Country": "Switzerland",
    "Location description": "Honggeberg campus barbecue area, near football pitches.",
    "Plus.Code Coordinates": "8FVCCG56+4Q3",
    "Date": "9/29/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/K0CsvV3hi6DH7NFBHgRM33?s=sh&p=a&mlu=4",
    "Notes": "Please join the group if you want to attend.",
    "GPS Coordinates": "47.407762500000004,8.511921874999999"
  },
  {
    "Region": "Europe",
    "Name": "Michel",
    "Email address": "altruismeefficacesorbonneuniversite@protonmail.com",
    "University": "Sorbonne Université",
    "City": "Paris",
    "State/Province": "N/A",
    "Country": "France",
    "Location description": "We'll be sitting on the grass, in the lawn of the Pierre et Marie Curie Campus. The main entrance of the campus is on the 'place Jussieu'. You'll be facing the Zamansky tower. As-the-crow-flies, the direction the grass is when you're facing the tower is roughly 40° clockwise. You should follow reasonable pathways while keeping that direction in mind. Please join the whatsapp community if you need further assistance, I'll post a video walkthrough there. We will have a kakemono with us so you can distinguish us from other student groups.",
    "Plus.Code Coordinates": "8FW4R9W5+P9",
    "Date": "9/11/2026",
    "Time": "06:15 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/KczR5NOrejf4FhRwqsa9al",
    "Notes": "Free soft drinks and snacks. If you intend to join us, please join the group 'Altruisme Efficace Sorbonne U', and post a message here saying you'll be there. This is useful both to calibrate amounts of drinks and snacks, and to help keeping the group chat active and reminding everyone about the meetup. Please write your message in French if you're comfortable doing so.",
    "GPS Coordinates": "48.8468125,2.3584375"
  },
  {
    "Region": "North America",
    "Name": "Luis",
    "Email address": "Fort.lauderdale.acx@gmail.com",
    "University": "Florida International University (FIU) Modesto Maidique Campus",
    "City": "Miami",
    "State/Province": "Florida",
    "Country": "US",
    "Location description": "Graham Center Piano Lounge, near Main Entrance across from Barnes and Nobles. Will be holding an ACX sign.",
    "Plus.Code Coordinates": "76QXQJ4G+7R2",
    "Date": "10/17/2026",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/fFjmJs2kn",
    "Notes": "",
    "GPS Coordinates": "25.7556375,-80.372984375"
  },
  {
    "Region": "North America",
    "Name": "Zoheb",
    "Email address": "zohebanjum@gmail.com",
    "University": "University of Miami",
    "City": "Miami",
    "State/Province": "Florida",
    "Country": "United States",
    "Location description": "WVUM Student Lounge, South East of the Stanford Drive roundabout, right next to the canal and near the entrance to the pool (this is our tentative location, and we'll update you if it changes!)",
    "Plus.Code Coordinates": "76QXPPCC+3X",
    "Date": "9/19/2026",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://effectivealtruismmiami.subscribepage.io/",
    "Notes": "Open to students and non-students alike",
    "GPS Coordinates": "25.7201875,-80.2775625"
  },
  {
    "Region": "North America",
    "Name": "Joanna A",
    "Email address": "aldrich.y@northeastern.edu",
    "University": "Northeastern University",
    "City": "Boston",
    "State/Province": "Massachusetts",
    "Country": "USA",
    "Location description": "Ryder 135 — Look for \"EA Meetup\" signs and someone wearing an EAG-branded t-shirt. (Room is not confirmed, and may be moved if the room is occupied.)",
    "Plus.Code Coordinates": "87JC8WP5+MQ",
    "Date": "9/24/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "https://join.slack.com/t/nu-effectivealtruism/shared_invite/zt-47zx9ltd3-CXy2X0vzogXpHnLudsdl7Q",
    "Notes": "",
    "GPS Coordinates": "42.3366875,-71.0905625"
  },
  {
    "Region": "Europe",
    "Name": "Patricia",
    "Email address": "heidelberg@effektiveraltruismus.de",
    "University": "University of Heidelberg",
    "City": "Heidelberg",
    "State/Province": "Baden-Württemberg",
    "Country": "Germany",
    "Location description": "Alfred-Weber-Institut, Campus Bergheim, Bergheimer Str. 58, Room 00.028 (room on the right of the entrance, follow the hung-up signs)",
    "Plus.Code Coordinates": "8FXCCM5M+9QV",
    "Date": "10/21/2026",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "https://www.eaheidelberg.de/",
    "Notes": "We're excited to invite you to an engaging evening exploring Effective Altruism (EA)!\nOpen to students and non-students alike. No prior knowledge needed.\nPlease RSVP so we know how much food to get: https://forms.gle/V3eGbNtzoBB6Z7mM9\nLooking forward to meeting you! :)",
    "GPS Coordinates": "49.4084875,8.684421875"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Swarnim",
    "Email address": "rexzeo0@gmail.com",
    "University": "Indian institute of technology Hyderabad",
    "City": "Sangareaddy",
    "State/Province": "Telangana",
    "Country": "India",
    "Location description": "Guest house, Cafeteria",
    "Plus.Code Coordinates": "7J9WH4P9+PF",
    "Date": "9/19/2026",
    "Time": "08:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "17.5868125,78.1186875"
  },
  {
    "Region": "North America",
    "Name": "Miri",
    "Email address": "topi@ku.edu",
    "University": "University of Kansas",
    "City": "Lawrence",
    "State/Province": "Kansas",
    "Country": "United States",
    "Location description": "Anschutz Library, Room 438 (Booking not yet confirmed, will send an email out if it changes).\nFrom the main entrance facing the plaza area, take the stairs on the left up one floor to the fourth floor. I'll be in the far back-right study room with an EA MEETUP sign.",
    "Plus.Code Coordinates": "86C6XQ52+23J",
    "Date": "9/15/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Please RSVP to help me plan for how many people will show up :)",
    "GPS Coordinates": "38.95758750000002,-95.249859375"
  },
  {
    "Region": "Europe",
    "Name": "Elitza Maneva",
    "Email address": "elitza.maneva@gmail.com",
    "University": "Universitat Autònoma de Barcelona",
    "City": "Barcelona",
    "State/Province": "",
    "Country": "Catalonia/Spain",
    "Location description": "La Comunitària de la UAB, Plaça del Coneixement (12h a 16h)",
    "Plus.Code Coordinates": "8FH4G434+HM",
    "Date": "9/29/2026",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "https://sites.google.com/view/altruisme-efectiu-uab/",
    "Notes": "Open to students and non-students alike",
    "GPS Coordinates": "41.5039375,2.1066875"
  },
  {
    "Region": "Europe",
    "Name": "Novak Stijepic",
    "Email address": "novak.stijepic@gmail.com",
    "University": "University of Belgrade",
    "City": "Belgrade",
    "State/Province": "",
    "Country": "Serbia",
    "Location description": "Penzija cafe. We'll have an EA MEETUP sign.",
    "Plus.Code Coordinates": "8GP2RF4H+P5",
    "Date": "10/6/2026",
    "Time": "12:30 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/mRx2KxkuP",
    "Notes": "",
    "GPS Coordinates": "44.8068125,20.477937500000003"
  },
  {
    "Region": "Europe",
    "Name": "Tiphaine Lalonde",
    "Email address": "tiphaine.lalonde@learner.42.tech",
    "University": "42",
    "City": "Paris",
    "State/Province": "N/A",
    "Country": "France",
    "Location description": "42 Paris, 96 Bd Bessières , 75017, Paris. Room booking is not confirmed yet, but the meetup will most likely take place in Le Labino, on the ground floor.",
    "Plus.Code Coordinates": "8FW4V8W9+HC",
    "Date": "10/30/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/qEtmHfeNM",
    "Notes": "Informal meetup exploring ideas around Effective Altruism, technology, AI, social impact, and how we can contribute to a better future. The exact topic and format will be confirmed closer to the event. Open to students and non-students.",
    "GPS Coordinates": "48.896437500000005,2.3185624999999996"
  },
  {
    "Region": "North America",
    "Name": "Matthew H",
    "Email address": "harvardea@gmail.com",
    "University": "Harvard",
    "City": "Cambridge",
    "State/Province": "MA",
    "Country": "US",
    "Location description": "In the Science Center, ground floor restaurant space, 1 Oxford St, Cambridge, MA 02138",
    "Plus.Code Coordinates": "87JC9VGM+F9",
    "Date": "9/12/2026",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://www.instagram.com/harvardcollegeea/",
    "Notes": "There will be food!",
    "GPS Coordinates": "42.3761875,-71.1165625"
  },
  {
    "Region": "North America",
    "Name": "Hope",
    "Email address": "hsteen@clemson.edu",
    "University": "Clemson University",
    "City": "Clemson",
    "State/Province": "South Carolina",
    "Country": "United States",
    "Location description": "Under the overhang/stairs at Robert Muldrow Cooper Library (the big white building by the reflection pond). I'll be wearing a black shirt and red pants and holding an obnoxiously large signed that says 'EA Meetup.'",
    "Plus.Code Coordinates": "866VM5G7+MC",
    "Date": "9/15/2026",
    "Time": "06:15 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "I will attempt to bring cookies at least, possibly pizza depending on time/budget constraints.",
    "GPS Coordinates": "34.6766875,-82.8364375"
  },
  {
    "Region": "Europe",
    "Name": "Harry",
    "Email address": "current-goad-6n@icloud.com",
    "University": "TU Wien",
    "City": "Vienna",
    "State/Province": "N/A",
    "Country": "Austria",
    "Location description": "The courtyard of the Hauptgebäude. If you enter the building from the main entrance at Karlsplatz and walk straight through, you arrive in the courtyard. I will be sat on a table there with an EA MEETUP sign and a white T-shirt. Email me if you can’t find us!",
    "Plus.Code Coordinates": "8FWR59X9+HR",
    "Date": "10/12/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "48.1989375,16.3695625"
  },
  {
    "Region": "North America",
    "Name": "Charlie",
    "Email address": "chuckwilson477@yahoo.com",
    "University": "Florida Atlantic University",
    "City": "Boca Raton",
    "State/Province": "Florida",
    "Country": "United States",
    "Location description": "In the Cafeteria / Food Court, nearby the Panda Express. We'll have an EA MEETUP sign",
    "Plus.Code Coordinates": "76RX9VCW+5R2",
    "Date": "9/13/2026",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/svZeYP83MQ",
    "Notes": "Open to students and non-students alike. RSVPs highly preferred but not required. Affiliated with EA Miami and Miami ACX, join our Discord for more info!",
    "GPS Coordinates": "26.3703875,-80.10298437499999"
  },
  {
    "Region": "North America",
    "Name": "JB",
    "Email address": "itslabradordali@gmail.com",
    "University": "University of Central Florida",
    "City": "Orlando",
    "State/Province": "FL",
    "Country": "USA",
    "Location description": "The Taco Bell Cantina (12101 University Blvd Ste 201, Orlando, FL 32817)",
    "Plus.Code Coordinates": "76WWHQXR+8FC",
    "Date": "9/18/2026",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/R2RrvVCARe (Orlando Rationalists Server)",
    "Notes": "Open to anyone. RSVP by email or discord preferred. When there, look for the glowy sign :)",
    "GPS Coordinates": "28.5983125,-81.208859375"
  },
  {
    "Region": "Europe",
    "Name": "Nina",
    "Email address": "paretofrontiersmanship@gmail.com",
    "University": "Moscow State University",
    "City": "Moscow",
    "State/Province": "N/A",
    "Country": "Russia",
    "Location description": "6 Vernadsky Avenue, Capitoly mall, 3rd floor food court. I'll put an EA MEETUP sign on the table.",
    "Plus.Code Coordinates": "9G7VMGRH+R4",
    "Date": "10/10/2026",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "55.6920625,37.527812499999996"
  },
  {
    "Region": "Europe",
    "Name": "Hugo V",
    "Email address": "Hviciana@us.es",
    "University": "Universidad de Sevilla",
    "City": "Seville",
    "State/Province": "",
    "Country": "Spain",
    "Location description": "Picnic tables next to the garden of the Faculty of Tourism and Finance, opposite the Occidente insurance building, on the Ramón y Cajal Campus. I will be wearing a Hawaian shirt and there should be an EA sign.",
    "Plus.Code Coordinates": "8C9P92HF+FQ",
    "Date": "10/15/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "37.3786875,-5.9755625000000006"
  },
  {
    "Region": "North America",
    "Name": "A. KW",
    "Email address": "akw.business.mailbox@gmail.com",
    "University": "Western Washington University",
    "City": "Bellingham",
    "State/Province": "Washington",
    "Country": "USA",
    "Location description": "PAC Plaza. The big plaza near the Viking Union and the Performing Arts Center, with the great view of the water.",
    "Plus.Code Coordinates": "84WVPGQ7+88",
    "Date": "10/7/2026",
    "Time": "05:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "I thought this had gone through before - is it still possible to get on the list? Thanks.",
    "GPS Coordinates": "48.7383125,-122.4866875"
  },
  {
    "Region": "North America",
    "Name": "Maria Jose Colas",
    "Email address": "majocolas17@gmail.com",
    "University": "PUCMM | Pontificia Universidad Católica Madre y Maestra",
    "City": "Distrito Nacional",
    "State/Province": "Santo Domingo",
    "Country": "Dominican Republic",
    "Location description": "Pontificia Universidad Católica Madre y Maestra (PUCMM)\nCampus de Santo Domingo\nAbraham Lincoln esq. Simón Bolívar\nSanto Domingo\nRepública Dominicana\n\nRoom not confirmed yet",
    "Plus.Code Coordinates": "77CGF369+XX",
    "Date": "10/23/2026",
    "Time": "04:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "18.4624375,-69.9300625"
  },
  {
    "Region": "North America",
    "Name": "Violet Prashanth",
    "Email address": "vprashan@andrew.cmu.edu",
    "University": "Carnegie Mellon University",
    "City": "Pittsburgh",
    "State/Province": "PA",
    "Country": "United States",
    "Location description": "Baker Hall 235A - Enter from the main/Eastern entrance (facing towards Hunt Library; a large glass and aluminum building. Take the stairs on your righthand side up one floor. Continue for about 60 feet and it will be on your righthand side.",
    "Plus.Code Coordinates": "87G2C3R3+MV",
    "Date": "9/24/2026",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/QxVM9esWcU",
    "Notes": "Open to students and non-students.",
    "GPS Coordinates": "40.4416875,-79.9453125"
  }
]

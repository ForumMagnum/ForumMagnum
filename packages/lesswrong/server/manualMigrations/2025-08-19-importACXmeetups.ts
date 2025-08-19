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
  name: "importACXMeetupsFall25",
  dateWritten: "2025-08-19",
  idempotent: true,
  action: async () => {
    const eventCacheContents: { _id: string, lat: number, lng: number }[] = [];

    const adminId = 'XtphY3uYHwruKqDyG';

    // eslint-disable-next-line no-console
    console.log("Begin importing ACX Meetups");
    for (const row of acxData) {
      let eventOrganizer
      // Figure out whether user with email address already exists
      // This used to be userFindByEmail from /lib/vulcan-users/helpers. That seems to have become userFindOneByEmail from /lib/collections/users/commonQueries, but you should check that those actually behaved the same.
      const email = row["Email address"] as string|undefined;
      // Does not seem relevant anymore. The email address is not present in the data
      // const lookupEmail = email === 'ed@newspeak.house' ? 'edsaperia@gmail.com' : email;
      const lookupEmail = email
      const existingUser = lookupEmail ? await userFindOneByEmail(lookupEmail) : undefined;
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
            username: `${username}-fall-acx-25`,
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
      const title = `${row["City"]} – ACX Meetups Everywhere Fall 2025`;

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
                ${row["Group Link"] ? `<p>Group Link: ${row["Group Link"]}</p>` : ""}
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
        
        const newPost = await createPost({ data: newPostData }, await computeContextFromUser({ user: eventOrganizer, isSSR: false }));

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
  "Group Link"?: string
  Notes?: string
  "Additional contact info"?: string
}

// Updated 2025-08-19 7:48pm CEST

const acxData: ACXMeetup[] = [
  {
    "Region": "Africa & The Middle East",
    "Name": "Jibrin (on behalf of Micro-ripples)",
    "Email address": "microripples@gmail.com",
    "City": "Jos",
    "Location description": "ICT Lab 1, University of Jos Main campus, Bauchi Rd, Jos, Plateau State",
    "Plus.Code Coordinates": "https://plus.codes/6FXCWVXQ+HG",
    "Date": "9/18/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "https://facebook.com/microripples",
    "Notes": "Limited seating — RSVP to guarantee a spot",
    "GPS Coordinates": "9.9489375,8.888812500000002"
  },
  {
    "Region": "North America",
    "Name": "James P",
    "Email address": "jonbenettleilax@gmail.com",
    "City": "San Antonio",
    "Location description": "203 E Jones Ave Ste 101, San Antonio, TX 78215, USA",
    "Plus.Code Coordinates": "https://plus.codes/76X3CGP9+CV",
    "Date": "10/5/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://www.lesswrong.com/groups/CEPoFETJXADdriPGt",
    "Notes": "",
    "GPS Coordinates": "29.4360625,-98.4803125"
  },
  {
    "Region": "North America",
    "Name": "Phil",
    "Email address": "acxharrisburg@gmail.com",
    "City": "Harrisburg",
    "Location description": "Zeroday Taproom, 925 N 3rd St, Harrisburg, PA 17102\nLook for the table with an \"ACX MEETUP\" sign",
    "Plus.Code Coordinates": "https://plus.codes/87G57487+R7G",
    "Date": "9/20/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://www.lesswrong.com/groups/PXrLoKgiAyXEG2hLD",
    "Notes": "",
    "GPS Coordinates": "40.2670625,-76.8867969"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Vatsal",
    "Email address": "vmehra@pm.me",
    "City": "Hyderabad",
    "Location description": "Vibrant Living, Road no 82, Film Nagar, Jubilee Hills, Hyderabad",
    "Plus.Code Coordinates": "https://plus.codes/7J9WCC74+M3",
    "Date": "10/5/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Please RSVP on lesswrong",
    "GPS Coordinates": "17.4141875,78.4051875"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Quang Hiệp",
    "Email address": "hiepbq14408@gmail.com",
    "City": "Ho Chi Minh",
    "Location description": "Hẻm 212/2B Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1",
    "Plus.Code Coordinates": "https://plus.codes/7P28QM8P+4J",
    "Date": "9/14/2025",
    "Time": "10:00 AM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Please RSVP to my public email so that we can set expectations on how people will be showing up.",
    "GPS Coordinates": "10.7653125,106.6865625"
  },
  {
    "Region": "North America",
    "Name": "Michael B",
    "Email address": "michael.bacarella@gmail.com",
    "City": "Eugene",
    "Location description": "Beergarden. 777 W 6th Ave, Eugene, OR 97402",
    "Plus.Code Coordinates": "https://plus.codes/84PR3V3W+C6G",
    "Date": "9/10/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/Ba2TYVgxzw",
    "Notes": "Hosted by the ACX/EAs of Willamette Valley Meetup (see our Discord!)",
    "GPS Coordinates": "44.0535625,-123.1044219"
  },
  {
    "Region": "Europe",
    "Name": "Marta",
    "Email address": "marta.krzeminska@gmail.com",
    "City": "Bremen",
    "Location description": "Kaffe Krach, Friesenstraße 16, 28203 Bremen. \nLook for a sign: ACX Meetup. It being November, we'll most likely be inside.",
    "Plus.Code Coordinates": "https://plus.codes/9F5C3RFH+3M",
    "Date": "11/8/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/DiIdx2E7cAf3AgotxAAP89",
    "Notes": "The theme of the meet-up is: YOUR FAVOURITE. \n\nBring your favourite topic, piece of trivia, trick, joke, gadget, poem, question, etc. and share with the group why it's awesome. If your pick is a piece of writing (book or article) be ready to briefly summarise it. After intros and sharing your favourite, we'll split into groups based on topics.\n \nP.s. The date falls out of the Fall meet-up range, but there was no other date that worked :'( , I hope you'll forgive the organiser.",
    "GPS Coordinates": "53.0726875,8.8291875"
  },
  {
    "Region": "Europe",
    "Name": "Adriana",
    "Email address": "adriana.lica@gmail.com",
    "City": "Barcelona",
    "Location description": "Rooftop terrace of Archie Living building.",
    "Plus.Code Coordinates": "https://plus.codes/8FH495RJ+R9",
    "Date": "9/4/2025",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "www.meetup.com",
    "Notes": "RSVP required. We'll have snacks and refreshments. Dogs & kids are welcome. Bring swimwear, if you'd like a pool dip.",
    "GPS Coordinates": "41.3920625,2.1809375"
  },
  {
    "Region": "Europe",
    "Name": "Sergio",
    "Email address": "sergiodzg@gmail.com",
    "City": "Madrid",
    "Location description": "We will organize it in the puppet theater in El Retiro park (as on previous occasions in Madrid)",
    "Plus.Code Coordinates": "https://plus.codes/8CGRC897+G8",
    "Date": "9/21/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "We will announce it on the EA-Madrid slack channel and in the meetup group (https://www.meetup.com/effective-altruism-madrid/)",
    "Notes": "",
    "GPS Coordinates": "40.4188125,-3.686687499999999"
  },
  {
    "Region": "North America",
    "Name": "Logan S.",
    "Email address": "logansignup95@gmail.com",
    "City": "Lexington",
    "Location description": "Charlie Browns - 816 Euclid Ave, Lexington, KY 40502 - An ACX sign will be on the table.",
    "Plus.Code Coordinates": "https://plus.codes/86CQ2GH5+WH",
    "Date": "9/14/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "N/A",
    "Notes": "An RSVP or heads up sent to the email would be appreciated, but not required. Hope to see yall there!",
    "GPS Coordinates": "38.0298125,-84.4910625"
  },
  {
    "Region": "North America",
    "Name": "Leo",
    "Email address": "jaquablouisbertrand@gmail.com",
    "City": "Madison",
    "Location description": "Memorial Union Terrace around the brat stand.",
    "Plus.Code Coordinates": "https://plus.codes/86MG3HGX+QX4",
    "Date": "9/14/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://groups.google.com/g/madison-wi-acx",
    "Notes": "Email directly for details. Will make a group message if there's sufficient interest.",
    "GPS Coordinates": "43.0768875,-89.40004689999999"
  },
  {
    "Region": "North America",
    "Name": "duck_master",
    "Email address": "duckmaster0@protonmail.com",
    "City": "Newton",
    "Location description": "Newton Centre Green (Centre St & Beacon St)",
    "Plus.Code Coordinates": "https://plus.codes/87JC8RJ4+76",
    "Date": "9/6/2025",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/Qy8P3btVqG",
    "Notes": "please RSVP on lesswrong!",
    "GPS Coordinates": "42.3306875,-71.19443749999999"
  },
  {
    "Region": "Europe",
    "Name": "Milli",
    "Email address": "acx-meetups@martinmilbradt.de",
    "City": "Berlin",
    "Location description": "Big lawn at the center of Humboldthain",
    "Plus.Code Coordinates": "https://plus.codes/9F4MG9WP+36",
    "Date": "10/11/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "https://t.me/+2-6QId-rIOczNWIy",
    "Notes": "",
    "GPS Coordinates": "52.5451875,13.3855625"
  },
  {
    "Region": "Europe",
    "Name": "Stefan",
    "Email address": "acx_gbg@posteo.se",
    "City": "Gothenburg",
    "Location description": "Condeco Fredsgatan, look for a book on the table",
    "Plus.Code Coordinates": "https://plus.codes/9F9HPX4C+39",
    "Date": "9/27/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "https://www.meetup.com/lw-acx-meetup-gothenburg |  https://www.lesswrong.com/groups/WTFM9rYWeN986yyxC",
    "Notes": "",
    "GPS Coordinates": "57.70518749999999,11.9709375"
  },
  {
    "Region": "North America",
    "Name": "Gabe",
    "Email address": "gabeaweil@gmail.com",
    "City": "Massapequa (Long Island)",
    "Location description": "47 Clinton Pl",
    "Plus.Code Coordinates": "https://plus.codes/87G8MG4F+3X",
    "Date": "10/25/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "40.6551875,-73.47506249999999"
  },
  {
    "Region": "Europe",
    "Name": "Moritz S.",
    "Email address": "acx.organizer.munich@gmail.com",
    "City": "Munich",
    "Location description": "Müllerstraße 35, TeamWork conference space",
    "Plus.Code Coordinates": "https://plus.codes/8FWH4HJ9+7P",
    "Date": "9/12/2025",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "https://acxmeetup.substack.com/",
    "Notes": "Local blogosphere enthusiasts are welcome to subscribe to our regular newsletter; you will also find a WhatsApp-group over there. My ACX meetups happen ~3 weeks.",
    "GPS Coordinates": "48.13068750000001,11.5693125"
  },
  {
    "Region": "Europe",
    "Name": "Gary",
    "Email address": "acxstockholm@gmail.com",
    "City": "Stockholm",
    "Location description": "We'll meet at Blå Pårten, the blue gate at Djurgårdsbron. That's the literal blue gate on the Djurgården side of the bridge, not the cafe with the same name. I'll have a sign that says ACX MEETUP.",
    "Plus.Code Coordinates": "https://plus.codes/9FFW83JV+6Q",
    "Date": "9/13/2025",
    "Time": "12:27 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "59.3305625,18.0944375"
  },
  {
    "Region": "Europe",
    "Name": "Alvin",
    "Email address": "alv.csk@gmail.com",
    "City": "Timisoara",
    "Location description": "Location: Scârț Loc Lejer. I'll probably put an ACX MEETUP sign on the table!",
    "Plus.Code Coordinates": "https://plus.codes/8GQ3P6VF+7QR",
    "Date": "9/27/2025",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Messaging me on Lesswrong, if possible and comfortable, would be much appreciated!",
    "GPS Coordinates": "45.7432375,21.2243906"
  },
  {
    "Region": "North America",
    "Name": "Rushi",
    "Email address": "pghacx@gmail.com",
    "City": "Pittsburgh",
    "Location description": "City Kitchen at Bakery Square",
    "Plus.Code Coordinates": "https://plus.codes/87G2F34M+JP5",
    "Date": "9/13/2025",
    "Time": "02:30 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/gmdPKTXE",
    "Notes": "Excited to meet other ACX readers in the 'burgh! Join our Discord to hear about other meetups as well",
    "GPS Coordinates": "40.4565125,-79.9156406"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "HWE",
    "Email address": "harrisone8@gmail.com",
    "City": "Bangkok",
    "Location description": "Lumphini Park, Main Entrance by MRT ",
    "Plus.Code Coordinates": "https://plus.codes/7P52PGHQ+X3",
    "Date": "9/15/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "please rsvp to my email ",
    "GPS Coordinates": "13.7299375,100.5376875"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "SLK",
    "Email address": "steve@sportspredict.com",
    "City": "Manila",
    "Location description": "Manila--BGC",
    "Plus.Code Coordinates": "https://plus.codes/7Q63H22W+XP",
    "Date": "9/3/2025",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "14.5524375,121.0468125"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Nihal",
    "Email address": "propwash at duck dot com",
    "City": "Bangalore",
    "Location description": "Matteo Coffea, Church Street",
    "Plus.Code Coordinates": "https://plus.codes/7J4VXJF4+PR",
    "Date": "10/5/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://www.lesswrong.com/groups/i5vLw9xnG9iwXNQZZ",
    "Notes": "Check the lesswrong group page for the announcement, and RSVP there. ",
    "GPS Coordinates": "12.9743125,77.6070625"
  },
  {
    "Region": "Africa & The Middle East",
    "Name": "Adil Oyango",
    "Email address": "adil@oya.ngo",
    "City": "Nairobi",
    "Location description": "The Gigiri Courtyard, Gigiri Lane",
    "Plus.Code Coordinates": "https://plus.codes/6GCRQR84+QR",
    "Date": "9/13/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "-1.2330625,36.8070625"
  },
  {
    "Region": "Africa & The Middle East",
    "Name": "Tegan",
    "Email address": "teganspeaking@gmail.com",
    "City": "Cape Town",
    "Location description": "The Gardeners Cottage Restaurant, Newlands. I will have an \"ACX Meetup\" sign",
    "Plus.Code Coordinates": "https://plus.codes/4FRW2FH4+VV",
    "Date": "9/21/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "https://discord.gg/7dKYWsff",
    "Notes": "",
    "GPS Coordinates": "-33.9703125,18.4571875"
  },
  {
    "Region": "North America",
    "Name": "KC",
    "Email address": "acxcltkc1.afford407@passinbox.com",
    "City": "Charlotte",
    "Location description": "4400 Sharon Road, SouthPark Mall, at the entrance atrium between Cheesecake Factory & Maggiano's. I will be wearing a white shirt with blue fish all over it.",
    "Plus.Code Coordinates": "https://plus.codes/867X5529+QR",
    "Date": "9/20/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "The location is outdoors. We'll move inside the mall in case of bad weather.",
    "GPS Coordinates": "35.1519375,-80.83043750000002"
  },
  {
    "Region": "Europe",
    "Name": "Chris G",
    "Email address": "wardle@live.fr",
    "City": "Newcastle-Durham",
    "Location description": "I'll be in the Newcastle Central Station coffee shop (whatever it's called now) just inside the entrance, wearing the orange Hawaiian shirt and displaying the sign.",
    "Plus.Code Coordinates": "https://plus.codes/9C6WX99M+H2",
    "Date": "9/27/2025",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "54.9689375,-1.6174375"
  },
  {
    "Region": "North America",
    "Name": "Amy",
    "Email address": "amyelquest@gmail.com",
    "City": "Knoxville",
    "Location description": "Schulz Bräu Brewing Company, 126 Bernard Ave, Knoxville, TN 37917 - outdoor table if it's not raining, indoor table upstairs if it is raining, I'll bring a small ACX sign. ",
    "Plus.Code Coordinates": "https://plus.codes/867RX3GF+RG",
    "Date": "10/4/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "35.9770625,-83.9261875"
  },
  {
    "Region": "North America",
    "Name": "John",
    "Email address": "himalayansp@hotmail.com",
    "City": "Bloomington",
    "Location description": "my house",
    "Plus.Code Coordinates": "https://plus.codes/86FM5F7P+GJ",
    "Date": "10/3/2025",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "just show up",
    "GPS Coordinates": "39.1638125,-86.5134375"
  },
  {
    "Region": "Europe",
    "Name": "Alexei Andreev",
    "Email address": "alexei.andreev+acx@gmail.com",
    "City": "Porto",
    "Location description": "Largo Alexandre Sá Pinto 44, B2\n4050-027 Porto, Portugal",
    "Plus.Code Coordinates": "https://plus.codes/8CHH593G+CF4",
    "Date": "10/11/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "https://www.reddit.com/r/slatestarcodex/comments/1ml92xy/meetup_in_porto_portugal_on_october_11th/",
    "Notes": "Please RSVP if you're planning to come so we can plan lunch.\nYou have to go inside the inner courtyard. From there go to the opposite corner of the garden and up the black stairs.",
    "GPS Coordinates": "41.1535125,-8.6237969"
  },
  {
    "Region": "Europe",
    "Name": "FW",
    "Email address": "transatlantic.puissance@gmail.com",
    "City": "London",
    "Location description": "Hyde Park",
    "Plus.Code Coordinates": "https://plus.codes/9C3XGRJW+HV",
    "Date": "9/6/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "Not made yet - will do after this",
    "Notes": "Please dress for the weather! Cafe nearby for drinks and food, feel free to bring any props/ sports items if you want to have a kick about ",
    "GPS Coordinates": "51.5314375,-0.1528125"
  },
  {
    "Region": "Europe",
    "Name": "Ruben",
    "Email address": "heller.ruben@googlemail.com",
    "City": "Mannheim",
    "Location description": "Murphy's Law (Irish Pub) near the Main Station. I'll have a sign that says \"ACX\"",
    "Plus.Code Coordinates": "https://plus.codes/8FXCFFJC+6G",
    "Date": "8/20/2025",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "49.4805625,8.4713125"
  },
  {
    "Region": "Europe",
    "Name": "Jose",
    "Email address": "jsillerosalado@gmail.com",
    "City": "Bilbao",
    "Location description": "Parque el Arenal",
    "Plus.Code Coordinates": "https://plus.codes/8CMV736G+7J",
    "Date": "9/13/2025",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Any and all welcome, come chat and have fun!",
    "GPS Coordinates": "43.2606875,-2.9234375"
  },
  {
    "Region": "North America",
    "Name": "Ben L",
    "Email address": "mywebdev3@gmail.com",
    "City": "Lakewood",
    "Location description": "Ocean County Park. Second parking lot on the right. Drive to the far left end under the trees.",
    "Plus.Code Coordinates": "https://plus.codes/87G73RW8+4C",
    "Date": "9/21/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Please RSVP on LessWrong so I know how much food to get",
    "GPS Coordinates": "40.0953125,-74.1839375"
  },
  {
    "Region": "Europe",
    "Name": "Roland ",
    "Email address": "Ich.will.mit.dir.verreisen@gmail.com",
    "City": "Luxembourg ",
    "Location description": "Casino library ",
    "Plus.Code Coordinates": "https://plus.codes/8FX8J45G+WV",
    "Date": "9/21/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://www.meetup.com/better-habits-together",
    "Notes": "RSVP on Meetup as soon as I he Meetup is announced ",
    "GPS Coordinates": "49.6098125,6.1271875"
  },
  {
    "Region": "North America",
    "Name": "Troy",
    "Email address": "troysttw@gmail.com",
    "City": "East Meadow",
    "Location description": "Meet near the South Maples Picnic Area in Eisenhower Park, at the picnic tables near the playground. Closest parking lot is Parking Lot 1A near IFLY Trapeze. I'll have an ACX MEETUP sign in front of a picnic table.",
    "Plus.Code Coordinates": "https://plus.codes/87G8PCHC+MH",
    "Date": "10/11/2025",
    "Time": "02:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "There's a playground and big grassy area so feel free to bring family, kids, etc. (I'll try to bring mine). Also, please RSVP on LessWrong so I know how many snacks and drinks to get.",
    "GPS Coordinates": "40.72918749999999,-73.57856249999999"
  },
  {
    "Region": "Europe",
    "Name": "Oleksii",
    "Email address": "lijjjijiiijjjilijjlljjijijjjli@protonmail.ch",
    "City": "Kyiv",
    "Location description": "It could be a public park in the Podil disctrict of the city. It could be a café or a coworking space suitable for such meetings. It could also be university grounds (discussion with the faculty is in progress). Look for the ACX meetup sign.  ",
    "Plus.Code Coordinates": "https://plus.codes/9G2GFG59+Q9V",
    "Date": "9/13/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Feel free to bring a book for book-crossing. You may also bring notes or ideas to discuss your favorite topics. We may start with the recent ACX articles and go from there. ",
    "GPS Coordinates": "50.45948749999999,30.5184219"
  },
  {
    "Region": "North America",
    "Name": "Jon Wolverton",
    "Email address": "wolverton.jr@gmail.com",
    "City": "Sunnyvale",
    "Location description": "Meet at Washington Park. We'll be in a small picnic area under some trees next to the playground. Just walk around the playground until you find 3 picnic tables with a sign saying \"ACX MEETUP\".",
    "Plus.Code Coordinates": "https://plus.codes/849V9XG6+V2",
    "Date": "9/28/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "These things exist but are defunct. If you can get me in touch with the people who own them, that would be awesome! If not, we can set something up..",
    "Notes": "We'll be out there for 3 hours or so, so come join when you can and leave when you want. Feel free to bring kids & dogs since we're outdoors and next to a playground.",
    "GPS Coordinates": "37.37718750000001,-122.0399375"
  },
  {
    "Region": "Europe",
    "Name": "Carlo Martinucci",
    "Email address": "carlo.martinucci@gmail.com",
    "City": "Padova",
    "Location description": "Prato della valle, fountain in the middle, south side ",
    "Plus.Code Coordinates": "https://plus.codes/8FQH9VXG+8J",
    "Date": "9/27/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "45.3983125,11.8765625"
  },
  {
    "Region": "Europe",
    "Name": "Dimi",
    "Email address": "dimi.zharkov@gmail.com",
    "City": "Erlangen",
    "Location description": "Anna's Bar",
    "Plus.Code Coordinates": "https://plus.codes/8FXHJ223+7J",
    "Date": "9/6/2025",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/IQ6whwdbgt35FMKF44s4Y0",
    "Notes": "",
    "GPS Coordinates": "49.6006875,11.0040625"
  },
  {
    "Region": "Africa & The Middle East",
    "Name": "Anslem Namonye - Organizer, Kampala ACX Meetup",
    "Email address": "anslemnamonye@gmail.com",
    "City": "Kampala",
    "Location description": "National ICT Innovation Hub, Nakawa, Kampala, Uganda\n\nWe'll be meeting inside the main reception area of the National ICT Innovation Hub. Once you're at the entrance, look out for a sign labeled \"ACX MEETUP - Kampala\", and I’ll be wearing a White shirt.\n\nIf you need help finding the place or have any questions, feel free to call or WhatsApp me at +256 761 951 019",
    "Plus.Code Coordinates": "https://plus.codes/6GGJ8JH7+JH",
    "Date": "9/20/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/DIIk5Ru1QxxLrBAfvIIYmi",
    "Notes": "Feel free to bring a friend or two! Light refreshments will be provided.\nPlease RSVP via WhatsApp so we can plan seating and snacks accordingly: +256 761 951 019\nCome with curiosity and an open mind.\nWe welcome both first-timers and long-time ACX readers.",
    "GPS Coordinates": "0.3290625,32.6139375"
  },
  {
    "Region": "Europe",
    "Name": "Sean Brocklebank",
    "Email address": "astral.club.edinburgh@gmail.com",
    "City": "Edinburgh",
    "Location description": "Edinburgh University Old College",
    "Plus.Code Coordinates": "https://plus.codes/9C7RWRW7+X3",
    "Date": "10/18/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/Bl5zIidSM2BA9VlBHbWxV3",
    "Notes": "This is a monthly rationalist reading group. Please write to Sean at the address above to get the readings (for October, this is three articles from Works in Progress). We also have a meeting on 06 September (which will discuss the AI 2027 project). ",
    "GPS Coordinates": "55.9474375,-3.1873125"
  },
  {
    "Region": "Europe",
    "Name": "Adam",
    "Email address": "buffer8949@gmail.com",
    "City": "Leeds UK",
    "Location description": "Tapped (a city centre brew pub a stones throw from the train station and short walk for the bus station), 51 Boar Ln, Leeds LS1 5EL,    http://tappedleeds.co.uk/",
    "Plus.Code Coordinates": "https://plus.codes/9C5WQFW3+CM",
    "Date": "9/18/2025",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "RSVP would be nice as this is the first one in Leeds and I have no idea if anyone will come ",
    "GPS Coordinates": "53.7960625,-1.5458125"
  },
  {
    "Region": "North America",
    "Name": "Michael Traner",
    "Email address": "michaeltraner7@gmail.com",
    "City": "Providence",
    "Location description": "Prospect Terrace Park if it is decent weather, the Providence Place Mall Food Court if weather is bad. I'll have a sign saying ACX MEETUP measuring at least three feet diagonally positioned in some conspicuous way. ",
    "Plus.Code Coordinates": "https://plus.codes/87HCRHJV+236",
    "Date": "10/4/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "If people RSVP in a way that provides contact info I can update based on weather, etc. The fallback location code is https://plus.codes/87HCRHGM+VH (Not sure if useful, but in case it's relevant)",
    "GPS Coordinates": "41.8300375,-71.40735939999999"
  },
  {
    "Region": "Europe",
    "Name": "Ben Woden",
    "Email address": "cascadestyler@gmail.com",
    "City": "Reading",
    "Location description": "Siren Craft Brew, 1 Friars Walk, Reading RG1 1HP",
    "Plus.Code Coordinates": "https://plus.codes/9C3XF24G+P8",
    "Date": "9/27/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "N/A",
    "Notes": "If you use Signal, feel free to ask me to add you to our Signal group, which might help if you have trouble finding us.",
    "GPS Coordinates": "51.4568125,-0.9741874999999999"
  },
  {
    "Region": "Europe",
    "Name": "Luis Campos",
    "Email address": "luis.filipe.lcampos@gmail.com",
    "City": "Lisboa",
    "Location description": "We meet on top of a small hill East of the Linha d'Água café in Jardim Amália Rodrigues. I'll be wearing a pinkish t-shirt and we'll have a ACX MEETUP sign close to us",
    "Plus.Code Coordinates": "https://plus.codes/8CCGPRJW+V8",
    "Date": "9/20/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://www.lesswrong.com/groups/iJzwL2ukGBAGNcwJq",
    "Notes": "For comfort, bring sunglasses and a blanket to sit on. There is some natural shade. Also, it can get quite windy, so bring a jacket.\n\n(Location might change due to weather)",
    "GPS Coordinates": "38.73218749999999,-9.154187499999999"
  },
  {
    "Region": "North America",
    "Name": "Richard",
    "Email address": "acx-meetup-hartford@protonmail.com",
    "City": "Glastonbury",
    "Location description": "Center Green, Glastonbury, CT",
    "Plus.Code Coordinates": "https://plus.codes/87H9P96R+VM",
    "Date": "10/4/2025",
    "Time": "01:00 AM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "41.7121875,-72.6083125"
  },
  {
    "Region": "North America",
    "Name": "Andrew Gaul",
    "Email address": "gaul@gaul.org",
    "City": "San Francisco",
    "Location description": "Mox, 1680 Mission St, San Francisco, CA",
    "Plus.Code Coordinates": "https://plus.codes/849VQHCJ+82",
    "Date": "10/4/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://www.lesswrong.com/groups/qQkgmEeEreY6gjd7o",
    "Notes": "Please RSVP on LessWrong so we can bring coffee and snacks",
    "GPS Coordinates": "37.7708125,-122.4199375"
  },
  {
    "Region": "North America",
    "Name": "Sarah W.",
    "Email address": "seraphedelweiss@proton.me",
    "City": "Buffalo",
    "Location description": "University at Buffalo South Campus, the courtyard in between Abbot Library and the Continuing Dental Education building. ",
    "Plus.Code Coordinates": "https://plus.codes/87J3X53J+HR",
    "Date": "9/7/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "42.95393749999999,-78.8179375"
  },
  {
    "Region": "North America",
    "Name": "Ryan W",
    "Email address": "wiserd@gmail.com",
    "City": "Simi valley",
    "Location description": "My house, back porch",
    "Plus.Code Coordinates": "https://plus.codes/85637673+HF",
    "Date": "9/6/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Kid and small pet friendly. Please rsvp.",
    "GPS Coordinates": "34.2639375,-118.7963125"
  },
  {
    "Region": "North America",
    "Name": "Isaac",
    "Email address": "cis@sas.upenn.edu",
    "City": "South Lake Tahoe",
    "Location description": "Brautovich Park, North Benjamin Drive",
    "Plus.Code Coordinates": "https://plus.codes/85C2X4P4+FJV",
    "Date": "9/27/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/en3mBMXs8q",
    "Notes": "Kids and dogs welcome. Please RSVP so I know if anyone is going to show!",
    "GPS Coordinates": "38.9862375,-119.8934531"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Pepe",
    "Email address": "altansarai.havard@gmail.com",
    "City": "Taipei",
    "Location description": "DeRoot休閒空間",
    "Plus.Code Coordinates": "https://plus.codes/7QQ32GRM+72",
    "Date": "9/21/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "25.0406875,121.5325625"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Cyrus",
    "Email address": "ccheung13@protonmail.com",
    "City": "Seoul",
    "Location description": "Seoul Brewery in Seongsu, 28-12, Yeonmujang-gil, Seongdong-gu, Seoul, Republic of Korea\n",
    "Plus.Code Coordinates": "https://plus.codes/8Q99G3V2+6X",
    "Date": "9/26/2025",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Please RSVP so i know how many people are joining! The organizer is an English speaker, but Korean-speakers are welcome.\n\n",
    "GPS Coordinates": "37.5430625,127.0524375"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Félix",
    "Email address": "felix.breton8@yahoo.com",
    "City": "Hong Kong",
    "Location description": "Tamar Park, near the middle of the park, I'll be wearing a red and white checkerboard hill hat",
    "Plus.Code Coordinates": "https://plus.codes/7PJP75J8+V9",
    "Date": "9/20/2025",
    "Time": "10:00 AM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "In case of heavy rain and/or typhoon the location might have to change, I'll message people who have RSVPd if that happens.",
    "GPS Coordinates": "22.2821875,114.1659375"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "David",
    "Email address": "dj@theory-a.com",
    "City": "Shanghai",
    "Location description": "Zhongshan Park 中山公园",
    "Plus.Code Coordinates": "https://plus.codes/8Q336CCC+29",
    "Date": "9/27/2025",
    "Time": "10:00 AM",
    "Event Link": "",
    "Group Link": "https://discord.com/invite/CmeRexz7JM",
    "Notes": "Park meetup so feel free to bring pets, RSVPs are appreciated",
    "GPS Coordinates": "31.2200625,121.4209375"
  },
  {
    "Region": "Europe",
    "Name": "Ozge",
    "Email address": "ozgeco@yahoo.com",
    "City": "Istanbul",
    "Location description": "Kadıkoy Yeni Iskele Kahve Dunyası ( the ferry pier building that we take ferries from Kadıkoy to Eminonu or Karakoy. Second floor, upstairs bookstore and cafe)",
    "Plus.Code Coordinates": "https://plus.codes/8GGFX2VF+45",
    "Date": "10/4/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "ACX readers, old friends, new friends welcome for an easy afternoon coffee. Please contact me at ozgeco@yahoo.com for any help request. Looking forward to seeing you soon.",
    "GPS Coordinates": "40.9928125,29.0229375"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "River",
    "Email address": "acx.k55uc@passinbox.com",
    "City": "Ubud",
    "Location description": "Kafe, Jl Hanoman: https://maps.app.goo.gl/M2Hq1CwHJKRyNvyX7",
    "Plus.Code Coordinates": "https://plus.codes/6P3QF7P7+CM",
    "Date": "9/19/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/HydwIF3u7Ve0nfpbc9EtnS",
    "Notes": "",
    "GPS Coordinates": "-8.513937499999999,115.2641875"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "River",
    "Email address": "river.satya@gmail.com",
    "City": "Ubud",
    "Location description": "Upstairs, Kafe, Jl Hanoman, Ubud.",
    "Plus.Code Coordinates": "https://plus.codes/6P3QF7P7+CM",
    "Date": "9/19/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/HydwIF3u7Ve0nfpbc9EtnS",
    "Notes": "Please RSVP on WhatsApp :).",
    "GPS Coordinates": "-8.513937499999999,115.2641875"
  },
  {
    "Region": "North America",
    "Name": "Josh",
    "Email address": "josh@joshuasnider.com",
    "City": "Rosslyn (D.C. Suburbs)",
    "Location description": "Pavilion next to McDonalds and Rosslyn Metro",
    "Plus.Code Coordinates": "https://plus.codes/87C4VWWH+FF",
    "Date": "9/20/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "38.8961875,-77.07131249999999"
  },
  {
    "Region": "North America",
    "Name": "Victor",
    "Email address": "wooddellv@yahoo.com",
    "City": "Royal Oak, north of Detroit. ",
    "Location description": "The Panera at the corner of Woodward Ave. and 13 Mile Road. I'll have a sign on the table. ",
    "Plus.Code Coordinates": "https://plus.codes/86JRGR87+X3",
    "Date": "9/19/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Please RSVP, so that I know what size table to reserve. ",
    "GPS Coordinates": "42.5174375,-83.18731249999999"
  },
  {
    "Region": "Africa & The Middle East",
    "Name": "Mostafa Shahat",
    "Email address": "ms@mostafashahat.com",
    "City": "Cairo",
    "Location description": "Cairo",
    "Plus.Code Coordinates": "Not decided yet",
    "Date": "7/31/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "NA",
    "Notes": "NA",
    "GPS Coordinates": "Invalid URL"
  },
  {
    "Region": "Other",
    "Name": "Rachel Lott",
    "Email address": "philosophique@mailfence.com",
    "City": "online",
    "Location description": "For those of us who live in rural areas and/or can't make it to the other meetups, can we try an online meetup? I have an Adobe classroom that can hold up to 100 people. It's like Zoom but with more furniture, breakout rooms that can be easily moved between, a pre-set room for playing Clue (I do this with my online students), etc.",
    "Plus.Code Coordinates": "",
    "Date": "10/20/2025",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "RSVP's required, since I'll need to know who should get the room link.",
    "GPS Coordinates": "Invalid URL"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Gavin",
    "Email address": "bisga673@student.otago.ac.nz",
    "City": "Christchurch",
    "Location description": "WEA Canterbury Workers' Educational Association - don't have details about the exact entrance right now but it will be obvious and if you are unsure, email me sometime beforehand",
    "Plus.Code Coordinates": "https://plus.codes/4V8JFJCJ+5M",
    "Date": "9/26/2025",
    "Time": "05:30 PM",
    "Event Link": "",
    "Group Link": "EA group link (same organiser): https://www.facebook.com/groups/EAChristchurch",
    "Notes": "We'll have a pot luck, and later in the evening a Petrov Day celebration. I'm a big reader of ACX and would love to connect with similar people (and connect you with some Chch EA people if you're interested). Note we've got the biggest ever NZ EA event (EA Summit) happening the next day and you're welcome to come to that too! https://www.facebook.com/share/1Aw5PaF7ms/ More info at that link. Please RSVP on facebook if you can't bring food. (Please RSVP anyway but don't let it stop you from coming)",
    "GPS Coordinates": "-43.5295625,172.6316875"
  },
  {
    "Region": "North America",
    "Name": "Michael",
    "Email address": "michael@postlibertarian.com",
    "City": "Belton",
    "Location description": "Arusha Coffee, 126 N East St, Belton, TX 76513. I will be inside at one of the tables with an ACX MEETUP sign. I will try to wear a red shirt. ",
    "Plus.Code Coordinates": "https://plus.codes/86343G4P+QXW",
    "Date": "9/27/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/XNtkJfqUqX",
    "Notes": "",
    "GPS Coordinates": "31.0569875,-97.46254689999999"
  },
  {
    "Region": "North America",
    "Name": "Joey",
    "Email address": "me@joeym.org",
    "City": "Seattle",
    "Location description": "Armistice Coffee Roosevelt, 6717 Roosevelt Way NE Suite 101, Seattle, WA 98115. I'll be in the back covered area, with a sign that says \"Astral Codex Ten Meetup\".",
    "Plus.Code Coordinates": "https://plus.codes/84VVMMHJ+4XJ",
    "Date": "9/10/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://www.meetup.com/seattle-rationality/events/; https://www.lesswrong.com/groups/PmvZmMxBtxE87PHZf; https://discord.gg/6qkjG5heDC",
    "Notes": "",
    "GPS Coordinates": "47.6778375,-122.3176094"
  },
  {
    "Region": "South America",
    "Name": "Nicolas",
    "Email address": "novaeangliae1@protonmail.com",
    "City": "Rio de Janeiro",
    "Location description": "Praça Nelson Mandela, Botafogo. I'll be sitting on the large circular concrete bench. I'll have a piece of paper with 'ACX' written on it taped to my shirt.",
    "Plus.Code Coordinates": "https://plus.codes/589R2RX8+P63",
    "Date": "9/13/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "-22.9507375,-43.1844531"
  },
  {
    "Region": "North America",
    "Name": "Ethan",
    "Email address": "ethan.morse97@gmail.com",
    "City": "Dallas",
    "Location description": "Whole Foods Market, 11700 Preston Rd Suite 714, Dallas, TX 75230. We'll be in the upstairs seating area closest to the windows.",
    "Plus.Code Coordinates": "https://plus.codes/8645W55W+2M",
    "Date": "10/4/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "32.9075625,-96.80331249999999"
  },
  {
    "Region": "North America",
    "Name": "Silas Barta",
    "Email address": "sbarta@gmail.com",
    "City": "Austin",
    "Location description": "The park by Central Market, 4001 North Lamar, Austin, Texas. We will be by the stone tables by the pond with tarps for shade. We will have a LessWrong and ACX sign and have some tents set up. You can also park in the parking lot at 3900 Guadalupe St (outside the fenced hospital area).",
    "Plus.Code Coordinates": "https://plus.codes/86248746+9C",
    "Date": "10/11/2025",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "https://austinlesswrong.com/calendar/",
    "Notes": "Feel free to bring kids/dogs (though it's a bit of a walk to the indoor bathrooms). We'll provide breakfast tacos (including vegan) and other snacks and drinks. Feel free to bring more, but it's not expected.",
    "GPS Coordinates": "30.3059375,-97.7389375"
  },
  {
    "Region": "North America",
    "Name": "Thomas Cuezze",
    "Email address": "tcuezze@gmail.com",
    "City": "Bozeman",
    "Location description": "We can use the picnic tables on the south-center side of Cooper Park. I'll be there with a cardboard sign that says \"ACX MEETUP\".",
    "Plus.Code Coordinates": "https://plus.codes/85QCMXF3+R9",
    "Date": "9/3/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "Would love to start a meetup group for Montana people if anybody's interested! Email me and if there are enough people maybe we can make a whatsapp group or something?",
    "Notes": "RSVP via email would be nice but not required.",
    "GPS Coordinates": "45.6745625,-111.0465625"
  },
  {
    "Region": "North America",
    "Name": "Noah",
    "Email address": "usernameneeded@gmail.com",
    "City": "Halifax",
    "Location description": "We will be meeting in the Oxford taproom, probably on the upper level. Our table will have a blue pyramid on it.",
    "Plus.Code Coordinates": "https://plus.codes/87PRJ9VX+PP6",
    "Date": "9/14/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/DqDK2UNX",
    "Notes": "",
    "GPS Coordinates": "44.6442875,-63.60073440000001"
  },
  {
    "Region": "North America",
    "Name": "Tim",
    "Email address": "tim.r.burr@gmail.com",
    "City": "Boise",
    "Location description": "Sunset Park, 32nd Street side",
    "Plus.Code Coordinates": "https://plus.codes/85M5JQVC+JH",
    "Date": "9/27/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "43.6440625,-116.2285625"
  },
  {
    "Region": "North America",
    "Name": "Sean Carter",
    "Email address": "sean.dan.carter@gmail.com",
    "City": "Boulder",
    "Location description": "We'll meet at Admiral Arleigh A. Burke Park, at the southeast corner at the gazebo. I'll be wearing a red shirt and there will be a sign with ACX MEETUP on it.",
    "Plus.Code Coordinates": "https://plus.codes/85FPXQV7+XXF",
    "Date": "9/6/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://groups.google.com/g/boulder-acx-ssc",
    "Notes": "Everyone is welcome. Please note that the area will be outside with outdoor shelter. Snacks provided.",
    "GPS Coordinates": "39.9949375,-105.2350781"
  },
  {
    "Region": "North America",
    "Name": "Robi and Shaked",
    "Email address": "robirahman94@gmail.com",
    "City": "Manhattan",
    "Location description": "The round grassy clearing in the middle of Pumphouse Park",
    "Plus.Code Coordinates": "https://plus.codes/87G7PX6M+RG",
    "Date": "9/7/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "Discord: https://discord.gg/QzNvSvtm, Google group: https://groups.google.com/g/overcomingbiasnyc",
    "Notes": "",
    "GPS Coordinates": "40.71206249999999,-74.0161875"
  },
  {
    "Region": "North America",
    "Name": "Jenn",
    "Email address": "jenn@kwrationality.ca",
    "City": "Waterloo",
    "Location description": "We'll be meeting in the Waterloo Public Library Main Branch Auditorium. This is next to the children's books area, on the ground floor.",
    "Plus.Code Coordinates": "https://plus.codes/86MXFF8G+94G",
    "Date": "9/18/2025",
    "Time": "07:00 PM",
    "Event Link": "https://www.lesswrong.com/events/mNmt7d65nYmiCWX4w/acx-meetups-everywhere-fall-2025",
    "Group Link": "https://www.lesswrong.com/groups/NiM9cQJ5qXqhdmP5p",
    "Notes": "Please RSVP at https://www.lesswrong.com/events/mNmt7d65nYmiCWX4w/acx-meetups-everywhere-fall-2025",
    "GPS Coordinates": "43.4659375,-80.5246719"
  },
  {
    "Region": "North America",
    "Name": "Bryce",
    "Email address": "bryce@brycedav.is",
    "City": "Rochester",
    "Location description": "Java's Cafe (16 Gibbs St)",
    "Plus.Code Coordinates": "https://plus.codes/87M4594X+W9",
    "Date": "9/24/2025",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "43.1573125,-77.6015625"
  },
  {
    "Region": "North America",
    "Name": "Joseph Shapkin",
    "Email address": "ta1hynp09@relay.firefox.com",
    "City": "Edmonton",
    "Location description": "Irrational Brewing Company, 124 Street, Edmonton, AB, Canada. We will have an ACX sign at our table.",
    "Plus.Code Coordinates": "https://plus.codes/9558HF27+7Q",
    "Date": "9/18/2025",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "https://www.lesswrong.com/groups/hNzrLboTGkRFraHWG",
    "Notes": "https://www.lesswrong.com/events/NQ7HDPkEMjmm4mdTq/acx-fall-meetups-everywhere",
    "GPS Coordinates": "53.5506875,-113.5355625"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Chris",
    "Email address": "cvjones7@gmail.com",
    "City": "Hobart",
    "Location description": "Parliament House Gardens",
    "Plus.Code Coordinates": "https://plus.codes/4R99487J+PCQ",
    "Date": "10/4/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "We'll have a crack at combining this with the local EA group (which grew out of the \"Spring\" ACX meetup). Bad weather and we'll move into Irish Murphy's.",
    "GPS Coordinates": "-42.8856625,147.3311094"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "CZ",
    "Email address": "czlee11@gmail.com",
    "City": "Auckland",
    "Location description": "Cornwall Park, at the Band Rotunda. There'll be a sign saying \"ACX MEETUP\" somewhere, but probably not a very large one, so please look around for a bit to find us, including near the Band Rotunda if the area's very busy.",
    "Plus.Code Coordinates": "https://plus.codes/4VMP4Q3Q+VR",
    "Date": "10/18/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "RSVP optional. If it's raining only slightly, we'll still meet at the Band Rotunda. If the weather's very bad, the organiser will reach out to anyone who RSVPed to advise of the new plan. Feel free to bring kids and/or any snacks you'd bring to a casual park gathering.",
    "GPS Coordinates": "-36.8953125,174.7895625"
  },
  {
    "Region": "North America",
    "Name": "Megh",
    "Email address": "meghss@proton.me",
    "City": "Calgary",
    "Location description": "At Bono Coffee Roasters, I will have ACX meetup sign",
    "Plus.Code Coordinates": "https://plus.codes/95373X33+6HW",
    "Date": "10/4/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "51.0531125,-114.0460469"
  },
  {
    "Region": "Europe",
    "Name": "Søren Elverlin",
    "Email address": "soeren.elverlin@gmail.com",
    "City": "Copenhagen",
    "Location description": "H. J. Holsts Vej 3-5C, 2605 Brøndby",
    "Plus.Code Coordinates": "https://plus.codes/9F7JMCCQ+4XR",
    "Date": "10/25/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://www.lesswrong.com/events/JTEpLhhjAbK4jiuuJ/copenhagen-acx-risk-from-ai-community-conference",
    "Notes": "RSVP on LessWrong. This meetup in particular is AI X-Risk themed, but feel free to show up and discuss other subjects.",
    "GPS Coordinates": "55.6703625,12.4398906"
  },
  {
    "Region": "Africa & The Middle East",
    "Name": "Onyinye",
    "Email address": "ninaigwe@gmail.com",
    "City": "Abuja",
    "Location description": "Farmcity Cafe Abuja and I will be wearing a yellow shirt",
    "Plus.Code Coordinates": "https://plus.codes/6FX93FMH+V4",
    "Date": "9/14/2025",
    "Time": "03:00 AM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "9.0846875,7.477812499999999"
  },
  {
    "Region": "Europe",
    "Name": "Caled",
    "Email address": "gwinyster@gmail.com",
    "City": "Moscow",
    "Location description": "г. Москва, Ломоносовский пр-т, 25к3 ЦДО Моноид",
    "Plus.Code Coordinates": "https://plus.codes/9G7VMGVH+M9",
    "Date": "9/14/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://t.me/+6oIqcFWhsilkOTJi",
    "Notes": "",
    "GPS Coordinates": "55.69418750000001,37.5284375"
  },
  {
    "Region": "Europe",
    "Name": "David",
    "Email address": "inlets_spinal_0a@icloud.com",
    "City": "Dublin",
    "Location description": "Motel One, 111-114 Middle Abbey St, North City, Dublin, D01 H220",
    "Plus.Code Coordinates": "https://plus.codes/9C5M8PXP+6H",
    "Date": "9/12/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "hxxps://chat[dot]whatsapp[dot]com/Ecgu6De4a[ignore this]XkDhAk9FELKGr (Note: The link has been obfuscated due to spam.)",
    "Notes": "No RSVP required. Email me if you have trouble accessing the group.",
    "GPS Coordinates": "53.3480625,-6.2635625"
  },
  {
    "Region": "Europe",
    "Name": "Caron",
    "Email address": "caronfire@gmail.com",
    "City": "London",
    "Location description": "Camley Street Natural Park at one of the outside tables at the entrance to the park. There will be a sign with \"ACX MEETUP\"",
    "Plus.Code Coordinates": "https://plus.codes/9C3XGVPC+7R",
    "Date": "9/21/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "No dogs allowed in the park. Kids are allowed. BYORefreshments or buy some at the cafe",
    "GPS Coordinates": "51.53568749999999,-0.1279375"
  },
  {
    "Region": "Europe",
    "Name": "Lucie Philippon",
    "Email address": "aelerinya@gmail.com",
    "City": "Paris",
    "Location description": "Parc de Montsouris, Paris",
    "Plus.Code Coordinates": "https://plus.codes/8FW4V87J+3M",
    "Date": "9/20/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.gg/JUHTZRYp3k",
    "Notes": "You can RSVP on Partiful to add the meetup to your calendar, and get notified of the future meetups: https://partiful.com/e/ZumH1DtmgOxLqSFy34jL",
    "GPS Coordinates": "48.8626875,2.3316875"
  },
  {
    "Region": "North America",
    "Name": "Alex",
    "Email address": "alex.hedtke@gmail.com",
    "City": "Kansas City",
    "Location description": "Minsky's Pizza. Tell the hostess you are here for the conference room meetup, they will bring you right to us!",
    "Plus.Code Coordinates": "https://plus.codes/86F74C58+CW",
    "Date": "9/26/2025",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "https://www.meetup.com/kc_rat_ea/",
    "Notes": "",
    "GPS Coordinates": "39.1085625,-94.58268749999999"
  },
  {
    "Region": "North America",
    "Name": "Wayne",
    "Email address": "weastman@business.rutgers.edu",
    "City": "Newark",
    "Location description": "CoolVines Newark, 625 Broad Street, Newark New Jersey",
    "Plus.Code Coordinates": "https://plus.codes/87G7PRRJ+44",
    "Date": "10/24/2025",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "40.74031250000001,-74.1696875"
  },
  {
    "Region": "North America",
    "Name": "Stefan Le Noach",
    "Email address": "stefanlenoach@gmail.com",
    "City": "Brooklyn",
    "Location description": "81 McGuinness Blvd apt 6A, my apartment roof",
    "Plus.Code Coordinates": "https://plus.codes/87G8P3G2+4F",
    "Date": "9/26/2025",
    "Time": "07:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "RSVP by email please!",
    "GPS Coordinates": "40.7253125,-73.9488125"
  },
  {
    "Region": "North America",
    "Name": "Steven",
    "Email address": "stevenl451@gmail.com",
    "City": "Redwood City",
    "Location description": "Stulsaft Park",
    "Plus.Code Coordinates": "https://plus.codes/849VFQ42+55",
    "Date": "9/13/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "You can ask in the ACXD discord",
    "Notes": "",
    "GPS Coordinates": "37.4554375,-122.2495625"
  },
  {
    "Region": "Europe",
    "Name": "Robin",
    "Email address": "robinh.backup16@gmail.com",
    "City": "Graz",
    "Location description": "Augarten Graz next to the Calisthenics Park on the grass, I will be sitting on the grass with a Volleyball, a book, and a black cap",
    "Plus.Code Coordinates": "https://plus.codes/8FVQ3C6P+3C",
    "Date": "9/19/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Feel free to bring kids/dogs/friends, would be nice to pass the Volleyball a bit (but Volleyball skills are not mandatory) Maybe later we can move to a bar/cafe/ Alternatively for bad weather: Cafe Bali (its near Augarten)",
    "GPS Coordinates": "47.0601875,15.4360625"
  },
  {
    "Region": "North America",
    "Name": "Billy",
    "Email address": "billy.mosse@gmail.com",
    "City": "Boston",
    "Location description": "Timeout market https://maps.app.goo.gl/vHmqTEHij1i46xaS6",
    "Plus.Code Coordinates": "https://plus.codes/87JC8VVW+VW",
    "Date": "10/18/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "It's a very nice market with a wide variety of eateries :) ",
    "GPS Coordinates": "42.3446875,-71.1026875"
  },
  {
    "Region": "Europe",
    "Name": "Skittle",
    "Email address": "witneymeetup@proton.me",
    "City": "Witney",
    "Location description": "The top end of Church Green, near the war memorial. I’ll wear a red jacket, and have an ‘ACX Meetup’ sign. If it’s raining, retreat to the Buttercross for a passing moment, or the Wetherspoon’s (‘The Company of Weavers’) if it looks like we need a longer period of shelter.    Close to ‘Market Square’ bus stop, or Witney has free parking. ",
    "Plus.Code Coordinates": "https://plus.codes/9C3WQGM9+9F",
    "Date": "9/27/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "51.7834375,-1.4813125"
  },
  {
    "Region": "Europe",
    "Name": "Lucas",
    "Email address": "lucas_acx_meetup_lyon@fastmail.com",
    "City": "Lyon",
    "Location description": "Parc de la tête d'or, à côté de la prairie aux daims. Nous aurons deux serviettes grises/brunes au sol et \"ACX\" écrit sur un carnet ou une feuille. Parc de la tête d'or, next to the \"prairie aux daims\". We will have two brown/grey towels on the ground and \"ACX\" written on a notebook or a piece of paper",
    "Plus.Code Coordinates": "https://plus.codes/8FQ6QVF2+GW",
    "Date": "9/6/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "Il y a un télégram ACX Lyon, si vous voulez être ajoutés envoyez moi un mail. There is a telegram group for ACX Lyon, if you want to be added shoot me an email.",
    "Notes": "",
    "GPS Coordinates": "45.7738125,4.8523125"
  },
  {
    "Region": "South America",
    "Name": "David Reis",
    "Email address": "davidreis@gmail.com",
    "City": "Belo Horizonte",
    "Location description": "Diamond Mall in front of Fany Bonbons. Address: Av. do Contorno, 6061.",
    "Plus.Code Coordinates": "https://plus.codes/58GR3358+MC",
    "Date": "10/4/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/C0SZe8fdU8O1WgLd4GsST6",
    "Notes": "",
    "GPS Coordinates": "-19.9408125,-43.9339375"
  },
  {
    "Region": "North America",
    "Name": "Kayla",
    "Email address": "cori14@gmail.com",
    "City": "Washington",
    "Location description": "Teaism Penn Quarter, 400 8th St NW, Washington, DC 20004",
    "Plus.Code Coordinates": "https://plus.codes/87C4VXVG+XM",
    "Date": "10/4/2025",
    "Time": "05:00 PM",
    "Event Link": "",
    "Group Link": "https://dcacxrationalitymeetups.beehiiv.com/; https://www.facebook.com/groups/605023464809227",
    "Notes": "Multiple Teaism locations exist; please join us at Teaism Penn Quarter on the lower level! Food and tea will be available for purchase.",
    "GPS Coordinates": "38.8949375,-77.0233125"
  },
  {
    "Region": "North America",
    "Name": "Joey",
    "Email address": "me@joeym.org",
    "City": "Bellevue",
    "Location description": "Bellevue Library, Meeting room #TBD. 1111 110th Avenue NE. Bellevue, WA 98004",
    "Plus.Code Coordinates": "https://plus.codes/84VVJRC4+35",
    "Date": "10/4/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "https://www.meetup.com/seattle-rationality/; https://www.lesswrong.com/groups/PmvZmMxBtxE87PHZf",
    "Notes": "",
    "GPS Coordinates": "47.6201875,-122.1945625"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "JT",
    "Email address": "rationalitysalon@substack.com",
    "City": "Tokyo",
    "Location description": "153-0051 Tokyo, Meguro City, Kamimeguro, 1 Chome−3−9 Fujiya Bldg., ３F (We may reschedule at the last second - join our mailing list for updates",
    "Plus.Code Coordinates": "https://plus.codes/8Q7XJPV2+QF",
    "Date": "9/13/2025",
    "Time": "10:00 AM",
    "Event Link": "",
    "Group Link": "https://rationalitysalon.substack.com/",
    "Notes": "Please join the mailing list - location may change at the last minute",
    "GPS Coordinates": "35.6444375,139.7011875"
  },
  {
    "Region": "North America",
    "Name": "Julius",
    "Email address": "julius.simonelli@gmail.com",
    "City": "San Diego",
    "Location description": "Wisdom Park",
    "Plus.Code Coordinates": "https://plus.codes/8544VRXM+65",
    "Date": "10/4/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "https://www.meetup.com/san-diego-rationalists/",
    "Notes": "",
    "GPS Coordinates": "32.8980625,-117.1670625"
  },
  {
    "Region": "North America",
    "Name": "Simon",
    "Email address": "complexzeta@gmail.com",
    "City": "Mountain View",
    "Location description": "Eagle Park, by the gate on Shoreline near Church",
    "Plus.Code Coordinates": "https://plus.codes/849V9WQ7+W7X",
    "Date": "9/28/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "37.3898625,-122.0867656"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Fawwaz",
    "Email address": "fawwazanvi@gmail.com",
    "City": "Jakarta Pusat",
    "Location description": "NITRO COFFEE @ Nugra Santana Jl. Jenderal Sudirman Kav. 7-8, Karet Tengsin, Kecamatan Tanah Abang, Jakarta, Daerah Khusus Jakarta 10250",
    "Plus.Code Coordinates": "https://plus.codes/6P58QRRC+HF",
    "Date": "10/11/2025",
    "Time": "01:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/LsVYGNILxze6nNexpSXDZC",
    "Notes": "Please RSVP through email, or by joining our WhatsApp group (WhatsApp preferred)",
    "GPS Coordinates": "-6.208562499999999,106.8211875"
  },
  {
    "Region": "North America",
    "Name": "Matt",
    "Email address": "dinosaur.explosion.crisis@gmail.com",
    "City": "Vancouver",
    "Location description": "Harbour Green Park",
    "Plus.Code Coordinates": "https://plus.codes/84XR7VQH+P7",
    "Date": "9/28/2025",
    "Time": "07:30 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Let's take over a small amount of Harbour Green Park, and if anyone shows up I'll buy them a drink.",
    "GPS Coordinates": "49.2893125,-123.1218125"
  },
  {
    "Region": "North America",
    "Name": "Allwyn",
    "Email address": "allwyn8443@gmail.com",
    "City": "Vancouver",
    "Location description": "Aperture Coffee Bar, 4124 Main St, Vancouver, BC V5V 3P7",
    "Plus.Code Coordinates": "https://plus.codes/84XR6VXX+9M",
    "Date": "9/6/2025",
    "Time": "11:00 AM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/KdlgviZRNzj1JLYEWbLmg6",
    "Notes": "For ice-breaker tell us about your fav ACX post or any posts that you really enjoyed! Please RSVP here: https://www.eventbrite.com.au/e/acx-vancouver-fall-2025-meetup-tickets-1579329028639",
    "GPS Coordinates": "49.24843749999999,-123.1008125"
  },
  {
    "Region": "North America",
    "Name": "Adam",
    "Email address": "abrahamrembrite@gmail.com",
    "City": "Kelowna",
    "Location description": "We'll be in the lounge area of the Cove Lakeside Resort. Go right from the lobby and walk down the hallway until you see a door that says \"Owner's Lounge\" then put in the code (1-9-7-4). I'll be in the lobby wearing the shirt and wielding the sign, so don't worry. ",
    "Plus.Code Coordinates": "https://plus.codes/85X2R96G+9C",
    "Date": "9/20/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "49.8109375,-119.6239375"
  },
  {
    "Region": "North America",
    "Name": "Jough",
    "Email address": "joughdonakowski@gmail.com",
    "City": "Williamsburg",
    "Location description": "Aroma's Coffeehouse and Cafe, 431 Prince George St, Williamsburg, VA 23185",
    "Plus.Code Coordinates": "https://plus.codes/879577CV+W6",
    "Date": "9/6/2025",
    "Time": "06:00 PM",
    "Event Link": "",
    "Group Link": "https://discord.com/channels/1009579704572981399/1374878078790139904",
    "Notes": "Very chill group, family and friends all welcome. We'll be indoors but pet friendly seating is availble. ",
    "GPS Coordinates": "37.2723125,-76.7069375"
  },
  {
    "Region": "North America",
    "Name": "Rivka",
    "Email address": "rivka@adrusi.com",
    "City": "Baltimore",
    "Location description": "First floor of the Performing Arts and Humanities Building at UMBC. The address is 1000 Hilltop Cir, Baltimore, MD 21250. There will be a sign that says \"ACX Meetup\".",
    "Plus.Code Coordinates": "https://plus.codes/87F5774P+53",
    "Date": "9/14/2025",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "We have a mailing list and a discord. The mailing list is more for our weekly meetup reminders and the discord is more of a social environment. Here's a link to the discord: https://discord.com/invite/h4z5UgeYVK. If you would like to be added to the mailing list, please email me.",
    "Notes": "Parking is free on the weekend. There will be food and drinks. RSVPs are useful so I know how much food to get, but are not required. ",
    "GPS Coordinates": "39.2554375,-76.7148125"
  },
  {
    "Region": "Europe",
    "Name": "Stan",
    "Email address": "stanislawmalinowski09@gmail.com",
    "City": "Oxford",
    "Location description": "The Star, 21 Rectory Rd, Oxford OX4 1BU",
    "Plus.Code Coordinates": "https://plus.codes/9C3WPQX6+QM",
    "Date": "10/15/2025",
    "Time": "06:30 PM",
    "Event Link": "",
    "Group Link": "https://www.facebook.com/groups/oxfordrationalish",
    "Notes": "Please RSVP on LessWrong so I know how many tables to book",
    "GPS Coordinates": "51.7494375,-1.2383125"
  },
  {
    "Region": "North America",
    "Name": "Ferret",
    "Email address": "meetup2025.unseen534@passmail.net",
    "City": "Fort Meade",
    "Location description": "Contact Coordinator",
    "Plus.Code Coordinates": "Contact Coordinator",
    "Date": "9/27/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "Contact Coordinator",
    "Notes": "Location is on a military base - attendees must be able to access base themselves; coordinator will not sponsor attendees onto base",
    "GPS Coordinates": "Invalid URL"
  },
  {
    "Region": "North America",
    "Name": "Michael Bond",
    "Email address": "bond@spokenaac.com",
    "City": "Marietta",
    "Location description": "McKenna's - Outside on the back patio if the weather is nice, inside in the back if it's not.",
    "Plus.Code Coordinates": "https://plus.codes/86FWCG7W+5C",
    "Date": "9/20/2025",
    "Time": "12:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "Sandwiches and drinks alcoholic and non- will be available for purchase at the counter, I'll be wearing a baseball cap with something odd on it. The park across the street will be having their annual dachshund races, so a good time is guaranteed for all.",
    "GPS Coordinates": "39.4129375,-81.4539375"
  },
  {
    "Region": "North America",
    "Name": "Vishal",
    "Email address": "DM koreindian in the LAR discord",
    "City": "Los Angeles",
    "Location description": "11841 Wagner Street, Culver City",
    "Plus.Code Coordinates": "https://plus.codes/8553XHWM+GP",
    "Date": "10/1/2025",
    "Time": "07:00 PM",
    "Event Link": "",
    "Group Link": "losangelesrationality.com. Links to the discord in there, please join the discord.",
    "Notes": "There will be a reading. Please check the discord close to the event.",
    "GPS Coordinates": "33.9963125,-118.4156875"
  },
  {
    "Region": "Europe",
    "Name": "Stian",
    "Email address": "stian.sgronlund@outlook.com",
    "City": "Nijmegen",
    "Location description": "The Sportsbar \"The Yard\" on the upper floor of the Radboud Sports Centre",
    "Plus.Code Coordinates": "https://plus.codes/9F37RV98+9X",
    "Date": "9/21/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "https://chat.whatsapp.com/GFDbgvQpgvRKL1DMpASryl",
    "Notes": "",
    "GPS Coordinates": "51.81843749999999,5.867437499999999"
  },
  {
    "Region": "North America",
    "Name": "Aaron Kaufman",
    "Email address": "ironlordbyron@gmail.com",
    "City": "Saint Paul",
    "Location description": "41 Cleveland Ave S, St Paul, MN 55105\nDavanni's Pizza\nParty Room",
    "Plus.Code Coordinates": "https://plus.codes/86P8WRQ6+XX",
    "Date": "9/28/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "This is the minneapolis/st paul ACX Discord:  https://discord.gg/m2xJcuC937",
    "Notes": "I'll be ordering pizzas for the group, including vegetarian pizza.  Note that Davanni's has no vegan options besides salad (though I will be ordering a group salad that should be vegan-compatible.)",
    "GPS Coordinates": "44.9399375,-93.1875625"
  },
  {
    "Region": "Europe",
    "Name": "Arthur",
    "Email address": "z51iba03@anonaddy.me",
    "City": "Nantes",
    "Location description": "Meetup point at the benches next to the sign right after the entrance of the Jardin des Plantes (the one facing the train station). I'll be wearing a red polo and beige pants and carrying an ACX MEETUP sign.",
    "Plus.Code Coordinates": "https://plus.codes/8CVW6F95+965",
    "Date": "9/26/2025",
    "Time": "08:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "RSVP by email is required, please. Since there doesn't seem to have been any meetups in Nantes up to now (at least in recent times), I want to know whether anyone will show up in the first place. We'll meet up at the park first, since it's easier to find people there and less prone to exceptional closures, then move on to a nearby bar once everyone has arrived.",
    "GPS Coordinates": "47.2183875,-1.5418906"
  },
  {
    "Region": "North America",
    "Name": "David",
    "Email address": "ddfr@daviddfriedman.com",
    "City": "San Jose",
    "Location description": "3806 Williams Rd, San Jose, CA 95117",
    "Plus.Code Coordinates": "https://plus.codes/849W825J+6Q",
    "Date": "9/20/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "http://www.daviddfriedman.com/SSC%20Meetups%20announcement.html",
    "Notes": "RSVP to my email so we will have a rough count of how many we are feeding.",
    "GPS Coordinates": "37.3080625,-121.9680625"
  },
  {
    "Region": "Africa & The Middle East",
    "Name": "Erol Can Akbaba",
    "Email address": "erolcan.akbaba@gmail.com",
    "City": "Ankara",
    "Location description": "Cafe Botanica",
    "Plus.Code Coordinates": "https://plus.codes/8GFJWV36+VW",
    "Date": "10/4/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "",
    "Notes": "",
    "GPS Coordinates": "39.9046875,32.8623125"
  },
  {
    "Region": "North America",
    "Name": "Spencer",
    "Email address": "focorats@posteo.net",
    "City": "Fort Collins",
    "Location description": "Old Town Library - Go in through the front doors, take a left, first door on the right.",
    "Plus.Code Coordinates": "https://plus.codes/85GPHWMG+XXX",
    "Date": "9/28/2025",
    "Time": "02:00 PM",
    "Event Link": "",
    "Group Link": "https://focorats.github.io/",
    "Notes": "",
    "GPS Coordinates": "40.5849875,-105.0725156"
  },
  {
    "Region": "Asia-Pacific",
    "Name": "Ankur Pandey",
    "Email address": "ankurpandey.info@gmail.com",
    "City": "Mumbai",
    "Location description": "ARC Cafe and Rooftop Lounge, Powai, Mumbai",
    "Plus.Code Coordinates": "https://plus.codes/7JFJ4WC5+WF",
    "Date": "9/27/2025",
    "Time": "04:00 PM",
    "Event Link": "",
    "Group Link": "https://swiy.co/acx-meetup-mumbai",
    "Notes": "Please join the group, share suggestion for an effective meetup (like questions for Socratic dialogues)",
    "GPS Coordinates": "19.1223125,72.9086875"
  },
  {
    "Region": "Europe",
    "Name": "Andreas Jessen",
    "Email address": "andreasjessen@gmx.net",
    "City": "Hamburg",
    "Location description": "Eppendorfer Park at the pond, we will have a sign reading \"ACX Meetup\".",
    "Plus.Code Coordinates": "https://plus.codes/9F5FHXQH+MF",
    "Date": "10/18/2025",
    "Time": "03:00 PM",
    "Event Link": "",
    "Group Link": "https://www.meetup.com/rationality-hamburg/",
    "Notes": "Feel free to bring friends and family. ",
    "GPS Coordinates": "53.58918749999999,9.9786875"
  }
]
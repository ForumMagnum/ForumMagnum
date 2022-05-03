/**
 * This file is copied from https://github.com/CultureHQ/add-to-calendar/blob/master/src/makeUrls.ts
 * (I deleted Yahoo since no one uses that)
 */

export interface CalendarEvent {
  name: string;
  details: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
}

const makeTime = (time: string) => new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, "");

type Query = { [key: string]: null | boolean | number | string };

const makeUrl = (base: string, query: Query) => Object.keys(query).reduce(
  (accum, key, index) => {
    const value = query[key];

    if (value !== null) {
      return `${accum}${index === 0 ? "?" : "&"}${key}=${encodeURIComponent(value)}`;
    }
    return accum;
  },
  base
);

const makeGoogleCalendarUrl = (event: CalendarEvent) => makeUrl("https://calendar.google.com/calendar/render", {
  action: "TEMPLATE",
  dates: `${makeTime(event.startsAt)}/${makeTime(event.endsAt)}`,
  location: event.location,
  text: event.name,
  details: event.details
});

const makeOutlookCalendarUrl = (event: CalendarEvent) => makeUrl("https://outlook.live.com/owa", {
  rru: "addevent",
  startdt: event.startsAt,
  enddt: event.endsAt,
  subject: event.name,
  location: event.location,
  body: event.details,
  allday: false,
  uid: new Date().getTime().toString(),
  path: "/calendar/view/Month"
});

const makeICSCalendarUrl = (event: CalendarEvent) => {
  const components = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT"
  ];

  // In case of SSR, document won't be defined
  if (typeof document !== "undefined") {
    components.push(`URL:${document.URL}`);
  }

  components.push(
    `DTSTART:${makeTime(event.startsAt)}`,
    `DTEND:${makeTime(event.endsAt)}`,
    `SUMMARY:${event.name}`,
    `DESCRIPTION:${event.details}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return encodeURI(`data:text/calendar;charset=utf8,${components.join("\n")}`);
};

type URLSet = { [key: string]: string };

const makeUrls = (event: CalendarEvent): URLSet => ({
  google: makeGoogleCalendarUrl(event),
  outlook: makeOutlookCalendarUrl(event),
  ics: makeICSCalendarUrl(event)
});

export default makeUrls;

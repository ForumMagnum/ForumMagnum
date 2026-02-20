import { gql } from "@/lib/generated/gql-codegen";
import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { MarkdownDate } from "@/server/markdownComponents/MarkdownDate";
import { MarkdownUserLink } from "@/server/markdownComponents/MarkdownUserLink";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { getPostsListLimit } from "../postsListUtils";

const DEFAULT_NEARBY_LIMIT = 10;
const MAX_NEARBY_LIMIT = 50;

const COMMUNITY_MARKDOWN_QUERY = gql(`
  query MarkdownCommunityPage(
    $defaultLimit: Int,
    $nearbyLimit: Int,
    $lat: Float,
    $lng: Float,
    $hasCoordinates: Boolean!
  ) {
    upcomingInPerson: posts(selector: { events: { onlineEvent: false, globalEvent: false } }, limit: $defaultLimit) {
      results {
        _id
        slug
        title
        location
        startTime
        endTime
        onlineEvent
        globalEvent
        user { slug displayName }
      }
    }
    globalEvents: posts(selector: { globalEvents: {} }, limit: $defaultLimit) {
      results {
        _id
        slug
        title
        location
        startTime
        endTime
        onlineEvent
        globalEvent
        user { slug displayName }
      }
    }
    nearbyInPerson: posts(
      selector: { nearbyEvents: { lat: $lat, lng: $lng, onlineEvent: false } },
      limit: $nearbyLimit
    ) @include(if: $hasCoordinates) {
      results {
        _id
        slug
        title
        location
        startTime
        endTime
        onlineEvent
        globalEvent
        user { slug displayName }
      }
    }
  }
`);

function parseCoordinate(rawValue: string | null, min: number, max: number): number | null {
  if (rawValue === null || rawValue === "") return null;
  const parsed = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function parseNearbyLimit(rawValue: string | null): number {
  if (!rawValue) return DEFAULT_NEARBY_LIMIT;
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_NEARBY_LIMIT;
  return Math.min(parsed, MAX_NEARBY_LIMIT);
}

interface MarkdownCommunityEvent {
  _id: string
  slug?: string | null
  title: string
  location?: string | null
  startTime?: Date | string | null
  endTime?: Date | string | null
  onlineEvent?: boolean | null
  globalEvent?: boolean | null
  user?: {
    slug: string
    displayName: string
  } | null
}

function EventList({ events }: { events: MarkdownCommunityEvent[] }) {
  if (events.length === 0) {
    return <div>_No events found._</div>;
  }

  return (
    <ul>
      {events.map((event) => {
        const markdownPath = event.slug
          ? `/api/events/${event._id}/${event.slug}`
          : `/api/events/${event._id}`;
        const htmlPath = event.slug
          ? `/events/${event._id}/${event.slug}`
          : `/events/${event._id}`;

        return (
          <li key={event._id}>
            <a href={markdownPath}>{event.title}</a>
            <ul>
              {event.user ? <li>Organizer: <MarkdownUserLink user={event.user} /></li> : null}
              {event.startTime ? <li>Starts: <MarkdownDate date={event.startTime} /></li> : null}
              {event.endTime ? <li>Ends: <MarkdownDate date={event.endTime} /></li> : null}
              {event.location ? <li>Location: {event.location}</li> : null}
              {event.globalEvent ? <li>Scope: global event</li> : <li>Scope: local/regional event</li>}
              {event.onlineEvent ? <li>Format: online or hybrid</li> : <li>Format: in-person</li>}
              <li>HTML: <a href={htmlPath}>{htmlPath}</a></li>
              <li>Markdown: <a href={markdownPath}>{markdownPath}</a></li>
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export async function GET(req: NextRequest) {
  const lat = parseCoordinate(req.nextUrl.searchParams.get("lat"), -90, 90);
  const lng = parseCoordinate(req.nextUrl.searchParams.get("lng"), -180, 180);
  const hasCoordinates = lat !== null && lng !== null;

  const latProvided = req.nextUrl.searchParams.has("lat");
  const lngProvided = req.nextUrl.searchParams.has("lng");
  const invalidCoordinates = (latProvided || lngProvided) && !hasCoordinates;

  const resolverContext = await getContextFromReqAndRes({ req });
  const defaultLimit = Math.min(getPostsListLimit(req), 20);
  const nearbyLimit = parseNearbyLimit(req.nextUrl.searchParams.get("nearbyLimit"));

  const { data } = await runQuery(COMMUNITY_MARKDOWN_QUERY, {
    defaultLimit,
    nearbyLimit,
    lat,
    lng,
    hasCoordinates,
  }, resolverContext);

  const upcomingInPerson = data?.upcomingInPerson?.results ?? [];
  const globalEvents = data?.globalEvents?.results ?? [];
  const nearbyInPerson = data?.nearbyInPerson?.results ?? [];

  return await markdownResponse(
    <div>
      <div className={markdownClasses.title}>Community</div>
      <div>
        This page focuses on finding upcoming in-person events. Unlike the HTML <a href="/community">/community</a>{" "}
        page, this markdown version does not use browser geolocation.
      </div>
      <ul>
        <li>Provide coordinates with <code>?lat=...&amp;lng=...</code> to get nearby in-person events.</li>
        <li>Optional: <code>nearbyLimit</code> controls nearby result count (default {DEFAULT_NEARBY_LIMIT}, max {MAX_NEARBY_LIMIT}).</li>
        <li>Optional: <code>limit</code> controls list sizes for non-nearby sections (max 20 on this endpoint).</li>
      </ul>
      {hasCoordinates ? (
        <>
          <h2>Nearby In-Person Events</h2>
          <div>
            Using coordinates: lat={lat}, lng={lng}
          </div>
          <EventList events={nearbyInPerson} />
        </>
      ) : null}
      {invalidCoordinates ? (
        <div>
          Ignored invalid coordinates. Use numeric <code>lat</code> in [-90, 90] and <code>lng</code> in [-180, 180].
        </div>
      ) : null}
      <h2>Upcoming In-Person Events (Location-Independent)</h2>
      <EventList events={upcomingInPerson} />
      <h2>Global Events</h2>
      <EventList events={globalEvents} />
    </div>
  );
}

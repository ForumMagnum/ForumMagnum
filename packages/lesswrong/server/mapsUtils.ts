import { mapsAPIKeySetting } from '@/lib/instanceSettings';
import { Client, LatLng } from '@googlemaps/google-maps-services-js'
import { captureException } from '@sentry/nextjs';

export async function getLocalTime(time: AnyBecauseTodo, googleLocation: AnyBecauseTodo): Promise<Date|null> {
  const googleMapsApiKey = mapsAPIKeySetting.get()
  if (!googleMapsApiKey) {
    // eslint-disable-next-line no-console
    console.log("No Server-side Google Maps API key provided, can't resolve local time")
    return null
  }
  if (!googleLocation) {
    // eslint-disable-next-line no-console
    console.log("No googleLocation provided")
    return null
  }
  if (!time) {
    // eslint-disable-next-line no-console
    console.log("No time provided")
    return null
  }
  const googleMapsClient = new Client({});

  try {
    const { geometry: { location } } = googleLocation
    const apiResponse = await googleMapsClient.timezone({params: {
      key:  googleMapsApiKey,
      location: (location as LatLng), 
      timestamp: new Date(time) } });
    const { data: { dstOffset, rawOffset } } = apiResponse //dstOffset and rawOffset are in the unit of seconds
    const localTimestamp = new Date(time).getTime() + ((dstOffset + rawOffset)*1000) // Translate seconds to milliseconds
    return new Date(localTimestamp)
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Error in getting local time fromGoogle Maps API:", err?.message)
    captureException(err);
    return null;
  }
}

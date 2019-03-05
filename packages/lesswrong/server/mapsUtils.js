import { getSetting } from 'meteor/vulcan:core';
import googleMaps from '@google/maps'

const googleMapsApiKey = getSetting('googleMaps.serverApiKey', null)
let googleMapsClient = null
if (googleMapsApiKey) {
  googleMapsClient = googleMaps.createClient({
    key: googleMapsApiKey,
    Promise: Promise
  });
} else {
  // eslint-disable-next-line no-console
  console.log("No Google maps API key provided, please provide one for proper geocoding")
}

export async function getLocalTime(time, googleLocation) {
  try {
    const { geometry: { location } } = googleLocation
    const apiResponse = await googleMapsClient.timezone({location, timestamp: new Date(time)}).asPromise()
    const { json: { dstOffset, rawOffset } } = apiResponse //dstOffset and rawOffset are in the unit of seconds
    const localTimestamp = new Date(time).getTime() + ((dstOffset + rawOffset)*1000) // Translate seconds to milliseconds
    return new Date(localTimestamp)
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Error in getting local time:", err)
    throw err
  }
}

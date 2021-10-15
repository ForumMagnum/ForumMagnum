import { Client, LatLng } from '@googlemaps/google-maps-services-js'
import { DatabaseServerSetting } from './databaseSettings';

const googleMapsApiKeySetting = new DatabaseServerSetting<string | null>('googleMaps.serverApiKey', null)

export async function getLocalTime(time, googleLocation) {
  const googleMapsApiKey = googleMapsApiKeySetting.get()
  if (!googleMapsApiKey) {
    // eslint-disable-next-line no-console
    console.log("No Server-side Google Maps API key provided, can't resolve local time")
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
    console.error("Error in getting local time:", err)
    throw err
  }
}

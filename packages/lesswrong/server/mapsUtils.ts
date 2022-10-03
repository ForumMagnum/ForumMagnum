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
    console.error("Error in getting local time:", err)
    throw err
  }
}

// Google Maps reverse-geocoding gives us a list of interpretations
// of the latitude-longitude pair we gave it, of different types and
// granularities. Here's an example result:
//   {
//     address_components: [
//       0: {long_name: "South Berkeley", short_name: "South Berkeley", types: Array(2)}
//       1: {long_name: "Berkeley", short_name: "Berkeley", types: Array(2)}
//       2: {long_name: "Alameda County", short_name: "Alameda County", types: Array(2)}
//       3: {long_name: "California", short_name: "CA", types: Array(2)}
//       4: {long_name: "United States", short_name: "US", types: Array(2)}
//     ],
//     formatted_address: "South Berkeley, Berkeley, CA, USA",
//     geometry: {...},
//     place_id: "...",
//     types: ["neighborhood", "political"]
//   }
// When you click the Geocode button, we pick one of the interpretations to
// prefill the location field with. We don't want to use a result that
// corresponds to an exact address (people probably don't want to publish that),
// and also don't want something too imprecise like "California".
//
// We have a preference ordering among types, and choose the first result with
// the most preferred type.
export function pickBestReverseGeocodingResult(results: any[]) {
  const locationTypePreferenceOrdering = ["neighborhood", "postal_code", "locality", "political"];
  for (let locationType of locationTypePreferenceOrdering) {
    for (let result of results) {
      if (result.types.indexOf(locationType) >= 0)
        return result;
    }
  }
  return results[0];
}


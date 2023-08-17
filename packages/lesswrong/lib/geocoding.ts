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


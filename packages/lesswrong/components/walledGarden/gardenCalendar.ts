import moment from "moment"

const API_KEY = 'AIzaSyCGszBQXwdm0Wrv9kl3P4yh_agzPPWYag4';
export const CAL_ID = 'vovsdsnc1k83iufqpdalbd675k@group.calendar.google.com';
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

export const getCalendarEvents = async (callback: AnyBecauseTodo) => {
  const script = document.createElement("script");
  script.src = "https://apis.google.com/js/api.js";
  document.body.appendChild(script);

  script.onload = () => {
    gapi.load('client:auth2', initClient);
    loadEvents(callback)
  }
}
const loadEvents = (callback: AnyBecauseTodo) => {
  const twoHoursAgo = moment().subtract(2, 'hours').toISOString()
  const oneMonthFromNow = moment().add(30, 'days').toISOString()
  function start() {
    gapi.client.init({
      'apiKey': API_KEY
    }).then(function() {
      return gapi.client.request({
        'path': `https://www.googleapis.com/calendar/v3/calendars/${CAL_ID}/events`,
        'params': {
          'timeMin': twoHoursAgo,
          'timeMax': oneMonthFromNow,
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 50,
          'orderBy': 'startTime'
        }
      })
    }).then( (response) => {
      let events = response.result.items
      callback(events)
    }, function(reason) {
      // eslint-disable-next-line no-console
      console.log(reason);
    });
  }
  gapi.load('client', start)
}

function initClient() {
  void gapi.client.init({
    apiKey: API_KEY,
    // clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  })
}

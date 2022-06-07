import fetch from 'node-fetch';
import { DatabaseServerSetting } from './databaseSettings';

const zohoClientId = new DatabaseServerSetting('zoho.clientId', '')
const zohoClientSecret = new DatabaseServerSetting('zoho.secret', '')
const zohoRefreshToken = new DatabaseServerSetting('zoho.refreshToken', '')

let accessToken = ''

export const getEAGApplicationData = async (email: string) => {
  let eagAppResponse = await getZohoData(email)
  
  if (!eagAppResponse.ok) {
    await refreshZohoToken()
    eagAppResponse = await getZohoData(email)
  }
  
  console.log('accessToken', accessToken)
  if (!eagAppResponse.ok) {
    throw new Error('Failed to retrieve data from Zoho')
  }
  
  const parsedResponse = await eagAppResponse.json()
  if (!parsedResponse.data.length) {
    return {}
  }
  
  return parsedResponse
}

const getZohoData = async (email: string) => {
  return await fetch("https://www.zohoapis.com/crm/v3/coql", {
    "headers": {
      "Authorization": `Bearer ${accessToken}`,
      "accept": "*/*",
      "content-type": "application/json",
    },
    "body": `{
        "select_query":"select Email, Created_Time, First_name, Last_name, LinkedIn_profile_summary, Where_do_you_work, What_stage_of_your_career_are_you_in, What_is_your_job_title_or_current_role, Your_nearest_city, Which_group_s_do_you_currently_organize_and_what, What_are_you_hoping_to_get_out_of_the_event_and_h, How_can_you_help_the_other_attendees_at_the_event from EAG_London_22 where Email = '${email}' limit 1"
    }`,
    "method": "POST",
  })
}

const refreshZohoToken = async () => {
  const refreshResponse = await fetch(`https://accounts.zoho.com/oauth/v3/token?refresh_token=${zohoRefreshToken}&client_id=${zohoClientId}&client_secret=${zohoClientSecret}&grant_type=refresh_token`, {
    "headers": {
      "accept": "*/*",
    },
    "method": "POST",
  })
  
  if (!refreshResponse.ok) {
    console.error(refreshResponse.statusText)
    throw new Error('Failed to refresh Zoho token')
  }
  
  const res = await refreshResponse.json()
  console.log(res)
  if (!res.access_token) {
    throw new Error('Failed to refresh Zoho token')
  }
  
  accessToken = res.access_token
}

// addStaticRoute('/api/eag-application-data', async (props, req, res, next) => {
//   const currentUser = await getUserFromReq(req)

//   if (!currentUser || !currentUser.email) {
//     res.statusCode = 403
//     res.end("Not logged in or current user has no email address")
//     return
//   }
  
//   const eagAppResponse = await getEAGApplicationData(currentUser.email)
//   if (!eagAppResponse.ok) {
//     console.log(eagAppResponse.status)
//     // const refreshTokenResponse = await fetch(`https://accounts.zoho.com/oauth/v3/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`, {
//     //   "headers": {
//     //     "accept": "*/*",
//     //     "content-type": "application/json",
//     //   },
//     //   "method": "POST",
//     // })
//   }
  
//   console.log(eagAppResponse.status)
  
//   if (!eagAppResponse.ok) {
//     res.statusCode = eagAppResponse.status
//     res.end(eagAppResponse.statusText)
//     return
//   }
  
//   const parsedResponse = await eagAppResponse.json()
//   if (!parsedResponse.data.length) {
//     res.end('No EAG application data found')
//     return
//   }
  
//   console.log(parsedResponse)
//   res.end(parsedResponse.data[0], 'json')
// });

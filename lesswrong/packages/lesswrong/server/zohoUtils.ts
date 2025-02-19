import { DatabaseServerSetting } from './databaseSettings';

const zohoClientId = new DatabaseServerSetting('zoho.clientId', '')
const zohoClientSecret = new DatabaseServerSetting('zoho.secret', '')
const zohoRefreshToken = new DatabaseServerSetting('zoho.refreshToken', '')

let accessToken = ''

export const getEAGApplicationData = async (email: string) => {
  // sanitize email address
  email = email.replace(new RegExp(/[^a-z0-9+_.@-]/ig), '')
  
  let eagAppResponse = await getZohoData2022(email)
  
  if (!eagAppResponse.ok) {
    await refreshZohoToken()
    eagAppResponse = await getZohoData2022(email)
  }
  
  if (!eagAppResponse.ok) {
    throw new Error('Failed to retrieve data from Zoho')
  }
  
  // if no application data found in EAG 2022, check 2022 EAGx events
  for (let event of ['EAGxRotterdam', 'EAGxBerlin', 'EAGxSingapore']) {
    if (eagAppResponse.status === 204) {
      eagAppResponse = await getZohoDataEAGx(event, email)
    }
  }

  // finally, check EAG 2021
  if (eagAppResponse.status === 204) {
    eagAppResponse = await getZohoData2021(email)
  }
  
  // no EAG application data found for the given email address
  if (eagAppResponse.status === 204) {
    return {}
  }
  
  const parsedResponse = await eagAppResponse.json()
  if (!parsedResponse.data.length) {
    return {}
  }
  
  return parsedResponse
}

const getZohoData2022 = async (email: string) => {
  return await fetch("https://www.zohoapis.com/crm/v3/coql", {
    "headers": {
      "Authorization": `Bearer ${accessToken}`,
      "accept": "*/*",
      "content-type": "application/json",
    },
    "body": `{
        "select_query":"select Email, Which_event_s_are_you_registering_for_EA_Globa, Which_event_s_are_you_applying_to_registering_for, Which_event_s_are_you_registering_for, LinkedIn_profile_summary, LinkedIn_URL, Where_do_you_work, What_stage_of_your_career_are_you_in, What_is_your_job_title_or_current_role, Your_nearest_city, Which_group_s_do_you_currently_organize_and_what, What_are_you_hoping_to_get_out_of_the_event_and_h, How_can_you_help_the_other_attendees_at_the_event, Brief_bio_150_words_maximum, Path_to_impact from EAG_London_22 where Email = '${email}' and Test_application = false limit 1"
    }`,
    "method": "POST",
  })
}

const getZohoDataEAGx = async (event: string, email: string) => {
  return await fetch("https://www.zohoapis.com/crm/v3/coql", {
    "headers": {
      "Authorization": `Bearer ${accessToken}`,
      "accept": "*/*",
      "content-type": "application/json",
    },
    "body": `{
        "select_query":"select Email, Which_event_s_are_you_applying_to_registering_for, Which_event_s_are_you_registering_for, LinkedIn_profile_summary, Where_do_you_work, What_stage_of_your_career_are_you_in, What_is_your_job_title_or_current_role, Your_nearest_city, Which_group_s_do_you_currently_organize_and_what, What_are_you_hoping_to_get_out_of_the_event_and_h, How_can_you_help_the_other_attendees_at_the_event, Brief_bio_150_words_maximum, Path_to_impact from ${event} where Email = '${email}' and Test_application = false limit 1"
    }`,
    "method": "POST",
  })
}

const getZohoData2021 = async (email: string) => {
  return await fetch("https://www.zohoapis.com/crm/v3/coql", {
    "headers": {
      "Authorization": `Bearer ${accessToken}`,
      "accept": "*/*",
      "content-type": "application/json",
    },
    "body": `{
        "select_query":"select Email, Which_Event, LinkedIn_profile_summary, Where_do_you_work, What_stage_of_your_career_are_you_in, What_is_your_job_title_or_current_role, Your_nearest_city, Which_group_s_do_you_currently_organize_and_what, How_can_you_help_the_other_attendees_at_the_event, Brief_bio_150_words_maximum, Path_to_impact from EAG_London_21 where Email = '${email}' and Test_application = false limit 1"
    }`,
    "method": "POST",
  })
}

const refreshZohoToken = async () => {
  const refreshResponse = await fetch(`https://accounts.zoho.com/oauth/v2/token?refresh_token=${zohoRefreshToken.get()}&client_id=${zohoClientId.get()}&client_secret=${zohoClientSecret.get()}&grant_type=refresh_token`, {
    "headers": {
      "accept": "*/*",
    },
    "method": "POST",
  })
  
  if (!refreshResponse.ok) {
    throw new Error('Failed to refresh Zoho token')
  }
  
  const res = await refreshResponse.json()
  if (!res.access_token) {
    throw new Error('Failed to refresh Zoho token')
  }
  
  accessToken = res.access_token
}


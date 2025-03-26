import request from 'request';
import { DatabaseServerSetting } from '../databaseSettings';
import gql from 'graphql-tag';

export const coronaLinkDatabaseGraphQLTypeDefs = gql`
  type CoronaVirusDataRow {
    accepted: String,
    imp: String,
    link: String,
    shortDescription: String,
    url: String ,
    description: String,
    domain: String,
    type: String,
    reviewerThoughts: String,
    foundVia: String,
    sourceLink: String,
    sourceLinkDomain: String,
    lastUpdated: String,
    title: String,
    dateAdded: String,
    category: String
  }
  type CoronaVirusDataSchema {
    range: String,
    majorDimension: String,
    values: [CoronaVirusDataRow!]
  }
  extend type Query {
    CoronaVirusData: CoronaVirusDataSchema
  }
`

const googleSheetsAPIKeySetting = new DatabaseServerSetting<string | null>('googleSheets.apiKey', null)


async function getDataFromSpreadsheet(spreadsheetId: string, rangeString: string) {
  const googleSheetsAPIKey = googleSheetsAPIKeySetting.get()
  return new Promise((resolve, reject) => {
    request.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeString}?key=${googleSheetsAPIKey}`, (err, response, body) => {
      if (err) reject(err);
      return resolve(body);
    })
  })
}

const coronaVirusSheetId = `1aXBq5edfzvOz22rot6JvMeKD0tRF9-w4fF500fIrvcs`
const allLinksRangeString = `'All Links'!1:1000`

export const coronaLinkDatabaseGraphQLQueries = {
  async CoronaVirusData(root: void, args: {}, context: ResolverContext) {
    const rawCoronavirusData: any = await getDataFromSpreadsheet(coronaVirusSheetId, allLinksRangeString)
    const processedData = JSON.parse(rawCoronavirusData)
    const [headerRow, ...otherRows] = processedData.values
    const newValues = otherRows.map(([
      accepted, imp, link, shortDescription,
      url, description, domain,
      type, reviewerThoughts, foundVia,
      sourceLink, sourceLinkDomain, lastUpdated,
      title, dateAdded, category
    ]: AnyBecauseTodo) => ({
      accepted, imp, link, shortDescription,
      url, description, domain,
      type, reviewerThoughts, foundVia,
      sourceLink, sourceLinkDomain, lastUpdated,
      title, dateAdded, category
    }))
    return {
      ...processedData,
      values: newValues
    }
  }
}

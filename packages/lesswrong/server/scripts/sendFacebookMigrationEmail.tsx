/* eslint-disable no-console */
import React from "react";
import { isEAForum } from "@/lib/instanceSettings";
import { wrapAndSendEmail } from "../emails/renderEmail";
import { Components } from "@/lib/vulcan-lib/components";
import { sheets_v4 } from "@googleapis/sheets";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { GoogleAuth } from "google-auth-library";
import { runServerOnStartupFunctions } from "../serverMain";
import '@/server/emailComponents/EmailFacebookMigration'

const USER_QUERY = `
      WITH input_data AS (
          SELECT
              $1 AS input_email,
              $2 AS input_auth0_id
      ),
      q1 AS (
          SELECT
              u._id,
              TRUE  AS matched_q_one,
              FALSE AS matched_q_two,
              FALSE AS matched_q_three
          FROM "Users" u
          CROSS JOIN input_data i
          WHERE LOWER(u.email) = LOWER(i.input_email)
      ),
      q2 AS (
          SELECT
              u._id,
              FALSE AS matched_q_one,
              TRUE  AS matched_q_two,
              FALSE AS matched_q_three
          FROM "Users" u
          CROSS JOIN input_data i
          WHERE EXISTS (
              SELECT 1
              FROM unnest(u.emails) AS e
              WHERE LOWER(e ->> 'address') = LOWER(i.input_email)
          )
      ),
      q3 AS (
          SELECT
              u._id,
              FALSE AS matched_q_one,
              FALSE AS matched_q_two,
              TRUE  AS matched_q_three
          FROM "Users" u
          CROSS JOIN input_data i
          WHERE (u.services->'auth0'->>'id') = i.input_auth0_id
      ),
      unioned AS (
          SELECT * FROM q1
          UNION ALL
          SELECT * FROM q2
          UNION ALL
          SELECT * FROM q3
      ),
      aggregated AS (
          SELECT
              _id,
              bool_or(matched_q_one)   AS matched_q_one,
              bool_or(matched_q_two)   AS matched_q_two,
              bool_or(matched_q_three) AS matched_q_three
          FROM unioned
          GROUP BY _id
      )
      SELECT
          u.*
      FROM aggregated a
      JOIN "Users" u ON u._id = a._id
      ORDER BY a._id;
    `;

const COL_HEADING_AUTOMATED_TIME = "automated_email_time";
const COL_U = "U"; // Column we should store automated_email_time in

/**
 * Example headings in the sheet:
 *   auth0_user_id, email, auth0_providers, has_facebook, has_auth0, has_google,
 *   application_client_ids, applications_readable, auth0_total_users_found, preferred_providers,
 *   db_match_query_1, db_match_query_2, db_match_query_3, db_total_users_found, db_matched_any_query,
 *   karma, email_password_login, errors, to_contact_high_prio, to_contact_low_prio, (and now) automated_email_time at column U
 *
 * We'll read all rows, find relevant ones, send emails, and write back timestamps into column U.
 */

export const sendFacebookMigrationEmailFromSheet = async (dryRun = true, sheetId: string, sheetName = 'test', keyFile: string) => {
  if (!isEAForum) return;

  const auth = new GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheetsClient = new sheets_v4.Sheets({ auth });

  await runServerOnStartupFunctions();

  const sqlClient = getSqlClientOrThrow();

  // 1) Fetch the sheet data
  const range = `${sheetName}!A1:Z`;
  const sheetResp = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const rows = sheetResp.data.values || [];
  if (!rows.length) {
    console.log("No data found in the sheet!");
    return;
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const sheetData = dataRows.map((cells) => {
    const rowObj: Record<string, string> = {};
    headers.forEach((heading, i) => {
      rowObj[heading] = cells[i] || "";
    });
    return rowObj;
  });

  // Find the index of "automated_email_time", add it if needed
  let timeColumnIndex = headers.indexOf(COL_HEADING_AUTOMATED_TIME);
  if (timeColumnIndex < 0) {
    timeColumnIndex = headers.length;
    headers.push(COL_HEADING_AUTOMATED_TIME);

    // Write updated header row back to the sheet
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });
  }

  for (let i = 0; i < sheetData.length; i++) {
    const rowObj = sheetData[i];

    // since row 1 is the headers
    const sheetRow = i + 2;

    const toSend =
      rowObj["applications_readable"].includes("EA Forum") &&
      (rowObj["email_password_login"] === "added" || rowObj["email_password_login"] === "existed") &&
      !rowObj["automated_email_time"]; // Skip if we have already sent an email
    const hasFacebook = rowObj["has_facebook"] === "TRUE";
    const hasGoogleLogin = rowObj["has_google"] === "TRUE";
    const hasEmailLogin = rowObj["has_auth0"] === "TRUE";
    const email = rowObj["email"];
    const auth0Id = rowObj["auth0_user_id"];

    if (!toSend) {
      console.log(`Skipping user ${email}`);
      continue;
    }

    const users = await sqlClient.manyOrNone<DbUser>(USER_QUERY, [email, auth0Id]);

    if (users.length !== 1) {
      console.error(`Could not find unique user for ${email}, found ${users.length} matches`);
      continue;
    }

    const userByEmail = users[0];

    // We'll pretend to email them
    console.log(`Will send migration email to ${email} (dryRun=${dryRun}) (user=${userByEmail.displayName})`);

    if (!dryRun) {
      try {
        // The code below is just your existing approach. Adjust as needed.
        await wrapAndSendEmail({
          user: userByEmail,
          to: email,
          from: "EA Forum Team <eaforum@centreforeffectivealtruism.org>",
          subject: `[Action Required] Switch from Facebook login by April 2nd`,
          body: (
            <Components.EmailFacebookMigration
              email={email}
              user={userByEmail}
              hasEmailLogin={hasEmailLogin}
              hasGoogleLogin={hasGoogleLogin}
            />
          ),
        });
        console.log(`Emailed user: ${userByEmail._id}`);
      } catch (err) {
        console.log(`Error sending email to ${userByEmail._id}:`, err);
        // skip writing the time if it fails
        continue;
      }
    }

    // If dry run or real run succeeded, we record a timestamp in col U
    const timeStr = new Date().toISOString();
    const updateRange = `${sheetName}!${COL_U}${sheetRow}:${COL_U}${sheetRow}`;
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: updateRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [[timeStr]],
      },
    });
    console.log(`Wrote time ${timeStr} to row ${sheetRow}`);
  }

  console.log("Done processing rows from Google Sheet.");
};

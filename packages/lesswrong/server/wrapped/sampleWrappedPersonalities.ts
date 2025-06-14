import { getWrappedUsers } from "./sendWrappedNotifications";
import { getWrappedDataByYear } from "./wrappedDataByYear";
import { getWrappedEngagement } from "./wrappedEngagment";
import { getAdminTeamAccount } from "../utils/adminTeamAccount";
import { getAllRepos } from "../repos";
import type { WrappedYear } from "@/components/ea-forum/wrapped/constants";
import sampleSize from "lodash/fp/sampleSize";
import chunk from "lodash/chunk";
import { createAnonymousContext } from "../vulcan-lib/createContexts";

const getRelevantUsers = async (year: WrappedYear, totalUsers?: number) => {
  const users = await getWrappedUsers(year);
  // eslint-disable-next-line no-console
  console.log(`Found ${users.length} relevant users`);
  return totalUsers ? sampleSize(totalUsers, users) : users;
}

// Exported to allow running from "yarn repl"
export const sampleWrappedPersonalities = async (
  year: WrappedYear,
  totalUsers?: number,
) => {
  const context = createAnonymousContext();
  const repos = getAllRepos();
  const currentUser = await getAdminTeamAccount(context);
  const users = await getRelevantUsers(year, totalUsers);
  const chunks = chunk(users, 10);

  const results: {
    _id: string,
    adjective1: string,
    adjective2: string,
    noun: string,
  }[] = [];
  for (const users of chunks) {
    const data = await Promise.all(users.map(
      (user) => getWrappedDataByYear(currentUser, user._id, year, repos),
    ));
    for (let i = 0; i < data.length; i++) {
      const user = users[i];
      const personality = data[i].personality;
      const [adjective1, adjective2, ...rest] = personality.split(" ");
      const noun = rest.join(" ");
      results.push({
        _id: user._id,
        adjective1,
        adjective2,
        noun,
      });
    }
  }

  const csv = results
    .map(({_id, adjective1, adjective2, noun}) =>
      `${_id},${adjective1},${adjective2},${noun}`,
    )
    .join("\n");
  // eslint-disable-next-line no-console
  console.log(csv);
}

// Exported to allow running from "yarn repl"
export const sampleWrappedEngagement = async (
  year: WrappedYear,
  totalUsers?: number,
) => {
  const users = await getRelevantUsers(year, totalUsers);
  for (const user of users) {
    const engagement = await getWrappedEngagement(user._id, year);
    // eslint-disable-next-line no-console
    console.log("Percentile", user._id, engagement.engagementPercentile);
  }
}

import { Globals } from "@/lib/vulcan-lib";
import { getWrappedUsers } from "./sendWrappedNotifications";
import { getWrappedDataByYear } from "./wrappedDataByYear";
import { getAdminTeamAccount } from "../callbacks/commentCallbacks";
import { getAllRepos } from "../repos";
import type { WrappedYear } from "@/components/ea-forum/wrapped/hooks";
import chunk from "lodash/chunk";

const getRelevantUsers = async (year: WrappedYear, totalUsers?: number) => {
  const users = await getWrappedUsers(year);
  // eslint-disable-next-line no-console
  console.log(`Found ${users.length} relevant users`);
  return totalUsers ? users.slice(0, totalUsers) : users;
}

const sampleWrappedPersonalities = async (
  year: WrappedYear,
  totalUsers?: number,
) => {
  const repos = getAllRepos();
  const currentUser = await getAdminTeamAccount();
  const users = await getRelevantUsers(year, totalUsers);
  const chunks = chunk(users, 10);

  const results: {_id: string, personality: string}[] = [];
  for (const users of chunks) {
    const data = await Promise.all(users.map(
      (user) => getWrappedDataByYear(currentUser, user._id, year, repos),
    ));
    for (let i = 0; i < data.length; i++) {
      results.push({_id: users[i]._id, personality: data[i].personality});
    }
  }

  const csv = results
    .map(({_id, personality}) => `${_id},${personality}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.log(csv);
}

Globals.sampleWrappedPersonalities = sampleWrappedPersonalities;

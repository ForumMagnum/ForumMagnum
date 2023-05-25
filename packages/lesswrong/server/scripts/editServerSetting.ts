import { Globals } from "../../lib/vulcan-lib/config";
import { DatabaseMetadata } from "../../lib/collections/databaseMetadata/collection";

async function editServerSetting(mutation: (oldSettings: any) => any) {
  const serverSettings = (await DatabaseMetadata.findOne({name: "serverSettings"}))!.value;
  console.log("serverSettings before: ", JSON.stringify(serverSettings));
  const newServerSettings = mutation(serverSettings);
  //DatabaseMetadata.rawUpdateOne({name: "serverSettings"}, {$set: {[name]: value}});
  console.log("serverSettings after: ", JSON.stringify(newServerSettings));
  await DatabaseMetadata.rawUpdateOne({name: "serverSettings"}, {$set: {value: newServerSettings}});
}

Globals.editServerSetting = editServerSetting;
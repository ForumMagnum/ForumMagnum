import { addGraphQLMutation, addGraphQLSchema, addGraphQLResolvers, } from "../lib/vulcan-lib";
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import fetch from "node-fetch";

export const connectCrossposterApiRoute = "/api/connectCrossposter";

type ConnectCrossposterArgs = {
  userId: string,
}

const crosspostResolvers = {
  Mutation: {
    connectCrossposter: async (
      root: void,
      {userId}: ConnectCrossposterArgs,
      {req, res}: ResolverContext,
    ) => {
      const apiUrl = fmCrosspostBaseUrlSetting.get() + connectCrossposterApiRoute.slice(1);
      const result = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({userId}),
      });
      const json = await result.json();
      console.log("JSON RESULT", json);
      return "Successfully connected crosspost account";
    },
  },
};

addGraphQLResolvers(crosspostResolvers);
addGraphQLMutation("connectCrossposter(userId: String): String");

export const onConnectCrossposterRequest = async (req, res) => {
  console.log("Connecting crossposter");
  res.send({ status: "connected" });
}

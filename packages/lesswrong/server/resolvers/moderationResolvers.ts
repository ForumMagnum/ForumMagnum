import { defineQuery } from '../utils/serverGraphqlUtil';
import { LWEvents } from '../../lib/collections/lwevents/collection';
import uniq from 'lodash/uniq';

defineQuery({
  name: "moderatorViewIPAddress",
  argTypes: "(ipAddress: String!)",
  resultType: "ModeratorIPAddressInfo",
  schema: `
    type ModeratorIPAddressInfo {
      ip: String!
      userIds: [String!]!
    }
  `,
  fn: async (_root: void, args: {ipAddress: string}, context: ResolverContext) => {
    const { currentUser } = context;
    const { ipAddress } = args;
    if (!currentUser || !currentUser.isAdmin)
      throw new Error("Only admins can see IP address information");
    
    const loginEvents = await LWEvents.find({
      name: "login",
      "properties.ip": ipAddress,
    }, {limit: 20}).fetch();
    
    const userIds = uniq(loginEvents.map(loginEvent => loginEvent.userId));
    return {
      ip: ipAddress,
      userIds,
    };
  }
});

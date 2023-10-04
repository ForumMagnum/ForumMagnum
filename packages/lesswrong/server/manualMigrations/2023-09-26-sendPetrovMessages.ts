import chunk from "lodash/chunk";
import Conversations from "../../lib/collections/conversations/collection";
import Messages from "../../lib/collections/messages/collection";
import Users from "../../lib/collections/users/collection";
import { getAdminTeamAccount } from "../callbacks/commentCallbacks";
import { forumTeamUserId } from "../callbacks/userCallbacks";
import { createMutator } from "../vulcan-lib/mutators";
import { registerMigration } from "./migrationUtils";
import { sleep } from "../../lib/helpers";

async function sendMessageTo(userId: string, welcomeMessageBody: string) {  
  const user = await Users.findOne(userId);
  if (!user) throw new Error(`Could not find ${userId}`);
  
  // try to use forumTeamUserId as the sender,
  // and default to the admin account if not found
  const adminUserId = forumTeamUserId.get()
  let adminsAccount = adminUserId ? await Users.findOne({_id: adminUserId}) : null
  if (!adminsAccount) {
    adminsAccount = await getAdminTeamAccount()
  }
  
  const subjectLine = 'Follow Up Question on Petrov Day Poll';
  
  // console.log({userId, subjectLine, welcomeMessageBody})
  
  const conversationData = {
    participantIds: [user._id, adminsAccount._id],
    title: subjectLine,
  }
  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: adminsAccount,
    validate: false
  });

  const messageDocument = {
    userId: adminsAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: welcomeMessageBody,
      }
    },
    conversationId: conversation.data._id,
    noEmail: true,
  }
  await createMutator({
    collection: Messages,
    document: messageDocument,
    currentUser: adminsAccount,
    validate: false
  })
}

registerMigration({
  name: "sendPetrovMessages",
  dateWritten: "2023-09-26",
  idempotent: true,
  action: async () => {
    
    // const userIds: string[] = require('./petrovUserIdsFollowUpD.json');
    
    const groups = {
      A: ["MDDhxT3EekBMYfQ8D", "vvqpGvkYqLcerYph6", "WwEGT9EW5osbKdSX9", "d7EFB6KTgWwqCAyEg", "LWLwwzzbBF2GZQhJo", "rvFfHekpGpf72fd5Z", "JnNixf4smAHwLeqE3", "qADnMcKZRS7J4MAjp", "hyFjMuJjq7Wo2BdwA", "QBvPFLFyZyuHcBwFm", "Lb86LF6K6JQsd4BEh", "CpPz4596hmk9Pk8Jh", "eZPpawznf2EtamXhx", "wsj8x8gAuX4mqmCBf", "RS8wZkL4ozjeYuLY8", "BpA9Ghs5zdnno99mq", "63CvXxSWvMAxrKQYz", "gmaLbrH3L9SivGvkF", "2PBxQqSCntaiC2FFa", "DgtwuwsTGQo4MQfJa", "66bGJdyZtpcE6282w", "RfBhNCutwqp5poT5N", "jWduMJMW3s3YwqJQH", "YR2unDnhbTXHfELgy", "e6zeCvw52xfxT69jz", "iBcH2a3HdWGS2JEZA", "9NiqxxtkPkQzpzaDo", "K2hXupYxPyzSRN9Rn", "N2j9KPniFPbxuq6mF", "K7na7fxfuZwN3EkFA", "eXkuCJ8JpsSWb57up", "jvgM4etb4dnFNhD7n", "fFEJMtfYAF9MzXtAq", "75YZ666ipe3weoJaS", "jbcXtrj8EkkGT6Eys", "sxgviMkPJunvfSirS", "sKAL2jzfkYkDbQmx9"],
      B: ["KDrhvPrxWcMnhnLsM", "ryqkTyghKwG4j6Eeh", "C22LeoxkEsFq56foJ", "ibW3cznxxg96857o3", "aCM5aD8ZMbDaJ87hW", "bwqdSbojQByxrkkHb", "mfgrYb4LMk7NWXsSB", "9hHLLhkuQwtjjykdk", "dLWYtvxvBnw3NZH8t", "mZhdTPCES3YyQWYdR", "EhdMH8HFuBGC5viKJ"],
      C: ["Zv9Gy29xm85bsyZpv", "FMsXugZ8aB5d8nHsm", "biaFedMuXhbhkPNRZ", "YBHSPmZEfyyY2E2au", "PB9KRAf35Zwkdos5N", "n3H94S5EMDa87qyeJ", "5snwaf7CSi8LSs9Wp", "jGDRmPtXmi2ZPdxGz", "gjoi5eBQob27Lww62"],
      D: ["iNhn5zeZ95uvs2xqH", "Gnn2d4zxnJfQfXa84", "Lm5gmNeDZugPCRWmC", "3tXYx3iwoHRsLoHAg", "vWDoKwGJ6dchrsnWp", "znqXX8kdMBTq77Nip", "qxJ28GN72aiJu96iF", "7RFsGHYEynK4LDgGb", "ohjkgvinzZ7vezGPH", "y7M83qgt5rWZiiozS", "qkpmGJD64vaTvzvcn", "Ei73H4RbCT5TTaXNa", "qcqCviPFJArTBZf86", "Y39eAp3oQj5PnmKPY"]
    }
    
    const virtueNames = {
      'A': 'Avoiding actions that noticeably increase the chance that civilization is destroyed',
      'B': 'Accurately reporting your epistemic state',
      'C': 'Quickly orienting to novel situations',
      'D': 'Resisting social pressure'
    }
    
    for (const [choice, userIds] of Object.entries(groups)) {
      
      // TODO - decide batch size
      const userIdBatches = chunk(userIds, 5);
      
      const message = `<p>Thank you for the response!<br><br>After some discussion, the LessWrong team has decided to make the focus of next year's Petrov Day be the virtue that is selected as most important by the most people. This seems like a great way to not just go off our own sense of Petrov Day each year.<br><br>Unfortunately, our poll doesn't register the intensity of belief/value/preference, so we're providing an escape valve to ensure the right virtue is next year's focus.<br><br>Your selected response <i>(${virtueNames[choice]})</i> is currently in the minority.<br><br>If you click the below link and are the first to do so of any minority group, we will make your selected virtue be the focus of next year's commemoration.</p><div class="spoilers"><p><a href="https://lesswrong.com/petroyDayPoll?unilateralism=true">${virtueNames[choice]} is the most important virtue.</a></p></div><p>Thanks again and happy Petrov Day,<br>LessWrong team&nbsp;</p>`
      
      const sendMessageCurried = (userId: string) => sendMessageTo(userId, message)
      
      for (const batch of userIdBatches) {
        await Promise.all(batch.map(sendMessageCurried));
        
        // Give the db some time to handle everything, if needed
        await sleep(300);
      }
    }
  }
})

import { getCKEditorDocumentId } from "../../lib/ckEditorUtils";
import CkEditorUserSessions from "../../lib/collections/ckEditorUserSessions/collection";
import {ckEditorApi, documentHelpers} from "../ckEditor/ckEditorApi";
import { addCronJob } from "../cronUtil";
import { createNotification } from "../notificationCallbacksHelpers";
import {DialogueChecksRepo} from "../repos";
import { createAdminContext } from "../vulcan-lib";
import groupBy from 'lodash/groupBy';

addCronJob({
  name: 'notifyUsersOfNewDialogueChecks',
  interval: 'every 1 hour',
  async job() {
    const context = createAdminContext();
    const usersWithNewChecks = await context.repos.users.getUsersWithNewDialogueChecks()
    usersWithNewChecks.forEach(user => {
      void createNotification({
        userId: user._id,
        notificationType: "newDialogueChecks",
        documentType: null,
        documentId: null,
        extraData: {userId: user._id}, // passed for the AB test
        context,
      })
    })
  }
});


addCronJob({
  name: 'notifyUsersOfTheirTurnInMatchForm',
  interval: 'every 5 seconds',
  async job() {
    const context = createAdminContext();
    const checksYourTurn = await new DialogueChecksRepo().getMatchFormYourTurn()
    checksYourTurn.forEach(check => {
      void createNotification({
        userId: check.userId,
        notificationType: "yourTurnMatchForm",
        documentType: null,
        documentId: null,
        extraData: {
          targetUserId: check.targetUserId, 
          checkId: check._id, 
          targetUserMatchPreferenceId: check.targetUserMatchPreferenceId
        }, 
        context,
      })
    })
  }
});

async function checkActiveUserSession(userId:string, documentId:string) {
  const ckEditorDocumentId = getCKEditorDocumentId(documentId, userId, "edit");

  const response = await ckEditorApi.getAllConnectedUserIds(ckEditorDocumentId)
  const connectedUsers = JSON.parse(response);
  return connectedUsers.includes(userId)
}

addCronJob({
  name: 'cleanupStaleCkEditoreUserSessions',
  interval: 'every 2 hours',
  async job() {
    const activeUserSessions = await CkEditorUserSessions.find({endedAt: {$exists: false}}, {sort:{createdAt: -1}}).fetch();
    const groupedSessions = groupBy(activeUserSessions, session => `${session.userId}-${session.documentId}`);

    const superfluousSessionPromises = [];
    const latestSessions = []

    for (const sessions of Object.values(groupedSessions)) {

      latestSessions.push(sessions[0])
      // End all sessions except the most recent one
      for (let i = 1; i < sessions.length; i++) {
        superfluousSessionPromises.push(
          documentHelpers.endCkEditorUserSession(sessions[i]._id, "cron")
        );
      }
    }

    void Promise.all(superfluousSessionPromises);

    for (const session of latestSessions) {
      const isActive = await checkActiveUserSession(session.userId, session.documentId);
      if (!isActive) {
        void documentHelpers.endCkEditorUserSession(session._id, "cron")
      }
    }
  }
})

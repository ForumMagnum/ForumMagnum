import { getCollectionHooks } from '../mutationCallbacks';
import * as _ from 'underscore';
import { wrapAndSendEmail } from '../emails/renderEmail';
import '../emailComponents/EmailJobInterestConfirmation';
import React from 'react';
import { Components } from '../../lib/vulcan-lib';
import { JOB_AD_DATA } from '../../components/ea-forum/TargetedJobAd';

getCollectionHooks("AdvisorRequests").updateAsync.add(async function AdvisorRequestsNewAsync ({document, oldDocument, currentUser}: {document: DbAdvisorRequest, oldDocument: DbAdvisorRequest, currentUser: DbUser|null}) {
  const newInterestedJobs = Object.keys(document.jobAds).filter(jobId => document.jobAds[jobId].state === 'interested' && oldDocument?.jobAds[jobId]?.state !== 'interested')

  if (!newInterestedJobs.length) return;
  const newInterestedJob = newInterestedJobs[0]

  const jobAdData = JOB_AD_DATA[newInterestedJob]
  await wrapAndSendEmail({
    user: currentUser,
    subject: `Confirmation: You have registered interest in the ${jobAdData.role} role at ${jobAdData.org}`,
    body: <Components.EmailJobInterestConfirmation user={currentUser} newInterestedJob={newInterestedJob}/>
  });
})

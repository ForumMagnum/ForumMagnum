import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { useIsInView, useTracking } from '../../lib/analyticsEvents';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useCreate } from '../../lib/crud/withCreate';
import { useMulti } from '../../lib/crud/withMulti';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_JOB_AD_COOKIE } from '../../lib/cookies/cookies';

const TargetedJobAdSection = () => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking()
  // we track when the user has seen the ad
  const { setNode, entry } = useIsInView()
  const { flash } = useMessages()
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_JOB_AD_COOKIE])
  
  // the AdvisorRequests collection is set to be deleted anyway, so reuse it for this job ad test,
  // as a way to track which users have seen and/or registered interest in the job ads
  const { create: createJobAdView } = useCreate({
    collectionName: 'AdvisorRequests',
    fragmentName: 'AdvisorRequestsMinimumInfo',
  })
  const { mutate: updateJobAds } = useUpdate({
    collectionName: 'AdvisorRequests',
    fragmentName: 'AdvisorRequestsMinimumInfo',
  })
  const { results } = useMulti({
    terms: {view: 'requestsByUser', userId: currentUser?._id, limit: 1},
    collectionName: 'AdvisorRequests',
    fragmentName: 'AdvisorRequestsMinimumInfo',
    skip: !currentUser
  })
  
  // we only advertise one job per page view
  const [activeJob, setActiveJob] = useState<string>('malaria-researcher-givewell')
  
  // select a job ad to show to the current user
  // useEffect(() => {
  //   if (!currentUser || !results || activeJob) return
    
  //   // user's relevant interests from EAG, such as "software engineering"
  //   const userEAGInterests = union(currentUser.experiencedIn, currentUser.interestedIn)
  //   // the topics that the user has displayed on their profile
  //   const userTags = currentUser.profileTagIds ?? []
  //   const userJobAds = results[0]?.jobAds ?? {}
    
  //   for (let jobName in JOB_AD_DATA) {
  //     // skip any jobs where the deadline to apply has passed
  //     const deadline = JOB_AD_DATA[jobName].deadline
  //     if (deadline && moment().isAfter(deadline, 'day')) {
  //       continue
  //     }
      
  //     const eagOccupations = JOB_AD_DATA[jobName].eagOccupations
  //     const interestedIn = JOB_AD_DATA[jobName].interestedIn
  //     const occupationTag = JOB_AD_DATA[jobName].tagId
  //     const jobAdState = userJobAds[jobName]?.state
  //     // check if the ad fits the user's interests
  //     const userIsMatch = intersection(userEAGInterests, eagOccupations).length ||
  //       intersection(currentUser.interestedIn, interestedIn).length ||
  //       (occupationTag && userTags.includes(occupationTag))
  //     // make sure the user hasn't already clicked "interested" or "uninterested" for this ad
  //     const shouldShowAd = !jobAdState || ['seen', 'expanded'].includes(jobAdState)

  //     if (userIsMatch && shouldShowAd) {
  //       setActiveJob(jobName)
  //       return
  //     }
  //   }
    
  // }, [currentUser, results, activeJob])

  // record when this user has seen the selected ad
  useEffect(() => {
    if (!currentUser || !results || !activeJob || !entry?.isIntersecting) return
    // if we're not tracking this user at all, start tracking them
    if (!results.length) {
      void createJobAdView({
        data: {
          userId: currentUser._id,
          jobAds: {[activeJob]: {state: 'seen', lastUpdated: new Date()}}
        }
      })
      return
    }
    // if this user hadn't seen this job ad before, mark them as having seen it
    const jobAdState = results[0]?.jobAds?.[activeJob]?.state
    if (!jobAdState) {
      void updateJobAds({
        selector: {_id: results[0]._id},
        data: {jobAds: {
          ...results[0].jobAds,
          [activeJob]: {state: 'seen', lastUpdated: new Date()}
        }}
      })
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, results, activeJob, entry])
  
  const dismissJobAd = () => {
    captureEvent('hideJobAd')
    setCookie(
      HIDE_JOB_AD_COOKIE,
      "true", {
      expires: moment().add(30, 'days').toDate(),
    })
  }
  
  const handleExpand = () => {
    if (!currentUser || !results?.length || !activeJob) return
    // track which users have expanded the ad
    void updateJobAds({
      selector: {_id: results[0]._id},
      data: {jobAds: {
        ...results[0].jobAds,
        [activeJob]: {state: 'expanded', lastUpdated: new Date()}
      }}
    })
  }
  
  const handleInterested = async (showSuccessMsg=true) => {
    if (!currentUser || !results?.length || !activeJob) return
    // track which users have registered interest
    await updateJobAds({
      selector: {_id: results[0]._id},
      data: {jobAds: {
        ...results[0].jobAds,
        [activeJob]: {state: 'interested', lastUpdated: new Date()}
      }}
    })
    showSuccessMsg && flash({messageString: "Thanks for registering interest!", type: "success"})
  }
  
  const handleUninterested = (uninterestedReason?: string) => {
    if (!currentUser || !results?.length || !activeJob) return
    // track which users have said they are uninterested
    void updateJobAds({
      selector: {_id: results[0]._id},
      data: {jobAds: {
        ...results[0].jobAds,
        [activeJob]: {state: 'uninterested', uninterestedReason, lastUpdated: new Date()}
      }}
    })
  }
  
  const { TargetedJobAd } = Components
  
  if (cookies[HIDE_JOB_AD_COOKIE] || !activeJob) {
    return null
  }
  
  return <div ref={setNode}>
    <TargetedJobAd
      ad={activeJob}
      onDismiss={dismissJobAd}
      onExpand={handleExpand}
      onInterested={handleInterested}
      onUninterested={handleUninterested}
    />
  </div>
}

const TargetedJobAdSectionComponent = registerComponent("TargetedJobAdSection", TargetedJobAdSection);

declare global {
  interface ComponentTypes {
    TargetedJobAdSection: typeof TargetedJobAdSectionComponent
  }
}

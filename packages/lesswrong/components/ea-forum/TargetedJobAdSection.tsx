import React, { useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { useTracking } from '../../lib/analyticsEvents';
import { useCookies } from 'react-cookie';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useCreate } from '../../lib/crud/withCreate';
import { useMulti } from '../../lib/crud/withMulti';
import { useUpdate } from '../../lib/crud/withUpdate';

const HIDE_JOB_AD_COOKIE = 'hide_job_ad'
// const RESEARCH_TAG_ID = 'hxRMaKvwGqPb43TWB'

// for testing purposes, this points to the "Forecasting" topic on the dev db
const RESEARCH_TAG_ID = 'CGameg7coDgLbtgdH'

const TargetedJobAdSection = () => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking()
  const { flash } = useMessages()
  const [cookies, setCookie] = useCookies([HIDE_JOB_AD_COOKIE])
  
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
  const { results, loading } = useMulti({
    terms: {view: 'requestsByUser', userId: currentUser?._id, limit: 1},
    collectionName: 'AdvisorRequests',
    fragmentName: 'AdvisorRequestsMinimumInfo',
    skip: !currentUser
  })
  
  // show the ad to any users interested in research
  const showJobAd = currentUser?.profileTagIds?.includes(RESEARCH_TAG_ID) ||
    (results && ['queued', 'seen', 'expanded'].includes(results[0].jobAds['research-givewell']?.state))

  // track which users have seen the ad
  useEffect(() => {
    if (!currentUser || loading || !results || !showJobAd) return

    // if we're not tracking this user at all, start tracking them
    if (!results.length && showJobAd) {
      void createJobAdView({
        data: {
          userId: currentUser._id,
          jobAds: {'research-givewell': {state: 'seen', lastUpdated: new Date()}}
        }
      })
      return
    }
    // if this user hadn't seen this job ad before, mark them as having seen it
    const jobAdState = results[0].jobAds['research-givewell']?.state
    if (!jobAdState || jobAdState === 'queued') {
      void updateJobAds({
        selector: {_id: results[0]._id},
        data: {jobAds: {'research-givewell': {state: 'seen', lastUpdated: new Date()}}}
      })
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, currentUser, showJobAd])
  
  const dismissJobAd = () => {
    captureEvent('hideJobAd')
    setCookie(
      HIDE_JOB_AD_COOKIE,
      "true", {
      expires: moment().add(30, 'days').toDate(),
    })
  }
  
  const handleExpand = () => {
    if (!currentUser || !results?.length) return
    // track which users have expanded the ad
    void updateJobAds({
      selector: {_id: results[0]._id},
      data: {jobAds: {'research-givewell': {state: 'expanded', lastUpdated: new Date()}}}
    })
  }
  
  const handleRegisterInterest = async () => {
    if (!currentUser || !results?.length) return
    // track which users have registered interest
    await updateJobAds({
      selector: {_id: results[0]._id},
      data: {jobAds: {'research-givewell': {state: 'interested', lastUpdated: new Date()}}}
    })
    flash({messageString: "Thanks for registering interest!", type: "success"})
  }
  
  const { TargetedJobAd } = Components
  
  if (loading || (results?.length && results[0].interestedInMetaculus) || cookies[HIDE_JOB_AD_COOKIE] || !showJobAd) {
    return null
  }
  
  return <TargetedJobAd
    ad="research-givewell"
    handleDismiss={dismissJobAd}
    onExpand={handleExpand}
    handleRegisterInterest={handleRegisterInterest}
  />
}

const TargetedJobAdSectionComponent = registerComponent("TargetedJobAdSection", TargetedJobAdSection);

declare global {
  interface ComponentTypes {
    TargetedJobAdSection: typeof TargetedJobAdSectionComponent
  }
}

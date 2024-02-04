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
import { JOB_AD_DATA } from './TargetedJobAd';
import union from 'lodash/union';
import intersection from 'lodash/intersection';
import { filterModeIsSubscribed } from '../../lib/filterSettings';
import difference from 'lodash/difference';


const TargetedJobAdSection = () => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking()
  // we track when the user has seen the ad
  const { setNode, entry } = useIsInView()
  const { flash } = useMessages()
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_JOB_AD_COOKIE]) // TODO: use a db field instead

  const { create: createUserJobAd } = useCreate({
    collectionName: 'UserJobAds',
    fragmentName: 'UserJobAdsMinimumInfo',
  })
  const { mutate: updateUserJobAd } = useUpdate({
    collectionName: 'UserJobAds',
    fragmentName: 'UserJobAdsMinimumInfo',
  })
  const { results: userJobAds } = useMulti({
    terms: {view: 'adsByUser', userId: currentUser?._id},
    collectionName: 'UserJobAds',
    fragmentName: 'UserJobAdsMinimumInfo',
    skip: !currentUser
  })
  
  // we only advertise one job per page view
  const [activeJob, setActiveJob] = useState<string>()
  
  // select a job ad to show to the current user
  useEffect(() => {
    if (!currentUser || activeJob) return
    
    // user's relevant interests from EAG, such as "software engineering"
    // const userEAGInterests = union(currentUser.experiencedIn, currentUser.interestedIn)
    // the topics that the user has displayed on their profile
    // const userTags = currentUser.profileTagIds ?? []
    const ads = userJobAds ?? []
    
    for (let jobName in JOB_AD_DATA) {
      // skip any jobs where the deadline to apply has passed
      const deadline = JOB_AD_DATA[jobName].deadline
      if (deadline && moment().isAfter(deadline, 'day')) {
        continue
      }
      
      // const eagOccupations = JOB_AD_DATA[jobName].eagOccupations
      // const interestedIn = JOB_AD_DATA[jobName].interestedIn
      // const occupationTag = JOB_AD_DATA[jobName].tagId
      const tagsReadIds = JOB_AD_DATA[jobName].tagsReadIds
      const jobAdState = ads.find(ad => ad.jobName === jobName)?.adState
      // check if the ad fits the user's interests -
      // currently based on whether they have subscribed to all the topics relevant to the job ad
      const userTagSubs = currentUser.frontpageFilterSettings?.tags?.filter(
        setting => filterModeIsSubscribed(setting.filterMode)
      )?.map(setting => setting.tagId)
      const userIsMatch = tagsReadIds && !difference(tagsReadIds, userTagSubs).length
      // TODO: We probably want to enable this, but not in the initial release, so commenting out for now.
      // const userIsMatch = coreTagReads &&
      //   tagsReadIds?.every(
      //     tagId => coreTagReads.some(tag => tag.tagId === tagId && tag.userReadCount >= 12)
      //   )

      // make sure the user hasn't already clicked "apply" or "remind me" for this ad
      const shouldShowAd = !jobAdState || ['seen', 'expanded'].includes(jobAdState)

      if (userIsMatch && shouldShowAd) {
        setActiveJob(jobName)
        return
      }
    }
    
  }, [currentUser, userJobAds, activeJob])

  // record when this user has seen the selected ad
  useEffect(() => {
    if (!currentUser || !userJobAds || !activeJob || !entry?.isIntersecting) return
    void createUserJobAd({
      data: {
        userId: currentUser._id,
        jobName: activeJob,
        adState: 'seen'
      }
    })
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userJobAds, activeJob, entry])
  
  const dismissJobAd = () => {
    captureEvent('hideJobAd')
    setCookie(
      HIDE_JOB_AD_COOKIE,
      "true",
      { expires: moment().add(30, 'days').toDate() }
    )
  }
  
  const handleExpand = () => {
    if (!currentUser || !userJobAds?.length || !activeJob) return
    // record when a user has expanded the selected ad
    const ad = userJobAds.find(ad => ad.jobName === activeJob)
    if (ad) {
      void updateUserJobAd({
        selector: {_id: ad._id},
        data: {
          adState: 'expanded'
        }
      })
    }
  }
  
  const handleApply = async () => {
    if (!currentUser || !userJobAds?.length || !activeJob) return
    // record when a user has clicked the "Apply" button
    const ad = userJobAds.find(ad => ad.jobName === activeJob)
    if (ad) {
      void updateUserJobAd({
        selector: {_id: ad._id},
        data: {
          adState: 'applied'
        }
      })
    }
    // showSuccessMsg && flash({messageString: "Thanks for registering interest!", type: "success"})
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
      onApply={handleApply}
    />
  </div>
}

const TargetedJobAdSectionComponent = registerComponent("TargetedJobAdSection", TargetedJobAdSection);

declare global {
  interface ComponentTypes {
    TargetedJobAdSection: typeof TargetedJobAdSectionComponent
  }
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import moment from 'moment';
import { useIsInView, useTracking } from '../../lib/analyticsEvents';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useCreate } from '../../lib/crud/withCreate';
import { useMulti } from '../../lib/crud/withMulti';
import { useUpdate } from '../../lib/crud/withUpdate';
import { EAGWillingToRelocateOption, JOB_AD_DATA } from './TargetedJobAd';
import { gql, useQuery } from '@apollo/client';
import { FilterTag, filterModeIsSubscribed } from '../../lib/filterSettings';
import difference from 'lodash/difference';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { getCountryCode, isInPoliticalEntity } from '../../lib/geocoding';
import intersection from 'lodash/intersection';
import union from 'lodash/fp/union';
import { CAREER_STAGES } from '../../lib/collections/users/newSchema';

type UserCoreTagReads = {
  tagId: string,
  userReadCount: number,
}

/**
 * Section of a page that might display a job ad to the current user.
 */
const TargetedJobAdSection = () => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const { captureEvent } = useTracking()
  // we track when the user has seen the ad
  const { setNode, entry } = useIsInView()
  const { flash } = useMessages()
  const recordCreated = useRef<boolean>(false)

  const { create: createUserJobAd } = useCreate({
    collectionName: 'UserJobAds',
    fragmentName: 'UserJobAdsMinimumInfo',
  })
  const { mutate: updateUserJobAd } = useUpdate({
    collectionName: 'UserJobAds',
    fragmentName: 'UserJobAdsMinimumInfo',
  })
  const { results: userJobAds, loading: userJobAdsLoading, refetch: refetchUserJobAds } = useMulti({
    terms: {view: 'adsByUser', userId: currentUser?._id},
    collectionName: 'UserJobAds',
    fragmentName: 'UserJobAdsMinimumInfo',
    skip: !currentUser
  })
  
  const { results: userEAGDetails, loading: userEAGDetailsLoading } = useMulti({
    terms: {view: 'dataByUser', userId: currentUser?._id},
    collectionName: 'UserEAGDetails',
    fragmentName: 'UserEAGDetailsMinimumInfo',
    skip: !currentUser
  })
  
  // check the amount that the user has read core tags to help target ads
  const { data: coreTagReadsData, loading: coreTagReadsLoading } = useQuery(
    gql`
      query getUserReadsPerCoreTag($userId: String!) {
        UserReadsPerCoreTag(userId: $userId) {
          tagId
          userReadCount
        }
      }
    `,
    {
      variables: {
        userId: currentUser?._id,
      },
      ssr: true,
      skip: !currentUser,
    }
  )
  const coreTagReads: UserCoreTagReads[]|undefined = coreTagReadsData?.UserReadsPerCoreTag
  
  // we only advertise up to one job per page view
  const [activeJob, setActiveJob] = useState<string>()
  
  // select a job ad to show to the current user
  useMemo(() => {
    if (!currentUser || userJobAdsLoading || userEAGDetailsLoading || coreTagReadsLoading || activeJob) return
  
    const ads = userJobAds ?? []
    
    for (let jobName in JOB_AD_DATA) {
      const jobAd = JOB_AD_DATA[jobName]
      // skip any jobs where the deadline to apply has passed
      const deadline = jobAd.deadline
      if (deadline && moment().isAfter(deadline, 'day')) {
        continue
      }

      const userJobAdState = ads.find(ad => ad.jobName === jobName)?.adState
      const userEAGData = userEAGDetails?.[0]
      
      /** Check if the job fits the user's interests */

      // Are they subscribed to all the topics relevant to the job ad?
      const subscribedTagIds = jobAd.subscribedTagIds
      const userTagSubs = currentUser.frontpageFilterSettings?.tags?.filter(
        (setting: FilterTag) => filterModeIsSubscribed(setting.filterMode)
      )?.map((setting: FilterTag) => setting.tagId)
      let userIsMatch = subscribedTagIds && !difference(subscribedTagIds, userTagSubs).length
      // Or have they have read at least 30 posts in all the relevant topics in the past 6 months?
      const readCoreTagIds = jobAd.readCoreTagIds
      const readsThreshold = jobAd.coreTagReadsThreshold ?? 30
      userIsMatch = userIsMatch || (
        readCoreTagIds &&
        !!coreTagReads?.length &&
        readCoreTagIds.every(
          tagId => coreTagReads.some(tag => tag.tagId === tagId && tag.userReadCount >= readsThreshold)
        )
      )
      // Or do they have the relevant EAG interests?
      const interestedIn = jobAd.interestedIn
      const userEAGInterests = union(userEAGData?.interestedIn, userEAGData?.experiencedIn)
      userIsMatch = userIsMatch || (
        !!interestedIn &&
        !!userEAGInterests &&
        !difference(interestedIn, userEAGInterests).length
      )
      // In the rare case when we don't want to filter by interests, start by matching on all users
      if (!subscribedTagIds && !readCoreTagIds && !interestedIn) {
        userIsMatch = true
      }
      
      /** Check if the user should be excluded from the job ad audience */

      // Are they in the right country?
      const countryCode = jobAd.countryCode
      const countryName = jobAd.countryName
      if (userIsMatch && (countryCode || countryName)) {
        userIsMatch = getCountryCode(currentUser.googleLocation) === countryCode ||
          userEAGData?.countryOrRegion === countryName
      }
      // Are they in the right city/area or willing to move there?
      const city = jobAd.city
      const willingToRelocateTo = jobAd.willingToRelocateTo
      const relevantWillingnessesToRelocate: EAGWillingToRelocateOption[] = [
        'I’d be excited to move here or already live here',
        'I’d be willing to move here for a good opportunity'
      ]
      if (userIsMatch && (city || willingToRelocateTo)) {
        userIsMatch = (city && isInPoliticalEntity(currentUser.googleLocation, city)) ||
          (city && userEAGData?.nearestCity?.toLowerCase().includes(city.toLowerCase())) ||
          (willingToRelocateTo && relevantWillingnessesToRelocate.includes(userEAGData?.willingnessToRelocate?.[willingToRelocateTo]))
      }
      // And are they in the right career stage?
      const careerStages = jobAd.careerStages
      if (userIsMatch && careerStages) {
        // Check their user profile and their EAG data
        const userProfileCareerStages = currentUser.careerStage ?? []
        const userEAGCareerStages = userEAGData?.careerStage?.map(cs => CAREER_STAGES.find(stage => stage.EAGLabel === cs)?.value ?? '') ?? []
        const userCareerStages = userProfileCareerStages.concat(userEAGCareerStages)
        userIsMatch = intersection(careerStages, userCareerStages).length > 0
      }
      // And do they have the right experience?
      const experiencedIn = jobAd.experiencedIn
      if (userIsMatch && experiencedIn) {
        // TODO: my guess is that we want the user to have *all* the listed skills,
        // rather than just one, but for the current test I want to cast a wider net.
        // userIsMatch = !!userEAGData?.experiencedIn && !difference(experiencedIn, userEAGData.experiencedIn).length
        userIsMatch = intersection(experiencedIn, userEAGData?.experiencedIn).length > 0
      }

      // Make sure the user hasn't already clicked "apply" or "remind me" for this ad
      const shouldShowAd = !userJobAdState || ['seen', 'expanded'].includes(userJobAdState)

      if (userIsMatch && shouldShowAd) {
        setActiveJob(jobName)
        return
      }
    }
    
  }, [
    currentUser,
    userJobAds,
    userJobAdsLoading,
    userEAGDetails,
    userEAGDetailsLoading,
    coreTagReads,
    coreTagReadsLoading,
    activeJob
  ])

  // record when this user has seen the selected ad
  useEffect(() => {
    // skip when no data to record
    if (!currentUser || userJobAdsLoading || !activeJob || !entry?.isIntersecting) return
    // skip if we have already recorded this data
    if (recordCreated.current || userJobAds?.some(ad => ad.jobName === activeJob)) return
    // make sure to only create up to one record per view
    recordCreated.current = true
    void createUserJobAd({
      data: {
        userId: currentUser._id,
        jobName: activeJob,
        adState: 'seen'
      }
    }).finally(refetchUserJobAds)
  }, [currentUser, userJobAds, userJobAdsLoading, refetchUserJobAds, activeJob, entry, createUserJobAd])
  
  const dismissJobAd = useCallback(() => {
    captureEvent('hideJobAd')
    void updateCurrentUser({hideJobAdUntil: moment().add(30, 'days').toDate()})
  }, [captureEvent, updateCurrentUser])
  
  const handleApply = useCallback(() => {
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
  }, [currentUser, userJobAds, activeJob, updateUserJobAd])
  
  const handleRemindMe = useCallback(() => {
    if (!currentUser || !userJobAds?.length || !activeJob) return
    // record when a user has clicked the "Remind me" button
    const ad = userJobAds.find(ad => ad.jobName === activeJob)
    if (ad) {
      // email is sent via cron
      void updateUserJobAd({
        selector: {_id: ad._id},
        data: {
          adState: 'reminderSet',
          reminderSetAt: new Date()
        }
      })
    }
    flash({messageString: "We'll email you about this job before the application deadline", type: "success"})
  }, [currentUser, userJobAds, activeJob, updateUserJobAd, flash])
  
  const { TargetedJobAd } = Components
  
  // Only show this section if we have a matching job for this user
  if (
    !currentUser ||
    (currentUser.hideJobAdUntil && moment(currentUser.hideJobAdUntil).isAfter(moment())) ||
    !activeJob
  ) {
    return null
  }
  
  return <div ref={setNode}>
    <TargetedJobAd
      jobName={activeJob}
      userJobAd={userJobAds?.find(ad => ad.jobName === activeJob)}
      onDismiss={dismissJobAd}
      onApply={handleApply}
      onRemindMe={handleRemindMe}
    />
  </div>
}

const TargetedJobAdSectionComponent = registerComponent("TargetedJobAdSection", TargetedJobAdSection);

declare global {
  interface ComponentTypes {
    TargetedJobAdSection: typeof TargetedJobAdSectionComponent
  }
}

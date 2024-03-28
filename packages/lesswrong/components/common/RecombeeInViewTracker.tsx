import { registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useCallback, useState } from 'react';
import { useIsInView } from "../../lib/analyticsEvents";
import { useCurrentUser } from './withUser';
import { RecombeeViewPortionProps, recombeeApi } from '../../lib/recombee/client';
import { recombeeEnabledSetting } from '../../lib/publicSettings';


const RecombeeInViewTracker = ({eventProps, observerProps, children}: {
  eventProps: Omit<RecombeeViewPortionProps, 'timestamp'|'userId'>,
  observerProps?: Record<string,any>,
  children?: React.ReactNode
}) => {
  const { setNode, entry } = useIsInView(observerProps)
  const [alreadySent, setAlreadySent] =  useState(false);
  const currentUser = useCurrentUser()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sendViewPortionEvent = useCallback(
    (eventProps: RecombeeViewPortionProps) => recombeeApi.createViewPortion(eventProps),
  [])

  useEffect(() => {
    if (recombeeEnabledSetting.get() && !!entry && !!currentUser) {
      const {isIntersecting, intersectionRatio} = entry

      if (!alreadySent && isIntersecting && intersectionRatio > 0) {
        void sendViewPortionEvent({...eventProps, timestamp: new Date(), userId: currentUser._id})
        setAlreadySent(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, sendViewPortionEvent, alreadySent])

  return (
    <span ref={setNode}>
      { children }
    </span>
  )
}

const RecombeeInViewTrackerComponent = registerComponent('RecombeeInViewTracker', RecombeeInViewTracker)

declare global {
  interface ComponentTypes {
    RecombeeInViewTracker: typeof RecombeeInViewTrackerComponent
  }
}

import { registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useCallback, useState } from 'react';
import { useIsInView } from "../../lib/analyticsEvents";
import { useCurrentUser } from './withUser';
import { RecombeeViewPortionProps, recombeeApi } from '../../lib/recombee/client';


const RecombeeInViewTracker = ({eventProps, observerProps, children}: {
  eventProps: Omit<RecombeeViewPortionProps, 'timestamp'|'userId'>,
  observerProps?: Record<string,any>,
  children?: React.ReactNode
}) => {
  const { setNode, entry } = useIsInView(observerProps)
  const [alreadySent, setAlreadySent] =  useState(false);
  const currentUser = useCurrentUser()

  console.log("inside RecombeeInViewTracker")

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sendViewPortionEvent = useCallback(
    (eventProps: RecombeeViewPortionProps) => recombeeApi.createViewPortion(eventProps),
  // absolutely no reason for eventProps to change for InView tracker once created, easiest way to prevent rerender because of object props
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [])

  console.log('location 2', {entry, eventProps, alreadySent})
  useEffect(() => {
    console.log({entry, eventProps, alreadySent})
    if (!!entry && !!currentUser) {
      const {time, isIntersecting, intersectionRatio} = entry

      if (!alreadySent && isIntersecting && intersectionRatio > 0.9) {
        void sendViewPortionEvent({...eventProps, timestamp: new Date(time), userId: currentUser._id})
        setAlreadySent(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]) //, sendViewPortionEvent, alreadySent])

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

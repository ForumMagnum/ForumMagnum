import { petrovBeforeTime } from './instanceSettings';
import moment from "moment";

export const getPetrovDayKarmaThreshold = (): number => {
  const petrovStartTime = petrovBeforeTime.get()
  const currentTime = (new Date()).valueOf()
  const karmaStartingThreshold = 2300
  return karmaStartingThreshold - (100*Math.floor((currentTime - petrovStartTime)/(3600*1000)))
}

export const userCanLaunchPetrovMissile = (user: UsersCurrent|DbUser|null): boolean  => {
  const currentKarmaThreshold = getPetrovDayKarmaThreshold()
  const manuallyExcludedUsers: string[] = ['KneTmopEjYGsaPYNi', 'DuGWafuKMcBx8uXWY']
  const userCreatedBeforeCutoff = moment('2022-09-21').isSameOrAfter(moment(user?.createdAt))
  
  return !!user && userCreatedBeforeCutoff && !(manuallyExcludedUsers.includes(user._id) 
    || !!user.banned 
    || user.deleted 
    || !user.karma
    || (user.karma && user.karma < currentKarmaThreshold) 
    || (user.karma && user.karma < 0) 
    || user.petrovOptOut)
}

export const usersAboveKarmaThresholdHardcoded20220922: Record<number, number> = {
    0: 98606,
    100: 2212,
    200: 1504,
    300: 1178,
    400: 984,
    500: 856,
    600: 756,
    700: 675,
    800: 612,
    900: 566,
    1000: 524,
    1100: 488,
    1200: 460,
    1300: 429,
    1400: 406,
    1500: 388,
    1600: 370,
    1700: 342,
    1800: 326,
    1900: 315,
    2000: 305,
    2100: 290,
    2200: 274,
    2300: 264
}

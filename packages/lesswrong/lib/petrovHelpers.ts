import { petrovBeforeTime } from "../components/Layout";
import moment from "moment";

export const getPetrovDayKarmaThreshold = (): number => {
  const petrovStartTime = petrovBeforeTime.get()
  const currentTime = (new Date()).valueOf()
  const karmaStartingThreshold = 2300
  return karmaStartingThreshold - (100*Math.floor((currentTime - petrovStartTime)/(3600*1000)))
}

export const userCanLaunchPetrovMissile = (user: UsersCurrent|DbUser|null): boolean  => {
  const currentKarmaThreshold = getPetrovDayKarmaThreshold()
  const manuallyExcludedUsers: String[] = ['KneTmopEjYGsaPYNi']
  const userCreatedBeforeCutoff = moment('2022-09-21').isSameOrAfter(moment(user?.createdAt))
  
  return !!user && userCreatedBeforeCutoff && !(manuallyExcludedUsers.includes(user._id) 
    || !!user.banned 
    || user.deleted 
    || (user.karma && user.karma < currentKarmaThreshold) 
    || (user.karma && user.karma < 0) 
    || user.petrovOptOut)
}

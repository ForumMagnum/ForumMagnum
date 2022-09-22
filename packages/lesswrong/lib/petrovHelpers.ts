import { petrovBeforeTime } from "../components/Layout";

export const getPetrovDayKarmaThreshold = (): number => {
  const petrovStartTime = petrovBeforeTime.get()
  const currentTime = (new Date()).valueOf()
  const karmaStartingThreshold = 2300
  return karmaStartingThreshold - (100*Math.floor((currentTime - petrovStartTime)/(3600*1000)))
}

export const userCanLaunchPetrovMissile = (user: UsersCurrent|DbUser|null): boolean  => {
  const currentKarmaThreshold = getPetrovDayKarmaThreshold()
  const manuallyExcludedUsers: String[] = ['aaaa']
  
  return !!user && !(manuallyExcludedUsers.includes(user._id) 
    || !!user.banned 
    || user.deleted 
    || (user.karma < currentKarmaThreshold) 
    || (user.karma < 0) 
    || user.petrovOptOut)
}

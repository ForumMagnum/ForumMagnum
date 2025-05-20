import { useState } from "react";
import { useCurrentUser } from "../common/withUser";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { userIsMemberOf } from "../../lib/vulcan-users/permissions";

/**
 * Functionality for the toggle that lets admins disable their admin + mod powers
 * and re-enable them. This is useful for admins to be able to see the site
 * as most users would see it.
 *
 * Note that we assign both the admin and sunshineRegiment roles when this is
 * toggled back on, even if the admin didn't have the sunshineRegiment role previously.
 * This is probably fine since admins can already do everything.
 */
export const useAdminToggle = (): {
  loading: boolean,
  toggleOn?: () => void,
  toggleOff?: () => void,
} => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const [loading, setLoading] = useState(false)
  
  if (!currentUser) {
    return {
      loading: false
    }
  }
  
  /**
   * If the current user has disabled their admin powers, then re-assign them
   * to the admin and sunshineRegiment groups.
   */
  const toggleOn = async () => {
    if (currentUser.isAdmin || !userIsMemberOf(currentUser, "realAdmins")) return
    
    setLoading(true)
    await updateCurrentUser({
      isAdmin: true,
      groups: [...(currentUser.groups ?? []), "sunshineRegiment"],
    })
    window.location.reload()
  }

  /**
   * If the current user is an admin, then disable their admin + mod powers,
   * and assign them to the realAdmins group so that they can re-enable them.
   */
  const toggleOff = async () => {
    if (!currentUser.isAdmin) return
    
    setLoading(true)
    // If not a member of the realAdmins group, add that group
    // before giving up admin powers so that we'll be able to take
    // the admin powers back
    let groups = currentUser.groups || []
    if (!groups.some(g => g === "realAdmins")) {
      groups = [...groups, "realAdmins"]
      await updateCurrentUser({ groups })
    }
    await updateCurrentUser({
      isAdmin: false,
      groups: groups.filter(g => g !== "sunshineRegiment"),
    })
    window.location.reload()
  }

  return {
    loading,
    toggleOn,
    toggleOff
  }
}

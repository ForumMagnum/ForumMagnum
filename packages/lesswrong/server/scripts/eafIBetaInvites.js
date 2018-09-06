/* global Vulcan */
import { Accounts } from 'meteor/accounts-base';

Vulcan.inviteNewUser = ({email, username, password}) => {
  // console.log('inviting user', email, username, password)
  Accounts.createUser({email, username, password})
  const newUser = Accounts.findUserByEmail(email)
  const result = Accounts.sendEnrollmentEmail(newUser._id)
  // console.log('result', result)
}

Vulcan.inviteIBetaUsers = () => {
  const newUsers = [
    {email: "jp+test5@centreforeffectivealtruism.org", username: "jptest5"},
    {email: "jp+test6@centreforeffectivealtruism.org", username: "jptest6"}
  ]
  const password = "nonuniqueAhgMz9Z*htyg"

  newUsers.forEach(newUser => {
    const newUserWPassword = Object.assign(newUser, {password})
    Vulcan.inviteNewUser(newUserWPassword)
  })
}


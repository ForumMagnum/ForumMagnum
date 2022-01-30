import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment PaymentMinimumInfo on Payment {
    _id
    userId
    recipientUserId
    createdAt
    amount
  }
`);

registerFragment(`
  fragment PaymentBase on Payment {
    _id
    userId
    user {
      ...UsersMinimumInfo
    }
    recipientUserId
    recipientUser {
      ...UsersMinimumInfo
      email
      paymentEmail
      paymentInfo
    }
    createdAt
    amount
  }
`);


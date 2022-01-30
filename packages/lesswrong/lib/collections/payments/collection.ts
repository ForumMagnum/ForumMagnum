import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbPayment> = {
  newCheck: (user: DbUser|null, document: DbPayment|null) => {
    if (!document) return false;
    return true
  },

  editCheck: (user: DbUser|null, document: DbPayment|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'payments.edit.own') : userCanDo(user, `payments.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbPayment|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'payments.remove.own') : userCanDo(user, `payments.remove.all`)
  }
}

export const Payments: PaymentsCollection = createCollection({
  collectionName: 'Payments',
  typeName: 'Payment',
  schema,
  resolvers: getDefaultResolvers('Payments'),
  mutations: getDefaultMutations('Payments', options),
  logChanges: false,
});

addUniversalFields({collection: Payments})

export default Payments;

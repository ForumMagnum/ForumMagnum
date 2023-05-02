import Users from "../lib/collections/users/collection";
import { UsersRepo } from "./repos";

/**Finds a user matching on email, searches case INsensitively.
 * Currently searches both email and emailS fields, though the later should ideally be full deprecated
 */
export const userFindOneByEmail = async function (email: string): Promise<DbUser | null> {
  return await new UsersRepo().getUserByEmail(email);
  // return await Users.findOne({$or: [{email}, {['emails.address']: email}]}, {collation: {locale: 'en', strength: 2}})
};

export const usersFindAllByEmail: (email: string) => Promise<Array<DbUser | null>> = async function (email: string) {
  return await new UsersRepo().getAllUsersByEmail(email);
  // return await Users.find({$or: [{email}, {['emails.address']: email}]}, { collation: { locale: 'en', strength: 2 } }).fetch()
};

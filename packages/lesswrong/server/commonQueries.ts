import UsersRepo from "./repos/UsersRepo";

/**Finds a user matching on email, searches case INsensitively.
 * Currently searches both email and emailS fields, though the later should ideally be full deprecated
 */
export const userFindOneByEmail = function (email: string): Promise<DbUser | null> {
  return new UsersRepo().getUserByEmail(email);
};

export const usersFindAllByEmail: (email: string) => Promise<Array<DbUser>> = async function (email: string) {
  return new UsersRepo().getAllUsersByEmail(email);
};

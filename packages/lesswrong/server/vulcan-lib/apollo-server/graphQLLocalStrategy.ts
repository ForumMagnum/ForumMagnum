/* eslint-disable no-param-reassign */
import { Strategy as PassportStrategy } from 'passport-strategy';
import type { Request } from 'express';

type VerifyFn = (username: string, password: string, done: (err: Error | null, user: any, info?: IVerifyOptions) => void) => void;
interface IVerifyOptions {
  info?: boolean;
  message?: string;
}

interface GraphQLLocalStrategyOptions {
  passReqToCallback?: boolean;
}

class GraphQLLocalStrategy extends PassportStrategy {
  verify: VerifyFn;
  passReqToCallback: boolean | undefined;
  name: string;
  error: any;
  fail: any;
  success: any;

  constructor( verify: VerifyFn ) {
    super();
    if (!verify) {
      throw new TypeError('GraphQLLocalStrategy requires a verify callback');
    }
    this.verify = verify;
    this.name = 'graphql-local';
  }

  authenticate(req: Request, options: { username?: string; email?: string; password: string }) {
    const { username, email, password } = options;

    const done = async (err: Error | null, user: any, info?: IVerifyOptions) => {
      if (err) { return this.error(err) }
      if (!user) { return this.fail(info, 401) }
      return this.success(user, info);
    };
    const usernameOrEmail = username || email
    if(!usernameOrEmail) throw Error("You have to provide either email or username")

    this.verify(usernameOrEmail, password, done);
  }
}



export default GraphQLLocalStrategy;

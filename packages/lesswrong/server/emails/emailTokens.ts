import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import { EmailTokens } from '../../server/collections/emailTokens/collection';
import { randomSecret } from '../../lib/random';
import Users from '../../server/collections/users/collection';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import gql from 'graphql-tag';
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { updateEmailToken } from '../collections/emailTokens/mutations';
import { updateUser } from '../collections/users/mutations';
import type { EmailTokenResult } from '@/components/users/EmailTokenResult';
import { userEmailAddressIsVerified } from '@/lib/collections/users/helpers';
import UsersRepo from '../repos/UsersRepo';
import { createPasswordHash, validatePassword } from '../vulcan-lib/apollo-server/passwordHelpers';

type emailTokenResultComponents = {
  EmailTokenResult: typeof EmailTokenResult,
};

export type EmailTokenResultComponentName = keyof emailTokenResultComponents;

export class EmailTokenType<T extends EmailTokenResultComponentName> {
  name: DbEmailTokens['tokenType']
  onUseAction: (user: DbUser, params: any, args: any) => Promise<ComponentProps<emailTokenResultComponents[T]>>
  resultComponentName: T
  reusable: boolean
  path: string
  
  constructor({ name, onUseAction, resultComponentName, reusable=false, path = "emailToken" }: {
    name: DbEmailTokens['tokenType'],
    onUseAction: (user: DbUser, params: any, args: any) => Promise<ComponentProps<emailTokenResultComponents[T]>>,
    resultComponentName: T,
    reusable?: boolean,
    path?: string,
  }) {
    if(!name || !onUseAction || !resultComponentName)
      throw new Error("EmailTokenType: missing required argument");
    
    this.name = name;
    this.onUseAction = onUseAction;
    this.resultComponentName = resultComponentName;
    this.reusable = reusable;
    this.path = path;
  }
  
  generateToken = async (userId: string) => {
    if (!userId) throw new Error("Missing required argument: userId");
    
    const token = randomSecret();
    await EmailTokens.rawInsert({
      token: token,
      tokenType: this.name,
      userId: userId,
      usedAt: null
    });
    return token;
  }
  
  generateLink = async (userId: string) => {
    if (!userId) throw new Error("Missing required argument: userId");
    
    const token = await this.generateToken(userId);
    const prefix = getSiteUrl().slice(0,-1);
    return `${prefix}/${this.path}/${token}`;
  }
  
  handleToken = async (token: DbEmailTokens, args: any) => {
    const user = await Users.findOne({_id: token.userId});
    if (!user) throw new Error(`Invalid userId on email token ${token._id}`);
    const actionResult = await this.onUseAction(user, token.params, args);
    return {
      componentName: this.resultComponentName,
      props: {...actionResult}
    };
  }
}

export type UseEmailTokenResult = Awaited<ReturnType<EmailTokenType<EmailTokenResultComponentName>['handleToken']>>;

async function getAndValidateToken(token: string) {
  const results = await EmailTokens.find({ token }).fetch();
  if (results.length !== 1)
    throw new Error("Invalid email token");
  const tokenObj = results[0];
  
  const tokenType = emailTokenTypesByName[tokenObj.tokenType];
  if (!tokenType)
    throw new Error("Email token has invalid type");
  
  if (tokenObj.usedAt && !tokenType.reusable)
    throw new Error("This email link has already been used.");
  
  return { tokenObj, tokenType }
}

export const emailTokensGraphQLTypeDefs = gql`
  extend type Mutation {
    useEmailToken(token: String, args: JSON): JSON
  }
`

export const emailTokensGraphQLMutations = {
  async useEmailToken(root: void, {token, args}: {token: string, args: any}, context: ResolverContext) {
      try {
        const { tokenObj, tokenType } = await getAndValidateToken(token)

        const resultProps = await tokenType.handleToken(tokenObj, args);
        await updateEmailToken({
          data: { usedAt: new Date() },
          selector: { _id: tokenObj._id }
        }, context);
        
        return resultProps;
      } catch(e) {
        //eslint-disable-next-line no-console
        console.error(`error when using email token: `, e);
        return {
          componentName: "EmailTokenResult",
          props: {
            message: e.message,
          }
        };
      }
    }
};

export const emailTokenTypesByName = {
  unsubscribeAll: new EmailTokenType({
    name: "unsubscribeAll",
    onUseAction: async (user: DbUser) => {
      await updateUser({
        data: { unsubscribeFromAll: true },
        selector: { _id: user._id }
      }, createAnonymousContext());
      return {message: `You have been unsubscribed from all emails on ${siteNameWithArticleSetting.get()}.` };
    },
    resultComponentName: "EmailTokenResult",
  }),

  verifyEmail: new EmailTokenType({
    name: "verifyEmail",
    onUseAction: async (user) => {
      if (userEmailAddressIsVerified(user)) return {message: "Your email address is already verified"}
      await new UsersRepo().verifyEmail(user._id);
      return {message: "Your email has been verified" };
    },
    resultComponentName: "EmailTokenResult"
  }),
  
  resetPassword: new EmailTokenType({
    name: "resetPassword",
    onUseAction: async (user, params, args) => {
      if (!args) throw Error("Using a reset-password token requires providing a new password")
      const { password } = args
      const validatePasswordResponse = validatePassword(password)
      if (!validatePasswordResponse.validPassword) throw Error(validatePasswordResponse.reason)

      await new UsersRepo().resetPassword(user._id, await createPasswordHash(password));
      return {message: "Your new password has been set. Try logging in again." };
    },
    resultComponentName: "EmailTokenResult",
    path: "resetPassword" // Defined in routes.ts
  }),
} satisfies Record<DbEmailTokens['tokenType'], EmailTokenType<EmailTokenResultComponentName>>;

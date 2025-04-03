import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import { EmailTokens } from '../../server/collections/emailTokens/collection';
import { randomSecret } from '../../lib/random';
import Users from '../../server/collections/users/collection';
import { updateMutator } from '../vulcan-lib/mutators';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import gql from 'graphql-tag';

let emailTokenTypesByName: Partial<Record<string,EmailTokenType>> = {};

export class EmailTokenType
{
  name: string
  onUseAction: (user: DbUser, params: any, args: any) => any
  resultComponentName: string
  reusable: boolean
  path: string
  
  constructor({ name, onUseAction, resultComponentName, reusable=false, path = "emailToken" }: {
    name: string,
    onUseAction: (user: DbUser, params: any, args: any) => any,
    resultComponentName: keyof ComponentTypes,
    reusable?: boolean,
    path?: string,
  }) {
    if(!name || !onUseAction || !resultComponentName)
      throw new Error("EmailTokenType: missing required argument");
    if (name in emailTokenTypesByName)
      throw new Error("EmailTokenType: name must be unique");
    
    this.name = name;
    this.onUseAction = onUseAction;
    this.resultComponentName = resultComponentName;
    this.reusable = reusable;
    this.path = path;
    emailTokenTypesByName[name] = this;
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

async function getAndValidateToken(token: string): Promise<{tokenObj: DbEmailTokens, tokenType: EmailTokenType}> {
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
        await updateMutator({
          collection: EmailTokens,
          documentId: tokenObj._id,
          set: {
            usedAt: new Date()
          },
          validate: false
        });
        
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


export const UnsubscribeAllToken = new EmailTokenType({
  name: "unsubscribeAll",
  onUseAction: async (user: DbUser) => {
    await updateMutator({ // FIXME: Doesn't actually do the thing
      collection: Users,
      documentId: user._id,
      set: {
        unsubscribeFromAll: true,
      },
      validate: false,
    });
    return {message: `You have been unsubscribed from all emails on ${siteNameWithArticleSetting.get()}.` };
  },
  resultComponentName: "EmailTokenResult",
});

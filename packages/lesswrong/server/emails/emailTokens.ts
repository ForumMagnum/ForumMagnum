import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import { EmailTokens } from '../../lib/collections/emailTokens/collection';
import { randomSecret } from '../../lib/random';
import Users from '../../lib/collections/users/collection';
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers } from '../../lib/vulcan-lib/graphql';
import { updateMutator } from '../vulcan-lib/mutators';

let emailTokenTypesByName = {};

export class EmailTokenType
{
  name: string
  onUseAction: any
  resultComponentName: string
  reusable: boolean
  path: string
  
  constructor({ name, onUseAction, resultComponentName, reusable=false, path = "emailToken" }) {
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
  
  generateToken = async (userId) => {
    if (!userId) throw new Error("Missing required argument: userId");
    
    const token = randomSecret();
    await EmailTokens.insert({
      token: token,
      tokenType: this.name,
      userId: userId,
      usedAt: null
    });
    return token;
  }
  
  generateLink = async (userId) => {
    if (!userId) throw new Error("Missing required argument: userId");
    
    const token = await this.generateToken(userId);
    const prefix = getSiteUrl().slice(0,-1);
    return `${prefix}/${this.path}/${token}`;
  }
  
  handleToken = async (token, args) => {
    const user = await Users.findOne({_id: token.userId});
    const actionResult = await this.onUseAction(user, token.params, args);
    return {
      componentName: this.resultComponentName,
      props: {...actionResult}
    };
  }
}

async function getAndValidateToken(token) {
  const results = await EmailTokens.find({ token }).fetch();
  if (results.length != 1)
    throw new Error("Invalid email token");
  const tokenObj = results[0];
  
  if (!(tokenObj.tokenType in emailTokenTypesByName))
    throw new Error("Email token has invalid type");
  
  const tokenType = emailTokenTypesByName[tokenObj.tokenType];
  
  if (tokenObj.usedAt && !tokenType.reusable)
    throw new Error("This email link has already been used.");
  
  return { tokenObj, tokenType }
}

addGraphQLMutation('useEmailToken(token: String, args: JSON): JSON');
addGraphQLQuery('getTokenParams(token: String): JSON');
addGraphQLResolvers({
  Mutation: {
    async useEmailToken(root, {token, args}, context: ResolverContext) {
      try {
        const { tokenObj, tokenType } = await getAndValidateToken(token)

        const resultProps = await tokenType.handleToken(tokenObj, args);
        await updateMutator({
          collection: EmailTokens,
          documentId: tokenObj._id,
          set: {
            usedAt: new Date()
          },
          unset: {},
          validate: false
        });
        
        return resultProps;
      } catch(e) {
        return {
          componentName: "EmailTokenResult",
          props: {
            message: e.message,
          }
        };
      }
    }
  }
});


export const UnsubscribeAllToken = new EmailTokenType({
  name: "unsubscribeAll",
  onUseAction: async (user) => {
    await updateMutator({ // FIXME: Doesn't actually do the thing
      collection: Users,
      documentId: user._id,
      set: {
        unsubscribeFromAll: true,
      },
      unset: {},
      validate: false,
    });
    return {message: "You have been unsubscribed from all emails on LessWrong." };
  },
  resultComponentName: "EmailTokenResult",
});

import { addGraphQLMutation, addGraphQLResolvers, updateMutator, Utils } from '../vulcan-lib';
import { EmailTokens } from '../../lib/collections/emailTokens/collection';
import { Random } from 'meteor/random';
import Users from '../../lib/collections/users/collection';

let emailTokenTypesByName = {};

export class EmailTokenType
{
  name: string
  onUseAction: any
  resultComponentName: string
  reusable: boolean
  
  constructor({ name, onUseAction, resultComponentName, reusable=false }) {
    if(!name || !onUseAction || !resultComponentName)
      throw new Error("EmailTokenType: missing required argument");
    if (name in emailTokenTypesByName)
      throw new Error("EmailTokenType: name must be unique");
    
    this.name = name;
    this.onUseAction = onUseAction;
    this.resultComponentName = resultComponentName;
    this.reusable = reusable;
    emailTokenTypesByName[name] = this;
  }
  
  generateToken = async (userId, params?: any) => {
    if (!userId) throw new Error("Missing required argument: userId");
    
    const token = Random.secret();
    await EmailTokens.insert({
      token: token,
      tokenType: this.name,
      userId: userId,
      usedAt: null,
      params: params,
    });
    return token;
  }
  
  generateLink = async (userId, params?: any) => {
    if (!userId) throw new Error("Missing required argument: userId");
    
    const token = await this.generateToken(userId, params);
    const prefix = Utils.getSiteUrl().slice(0,-1);
    return `${prefix}/emailToken/${token}`;
  }
  
  handleToken = async (token) => {
    const user = await Users.findOne({_id: token.userId});
    const actionResult = await this.onUseAction(user, token.params);
    return {
      componentName: this.resultComponentName,
      props: {...actionResult}
    };
  }
}


addGraphQLMutation('useEmailToken(token: String): JSON');
addGraphQLResolvers({
  Mutation: {
    async useEmailToken(root, {token}, context: ResolverContext) {
      try {
        const results = await EmailTokens.find({ token }).fetch();
        if (results.length != 1)
          throw new Error("Invalid email token");
        const tokenObj = results[0];
        
        if (!(tokenObj.tokenType in emailTokenTypesByName))
          throw new Error("Email token has invalid type");
        
        const tokenType = emailTokenTypesByName[tokenObj.tokenType];
        
        if (tokenObj.usedAt && !tokenType.reusable)
          throw new Error("This email link has already been used.");
        
        const resultProps = await tokenType.handleToken(tokenObj);
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

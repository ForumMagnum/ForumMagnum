import { addGraphQLMutation, addGraphQLResolvers } from 'meteor/vulcan:core';
import { EmailTokens } from '../../lib/collections/emailTokens/collection.js';
import { Random } from 'meteor/random';

let emailTokenTypesByName = {};

export class EmailTokenType
{
  constructor({ name, onUseAction, resultComponent }) {
    if(!name || !onUseAction || !resultComponent)
      throw new Error("EmailTokenType: missing required argument");
    if (name in emailTokenTypesByName)
      throw new Error("EmailTokenType: name must be unique");
    
    this.name = name;
    this.onUseAction = onUseAction;
    this.resultComponent = resultComponent;
    emailTokenTypesByName[name] = this;
  }
  
  generateToken = async (userId, params) => {
    const token = Random.secret();
    EmailTokens.insert({
      token: token,
      userId: userId,
      used: false,
      params: params,
    });
    return token;
  }
  
  generateLink = async (userId, params) => {
    const token = this.generateToken();
    const prefix = Utils.getSiteUrl().slice(0,-1);
    return `${prefix}/emailToken/${token}`;
  }
  
  handleToken = async (token) => {
    const user = await Users.findOne({_id: token.userId}).fetch();
    const actionResult = await this.onUseAction(user, token.params);
    return {
      component: this.resultComponent,
      props: {...actionResult}
    };
  }
}


addGraphQLMutation('useEmailToken(token: String): JSON');
addGraphQLResolvers({
  Mutation: {
    async useEmailToken(root, {token}, context) {
      const results = await EmailTokens.find({ token: token }).fetch();
      if (results.length != 1)
        throw new Error("Invalid email token");
      const tokenObj = results[0];
      
      if (!(tokenObj.tokenType in emailTokenTypesbyName))
        throw new Error("Email token has invalid type");
      
      return await emailTokenTypesByName[tokenObj.tokenType].handleToken(tokenObj);
    }
  }
});


export const UnsubscribeAllToken = new EmailTokenType({
  name: "unsubscribeAll",
  onUseAction: (userId) => {
    // TODO
    //return {message: "You have been unsubscribed from all emails on LessWrong." };
    return {message: "This feature hasn't been implemented yet."};
  },
  resultComponent: "EmailTokenResult",
});

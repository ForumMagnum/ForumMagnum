import React from 'react';
import { withDocument } from 'meteor/vulcan:core';
//import { withCurrentUser } from 'meteor/vulcan:core';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { createDummyUser, createDummyPost } from '../../testing/utils.js'
import { emailDoctype, generateEmail } from './renderEmail';
import { withStyles } from '@material-ui/core/styles';
import { Posts } from '../../lib/collections/posts';

chai.should();
chai.use(chaiAsPromised);

describe('renderEmail', async () => {
  it("Renders a simple component", async () => {
    const email = await generateEmail({
      user: createDummyUser(),
      subject: "Unit test email",
      bodyComponent: <div>Hello</div>
    });
    
    email.bodyHtml.should.equal(emailDoctype+'<body><div data-reactroot="">Hello</div></body>');
  });
  
  it("Generates a textual representation of the body", async () => {
    const email = await generateEmail({
      user: createDummyUser(),
      subject: "Unit test email",
      bodyComponent: <div>Hello</div>
    });
    
    email.bodyText.should.equal("Hello");
  });
  
  it("Renders styles with withStyles", async () => {
    const styles = {
      underlined: {
        textDecoration: "underline",
      }
    };
    const StyledComponent = withStyles(styles, {name:"StyledComponent"})(
      ({classes, children}) =>
        <div className={classes.underlined}>{children}</div>
    );
    
    
    const email = await generateEmail({
      user: createDummyUser(),
      subject: "Unit test email",
      bodyComponent: <div>Hello, <StyledComponent>World</StyledComponent></div>
    });
    
    email.bodyHtml.should.equal(emailDoctype+'<body><div data-reactroot="">Hello, <div class="StyledComponent-underlined" style="text-decoration: underline;">World</div></div></body>');
  });
  
  it("Can use Apollo HoCs", async () => {
    const user = createDummyUser();
    const post = await createDummyPost(user, { title: "Email unit test post" });
    console.log("Post ID: "+post._id);
    
    const queryOptions = {
      collection: Posts,
      queryName: 'postsSingleQuery',
      fragmentName: 'LWPostsPage',
      ssr: true
    };
    const PostTitleComponent = withDocument(queryOptions)(
      ({document}) => <div>{document.title}</div>
    );
    
    const email = await generateEmail({
      user: createDummyUser(),
      subject: "Unit test email",
      bodyComponent: <PostTitleComponent documentId={post._id} />
    });
    email.bodyHtml.should.equal(emailDoctype+'<body><div data-reactroot="">Email unit test post</div></body>');
  });
  
  /*it("Supports the withCurrentUser HoC", async () => {
    // TODO: Not currently passing
    const user = createDummyUser();
    
    const MyEmailComponent = withCurrentUser()(
      ({currentUser}) => <div>currentUser.username</div>
    );
    const email = await generateEmail({
      user: user,
      subject: "Unit test email",
      bodyComponent: <MyEmailComponent/>
    });
    email.bodyHtml.should.equal(emailDoctype+'<body><div data-reactroot="">{user.email}</div></body>');
  });*/
  
  /*it("Restricts field accesses based on the current user", async () => {
    // TODO: Write this test
  });*/
});
import "./integrationTestSetup";
import React from 'react';
import { useSingle } from '../lib/crud/withSingle';
import { createDummyUser, createDummyPost } from './utils'
import { emailDoctype, generateEmail } from '../server/emails/renderEmail';
import { withStyles, createStyles } from '@/lib/vendor/@material-ui/core/src/styles';
import { getUserEmail } from "../lib/collections/users/helpers";

const unitTestBoilerplateGenerator = ({css,title,body}: {css: string, title: string, body: string}): string => {
  const styleTag = (css && css.length>0) ? `<style>${css}</style>` : "";
  const html = `${styleTag}<body>${body}</body>`;
  return html;
}

async function renderTestEmail({ user=null, subject="Unit test email", bodyComponent, boilerplateGenerator }: {
  user?: DbUser|null,
  subject?: string,
  bodyComponent: JSX.Element,
  boilerplateGenerator?: typeof unitTestBoilerplateGenerator
}) {
  const destinationUser = user || await createDummyUser();
  const email = getUserEmail(destinationUser)
  if (!email) throw new Error("test email has no email address")
  return await generateEmail({
    user: destinationUser,
    to: email,
    subject: "Unit test email",
    bodyComponent,
    boilerplateGenerator: boilerplateGenerator||unitTestBoilerplateGenerator
  });
}

describe('renderEmail', () => {
  it("Renders a simple component", async () => {
    const email = await renderTestEmail({
      bodyComponent: <div>Hello</div>,
    });
    
    (email.html as any).should.equal(emailDoctype+'<body><div>Hello</div></body>');
  });
  
  it("Generates a textual representation of the body", async () => {
    const email = await renderTestEmail({
      bodyComponent: <div>Hello</div>,
    });
    
    email.text.should.equal("Hello");
  });
  
  it("Renders styles with withStyles", async () => {
    const styles = createStyles({
      underlined: {
        textDecoration: "underline",
      }
    });
    const StyledComponent = withStyles(styles, {name:"StyledComponent"})(
      ({classes, children}: {classes: any, children: any}) =>
        <div className={classes.underlined}>{children}</div>
    );
    
    
    const email = await renderTestEmail({
      bodyComponent: <div>Hello, <StyledComponent>World</StyledComponent></div>,
    });
    
    (email.html as any).should.equal(emailDoctype+'<body><div>Hello, <div class="StyledComponent-underlined" style="text-decoration: underline;">World</div></div></body>');
  });
  
  it("Can use Apollo useSingle", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user, { title: "Email unit test post" });
    
    const PostTitleComponent= ({documentId}: {documentId: string}) => {
      const { document } = useSingle({
        documentId,
        collectionName: "Posts",
        fragmentName: 'PostsRevision',
        extraVariables: {
          version: 'String'
        },
        extraVariablesValues: {
          version: null,
        },
      });
      return <div>{document?.title}</div>;
    }
    
    const email = await renderTestEmail({
      bodyComponent: <PostTitleComponent documentId={post._id}/>,
    });
    (email.html as any).should.equal(emailDoctype+'<body><div>Email unit test post</div></body>');
  });
  
  it("Can use Apollo hooks", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user, { title: "Email unit test post" });
    
    const PostTitleComponent = ({documentId}: {documentId: string}) => {
      const { document } = useSingle({
        documentId,
        collectionName: "Posts",
        fragmentName: 'PostsRevision',
        extraVariables: {
          version: 'String'
        },
        extraVariablesValues: {
          version: null,
        },
      });
      return <div>{document?.title}</div>
    }
    
    const email = await renderTestEmail({
      bodyComponent: <PostTitleComponent documentId={post._id} />,
    });
    (email.html as any).should.equal(emailDoctype+'<body><div>Email unit test post</div></body>');
  });
  
  /*it("Supports the withCurrentUser HoC", async () => {
    // TODO: Not currently passing
    const user = await createDummyUser();
    
    const MyEmailComponent = withCurrentUser(
      ({currentUser}) => <div>{currentUser && currentUser.email}</div>
    );
    const email = await renderTestEmail({
      bodyComponent: <MyEmailComponent/>,
    });
    email.html.should.equal(emailDoctype+`<body><div>${user.email}</div></body>`);
  });
  
  it("Restricts field accesses based on the current user", async () => {
    // TODO: Not currently passing
    // user1 has a PM. user1 is allowed to see it, user2 isn't.
    const user1 = await createDummyUser();
    const user2 = await createDummyUser();
    const conversation = await createDummyConversation(user1);
    await createDummyMessage(conversation);
    
    const MessagesByConversationComponent = withMulti({
      collection: Messages,
      fragmentName: "messageListFragment",
      ssr: true,
    })(
      ({results}) => <div>{results.map((message, i) => <div key={i}>{message.htmlBody}</div>)}</div>
    );
    const ShowThePMComponent = () =>
      <MessagesByConversationComponent terms={{view: 'messagesConversation', conversationId: conversation._id}} />
    
    const permissionGrantedEmail = await renderTestEmail({
      user: user1,
      bodyComponent: <ShowThePMComponent/>,
    });
    const permissionDeniedEmail = await renderTestEmail({
      user: user2,
      bodyComponent: <ShowThePMComponent/>,
    });
    
    permissionGrantedEmail.html.should.equal(emailDoctype+'<body><div><div>Message body</div></div></body>');
    permissionDeniedEmail.html.should.equal(emailDoctype+'<body><div></div></body>');
  });*/
});

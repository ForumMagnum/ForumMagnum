import "./integrationTestSetup";
import React from 'react';
import { createDummyUser, createDummyPost } from './utils'
import { createEmailContext, generateEmail } from '../server/emails/renderEmail';
import { getUserEmail } from "../lib/collections/users/helpers";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from "@/components/hooks/useStyles";
import { useEmailQuery } from "@/server/vulcan-lib/query";
import { EmailContextType, useEmailStyles } from "@/server/emailComponents/emailContext";

const emailDoctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';

const PostsRevisionQuery = gql(`
  query emailstests($documentId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsRevision
      }
    }
  }
`);

const unitTestBoilerplateGenerator = ({css,title,body}: {css: string, title: string, body: string}): string => {
  const styleTag = (css && css.length>0) ? `<style>${css}</style>` : "";
  const html = `${styleTag}${body}`;
  return html;
}

async function renderTestEmail({ user=null, subject="Unit test email", bodyComponent, boilerplateGenerator, emailContext }: {
  user?: DbUser|null,
  subject?: string,
  bodyComponent: React.JSX.Element,
  boilerplateGenerator?: typeof unitTestBoilerplateGenerator,
  emailContext?: EmailContextType,
}) {
  const destinationUser = user || await createDummyUser();
  emailContext ??= await createEmailContext(destinationUser);
  const email = getUserEmail(destinationUser)
  if (!email) throw new Error("test email has no email address")

  return await generateEmail({
    user: destinationUser,
    to: email,
    subject: "Unit test email",
    bodyComponent,
    boilerplateGenerator: boilerplateGenerator||unitTestBoilerplateGenerator,
    emailContext,
  });
}

describe('renderEmail', () => {
  it("Renders a simple component", async () => {
    const email = await renderTestEmail({
      bodyComponent: <div>Hello</div>,
    });
    
    (email.html as any).should.equal(emailDoctype+'<div>Hello</div>');
  });
  
  it("Generates a textual representation of the body", async () => {
    const email = await renderTestEmail({
      bodyComponent: <div>Hello</div>,
    });
    
    email.text.should.equal("Hello");
  });
  
  it("Renders styles with useEmailStyles", async () => {
    const styles = defineStyles("StyledComponent", (theme) => ({
      underlined: {
        textDecoration: "underline",
      }
    }));

    const emailContext = await createEmailContext(null);
    const TestComponent = ({children}: {children: any}) => {
      const classes = useEmailStyles(styles, emailContext);
      return <div className={classes.underlined}>{children}</div>
    };
    
    const email = await renderTestEmail({
      bodyComponent: <div>Hello, <TestComponent>World</TestComponent></div>,
      emailContext,
    });
    
    (email.html as any).should.equal(emailDoctype+'<div>Hello, <div class="StyledComponent-underlined" style="text-decoration: underline;">World</div></div>');
  });
  
  it("Can use useEmailQuery", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user, { title: "Email unit test post" });

    const emailContext = await createEmailContext(user);
    
    const PostTitleComponent= async ({documentId}: {documentId: string}) => {
      const { data } = await useEmailQuery(PostsRevisionQuery, {
        variables: { documentId: documentId, version: null },
        emailContext,
      });
      const document = data?.post?.result;
      return <div>{document?.title}</div>;
    }
    
    const email = await renderTestEmail({
      bodyComponent: <PostTitleComponent documentId={post._id}/>,
      emailContext,
    });
    (email.html as any).should.equal(emailDoctype+'<div>Email unit test post</div>');
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
    email.html.should.equal(emailDoctype+`<div>${user.email}</div>`);
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
    
    permissionGrantedEmail.html.should.equal(emailDoctype+'<div><div>Message body</div></div>');
    permissionDeniedEmail.html.should.equal(emailDoctype+'<div></div>');
  });*/
});

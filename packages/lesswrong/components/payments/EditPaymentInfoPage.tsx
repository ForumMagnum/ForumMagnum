import React from 'react';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useNavigation } from '../../lib/routeUtil';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 600,
    margin: "auto"
  },
  info: {
    marginTop: 25,
    marginBottom: 25
  }
});

export const EditPaymentInfoPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { SectionTitle, Error404, ContentStyles } = Components
  const currentUser = useCurrentUser()
  const { flash } = useMessages();
  const { history } = useNavigation();
  
  if (!currentUser) return <Error404/>
  return <ContentStyles contentType="comment" className={classes.root}>
      <SectionTitle title={`Edit Payment for ${currentUser.displayName}`}/>
      <div className={classes.info}>
        <p>To be eligible for prizes and donations through LessWrong, you need a <a href="https://paypal.com/">PayPal account</a>, and to enter your associated PayPal email/info here.</p>
        <p>If you receive more than $600 in a year, you'll need to be entered into Center for Applied Rationality's payment system. CFAR will contact you via your LessWrong email address about next steps. (Make sure it's an email that you check regularly)</p>
      </div>
      <Components.WrappedSmartForm
        layout="elementOnly"
        collectionName="Users"
        documentId={currentUser._id}
        fields={['paymentEmail', 'paymentInfo']}
        successCallback={async (user: UsersMinimumInfo | DbUser | null) => {
          flash(`Payment Info for "${userGetDisplayName(user)}" edited`);
          history.push(userGetProfileUrl(user));
        }}
        // cancelCallback={cancelCallback}
        showRemove={false}
        queryFragment={getFragment('UsersEdit')}
        mutationFragment={getFragment('UsersEdit')}
        submitLabel="Save"
      />
  </ContentStyles>;
}

const EditPaymentInfoPageComponent = registerComponent('EditPaymentInfoPage', EditPaymentInfoPage, {styles});

declare global {
  interface ComponentTypes {
    EditPaymentInfoPage: typeof EditPaymentInfoPageComponent
  }
}


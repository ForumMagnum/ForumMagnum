

// A form Submit button, except that if you aren't logged in, it pops up a
// login dialog first.
const SubmitOrLogin = (props) => {
  return <FormSubmit ...props onSubmit={(event) => {
    if (!props.currentUser) {
      event.preventDefault();
      this.props.openDialog({
        componentName: "AccountsLoginForm",
        componentProps: {},
      });
    }
  }}/>
}

registerComponent('SubmitOrLogin', SubmitOrLogin, withDialog);
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withTracking } from "../../lib/analyticsEvents"

class WrappedLoginForm extends Component
{
  state = {
    reCaptchaToken: null
  };
  
  setReCaptchaToken = (token) => {
    this.setState({reCaptchaToken: token})
  }

  render() {
    const customSignupFields = ['EAForum', 'AlignmentForum'].includes(getSetting('forumType'))
      ? []
      : [
        {
          id: "subscribeToCurated",
          type: 'custom',
          defaultValue: true,
          renderCustom: Components.SignupSubscribeToCurated
        }
      ]

    //wrap any existing hooks with analytics tracking
      const addTrackingToHook = (hook, hookType) => {
        return (hookParams) => {
          this.props.captureEvent("accountHookEvent", {hookType})
          if (hook) hook(hookParams)
      }}

    const onPreSignUpHook = (options) => {
      const reCaptchaToken = this.state.reCaptchaToken
      return {...options, profile: {...options.profile, reCaptchaToken}}
    }

    return <React.Fragment>
      {getSetting('reCaptcha.apiKey')
        && <Components.ReCaptcha verifyCallback={this.setReCaptchaToken} action="login/signup"/>}
      <Components.AccountsLoginForm
        onSubmitHook={addTrackingToHook(this.props.onSubmitHook, "onSubmitHook")}
        onPreSignUpHook={addTrackingToHook(onPreSignUpHook, "onPostSignUpHook")}
        onPostSignUpHook={addTrackingToHook(this.props.onPostSignUpHook, "onPostSignUpHook")}
        onSignedInHook={addTrackingToHook(this.props.onSignedInHook, "onSignedInHook")}
        onSignedOutHook={addTrackingToHook(this.props.onSignedOutHook, "onSignedOutHook")}
        customSignupFields={customSignupFields}
        {...this.props}
      />
    </React.Fragment>;
  }
}

registerComponent('WrappedLoginForm', WrappedLoginForm, withTracking);

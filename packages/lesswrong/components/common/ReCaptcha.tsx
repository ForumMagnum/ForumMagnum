// Copied from: https://raw.githubusercontent.com/codeep/react-recaptcha-v3/master/src/ReCaptcha.js
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { registerComponent } from '../../lib/vulcan-lib'
import { reCaptchaSiteKeySetting } from '../../lib/publicSettings'
import { isClient } from '../../lib/executionEnvironment';

const reCaptchaSiteKey = reCaptchaSiteKeySetting.get()

const propTypes = {
  elementID: PropTypes.string,
  verifyCallbackName: PropTypes.string,
  verifyCallback: PropTypes.func,
  sitekey: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired
}

const defaultProps = {
  elementID: 'g-recaptcha',
  verifyCallbackName: 'verifyCallback',
  sitekey: reCaptchaSiteKey
}

const isReady = () =>
  typeof window !== 'undefined' &&
  typeof window.grecaptcha !== 'undefined' &&
  typeof window.grecaptcha.execute !== 'undefined'

let readyCheck: NodeJS.Timeout

interface ReCaptchaProps {
  elementID?: string,
  verifyCallbackName?: string,
  verifyCallback: (token: string) => void,
  sitekey?: string,
  action: string,
}
interface ReCaptchaState {
  ready: boolean,
}
class ReCaptcha extends Component<ReCaptchaProps,ReCaptchaState> {
  constructor (props: ReCaptchaProps) {
    super(props)

    this.execute = this.execute.bind(this)

    this.state = {
      ready: isReady()
    }

    if (isClient && !this.state.ready) {
      readyCheck = setInterval(this._updateReadyState.bind(this), 1000)
    }
  }

  componentDidMount () {
    if (this.state.ready) {
      this.execute()
    }
  }

  componentDidUpdate (_: ReCaptchaProps, prevState: ReCaptchaState) {
    if (this.state.ready && !prevState.ready) {
      this.execute()
    }
  }
  
  componentWillUnmount () {
    clearInterval(readyCheck)
  }

  execute () {
    const {
      sitekey,
      verifyCallback,
      action,
    } = this.props

    if (this.state.ready) {
      window.grecaptcha.execute(sitekey, { action })
        .then((token: string) => {

          if (typeof verifyCallback !== 'undefined') {
            verifyCallback(token)
          }
        })
    }
  }

  _updateReadyState () {
    if (isReady()) {
      this.setState(() => ({ ready: true }))

      clearInterval(readyCheck)
    }
  }

  render () {
    return this.state.ready ? (
      <div
        id={this.props.elementID}
        data-verifycallbackname={this.props.verifyCallbackName}
      />
    ) : (
      <div id={this.props.elementID} className='g-recaptcha' />
    )
  }
}

(ReCaptcha as any).propTypes = propTypes;
(ReCaptcha as any).defaultProps = defaultProps;

const ReCaptchaComponent = registerComponent("ReCaptcha", ReCaptcha)

declare global {
  interface ComponentTypes {
    ReCaptcha: typeof ReCaptchaComponent
  }
}


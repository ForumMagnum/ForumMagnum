import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { hasPasswordService } from '../../lib/vulcan-accounts/helpers';
import { registerComponent } from '../../lib/vulcan-core';

export class AccountsPasswordOrService extends PureComponent<any> {
  render () {
    let { className = 'password-or-service', style = {} } = this.props;
    const services = Object.keys(this.props.oauthServices).map(service => {
      return this.props.oauthServices[service].label;
    });
    let labels = services;
    if (services.length > 2) {
      labels = [];
    }

    if (hasPasswordService() && services.length > 0) {
      return (
        <div style={style} className={className}>
          { `or use ${ labels.join(' / ') }` }
        </div>
      );
    }
    return null;
  }
}

(AccountsPasswordOrService as any).propTypes = {
  oauthServices: PropTypes.object
};

const AccountsPasswordOrServiceComponent = registerComponent('AccountsPasswordOrService', AccountsPasswordOrService);

declare global {
  interface ComponentTypes {
    AccountsPasswordOrService: typeof AccountsPasswordOrServiceComponent
  }
}


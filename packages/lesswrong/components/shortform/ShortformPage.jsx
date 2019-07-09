import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';

class ShortformPage extends PureComponent {
  state = { showShortformFeed: false }

  render () {
    // const { currentUser } = this.props
    const { SingleColumnSection, ShortformThreadList, SectionTitle } = Components

    return (
      <SingleColumnSection>
        <SectionTitle title="Shortform Content [Beta]"/>  
        <ShortformThreadList terms={{view: 'shortform', limit:20}} />
      </SingleColumnSection>
    )
  }
}

registerComponent('ShortformPage', ShortformPage, withUser);
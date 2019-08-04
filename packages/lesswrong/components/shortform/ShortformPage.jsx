import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

const styles = theme => ({
  column: {
    width:680,
    margin:"auto"
  }
})

const ShortformPage = ({classes}) => {
  const { SingleColumnSection, ShortformThreadList, SectionTitle } = Components

  return (
    <SingleColumnSection>
      <div className={classes.column}>
        <SectionTitle title="Shortform Content [Beta]"/>
        <ShortformThreadList terms={{view: 'shortform', limit:20, testLimit:30}} />
      </div>
    </SingleColumnSection>
  )
}

registerComponent('ShortformPage', ShortformPage, withStyles(styles, {name:"ShortformPage"}));

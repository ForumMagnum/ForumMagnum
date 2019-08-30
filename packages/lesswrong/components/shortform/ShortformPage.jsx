import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  column: {
    maxWidth:680,
    margin:"auto"
  }
})

const ShortformPage = ({classes}) => {
  const { SingleColumnSection, ShortformThreadList, SectionTitle } = Components

  return (
    <SingleColumnSection>
      <div className={classes.column}>
        <SectionTitle title="Shortform Content [Beta]"/>
        <ShortformThreadList terms={{view: 'shortform', limit:20}} />
      </div>
    </SingleColumnSection>
  )
}

registerComponent('ShortformPage', ShortformPage, withStyles(styles, {name:"ShortformPage"}));

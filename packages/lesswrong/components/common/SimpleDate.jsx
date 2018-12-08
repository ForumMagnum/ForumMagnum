import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

/// A simple date, with no special cases, like "Jan 1, 2020". Hover over to
/// also see the time.
const SimpleDate = ({date}) => {
  return <Components.FormatDate date={date} format="MMM DD, YYYY"/>
};

registerComponent('SimpleDate', SimpleDate);


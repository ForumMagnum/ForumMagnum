import { Components } from 'meteor/vulcan:core';
import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { chai } from 'meteor/practicalmeteor:chai';
import TestComponent from './TestComponent.jsx'

configure({ adapter: new Adapter() })

describe('TodoItem', () => {
  it('should render', () => {
    const item = shallow(<TestComponent  />)
    chai.assert(item.hasClass('recent-comments-page'));

  });
});

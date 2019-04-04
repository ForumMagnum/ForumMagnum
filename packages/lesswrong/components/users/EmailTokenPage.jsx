import React, {Component} from 'react';
import { Components, registerComponent, withMutation } from 'meteor/vulcan:core';
import { getComponent } from 'meteor/vulcan:lib';

class EmailTokenPage extends Component
{
  state = {
    loading: true,
    useTokenResult: null
  };
  
  componentDidMount() {
    const { params } = this.props;
    const { token } = params;
    this.props.useEmailToken({token: token}).then((mutationResult) => {
      this.setState({
        loading: false,
        useTokenResult: mutationResult.data.useEmailToken,
      });
    });
  }
  
  render = () => {
    const { loading, useTokenResult } = this.state;
    if (loading)
      return <Components.Loading/>
    
    const ResultComponent = getComponent(useTokenResult.component);
    return <ResultComponent {...useTokenResult.props}/>
  }
}

registerComponent("EmailTokenPage", EmailTokenPage,
  withMutation({
    name: "useEmailToken",
    args: {token: 'String'}
  })
);

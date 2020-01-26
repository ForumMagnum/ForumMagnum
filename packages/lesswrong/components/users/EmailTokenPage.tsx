import React, {Component} from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withMutation } from '../../lib/crud/withMutation';
import { withLocation } from '../../lib/routeUtil';

type ComponentNameAndProps = { componentName: string, props: Record<string,any> };
interface EmailTokenPageProps {
  location: any,
  useEmailToken: any,
}
interface EmailTokenPageState {
  loading: boolean,
  useTokenResult: ComponentNameAndProps|null,
}

class EmailTokenPage extends Component<EmailTokenPageProps,EmailTokenPageState>
{
  state: EmailTokenPageState = {
    loading: true,
    useTokenResult: null
  };
  
  componentDidMount() {
    const { params } = this.props.location;
    const { token } = params;
    this.props.useEmailToken({token}).then((mutationResult) => {
      this.setState({
        loading: false,
        useTokenResult: mutationResult.data.useEmailToken,
      });
    });
  }
  
  render = () => {
    const { loading, useTokenResult } = this.state;
    if (loading || useTokenResult===null) {
      return <Components.Loading/>
    } else {
      const ResultComponent = Components[useTokenResult.componentName];
      return <ResultComponent {...useTokenResult.props}/>
    }
  }
}

const EmailTokenPageComponent = registerComponent("EmailTokenPage", EmailTokenPage,
  withLocation,
  withMutation({
    name: "useEmailToken",
    args: {token: 'String'}
  })
);

declare global {
  interface ComponentTypes {
    EmailTokenPage: typeof EmailTokenPageComponent
  }
}

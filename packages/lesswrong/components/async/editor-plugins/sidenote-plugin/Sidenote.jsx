import React, { PureComponent } from 'react';

class Sidenote extends PureComponent {
  render() {
    return (
      <span data-entity-key={this.props.entityKey}>
        <span className="sidenoteNumber"></span>
        <span className="sidenote">
          {this.props.children}
        </span>
      </span>
    )
  }
}

export default Sidenote;

import React, { PureComponent, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';
import withErrorBoundary from '../../common/withErrorBoundary'

const styles = theme => ({
  stickyContainer: {
    position: "absolute",
    right: "100%",
    marginRight: 60,
    top: 120,
    width: 240,
    height: "100%",
  },
  
  stickyBlock: {
    position: "sticky",
    fontSize: 12,
    top: 100,
    lineHeight: 1.0,
  },
});

// Context used to share a reference used to share the table of contents
// between the ToC itself, and the Header. The Header uses the ToC to change
// its icon (if a ToC is present) and to put the ToC inside NavigationMenu; it
// needs this Context because it doesn't have access to the post, which is on
// the wrong side of a whole lot of plumbing.
//
// The reference is to a function setToC, which puts the ToC in the state of
// Layout.
export const tableOfContentsContext = React.createContext('tableOfContentsRef');

function withToCContext(Component) {
  return function WithToCContextComponent(props) {
    return <tableOfContentsContext.Consumer>
      { setToC => <Component {...props} setToC={setToC}/> }
    </tableOfContentsContext.Consumer>
  }
}

class TableOfContents extends Component
{
  constructor(props) {
    super(props);
    
    this.state = {
      drawerOpen: false,
    };
  }
  
  componentDidMount() {
    this.props.setToC(this.props.document, this.props.sections);
  }

  componentWillUnmount() {
    this.props.setToC(null);
  }
  
  render() {
    const { classes, sections, document, context } = this.props;
    
    if (!sections || !document)
      return <div/>
    
    return (<React.Fragment>
      <Hidden mdDown implementation="js">
        <div className={classes.stickyContainer}>
          <div className={classes.stickyBlock}>
            <Components.TableOfContentsList
              sections={sections}
              document={document}
              context={context}
              drawerStyle={false}
            />
          </div>
        </div>
      </Hidden>
    </React.Fragment>);
  }
}

registerComponent("TableOfContents", TableOfContents,
  withErrorBoundary, withToCContext,
  withStyles(styles, { name: "TableOfContents" }));

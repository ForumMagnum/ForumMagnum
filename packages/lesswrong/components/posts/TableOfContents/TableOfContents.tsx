import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles, createStyles } from '@material-ui/core/styles';
import withErrorBoundary from '../../common/withErrorBoundary'

const styles = createStyles(theme => ({
  stickyBlock: {
    position: "sticky",
    fontSize: 12,
    top: 120,
    lineHeight: 1.0,
    marginLeft:1,
    paddingLeft:theme.spacing.unit*2,
    textAlign:"left",
    height:"80vh",
    overflowY:"scroll",
    direction:"rtl",
    "&::-webkit-scrollbar": {
      width: 1,
    },

    /* Track */
    "&::-webkit-scrollbar-track": {
        background: "none",
    },

    /* Handle */
    "&::-webkit-scrollbar-thumb": {
        background: theme.palette.grey[300],
    },

    /* Handle on hover */
    "&::-webkit-scrollbar-thumb:hover": {
        background: theme.palette.grey[700],
    },

    [theme.breakpoints.down('sm')]:{
      display:'none'
    }
  },
}));

// Context used to share a reference used to share the table of contents
// between the ToC itself, and the Header. The Header uses the ToC to change
// its icon (if a ToC is present) and to put the ToC inside NavigationMenu; it
// needs this Context because it doesn't have access to the post, which is on
// the wrong side of a whole lot of plumbing.
//
// The reference is to a function setToC, which puts the ToC in the state of
// Layout.
export const TableOfContentsContext = React.createContext<any>(null);

function withToCContext(Component) {
  return function WithToCContextComponent(props) {
    return <TableOfContentsContext.Consumer>
      { setToC => <Component {...props} setToC={setToC}/> }
    </TableOfContentsContext.Consumer>
  }
}

interface TableOfContentsProps extends WithStylesProps {
  setToC: any,
  sectionData: any,
  document: any,
  context: any,
}
interface TableOfContentsState {
  drawerOpen: boolean,
}

class TableOfContents extends Component<TableOfContentsProps,TableOfContentsState>
{
  state: TableOfContentsState = { drawerOpen: false }

  componentDidMount() {
    this.props.setToC(this.props.document, this.props.sectionData);
  }

  componentWillUnmount() {
    this.props.setToC(null, null);
  }

  render() {
    const { classes, sectionData, document, context } = this.props;

    if (!sectionData || !document)
      return <div/>

    return (
      <div className={classes.stickyBlock}>
        <Components.TableOfContentsList
          sectionData={sectionData}
          document={document}
          context={context}
          drawerStyle={false}
        />
      </div>
    );
  }
}

const TableOfContentsComponent = registerComponent("TableOfContents", TableOfContents,
  withErrorBoundary, withToCContext,
  withStyles(styles, { name: "TableOfContents" }));

declare global {
  interface ComponentTypes {
    TableOfContents: typeof TableOfContentsComponent
  }
}

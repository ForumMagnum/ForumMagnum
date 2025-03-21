import * as React from 'react';
import { Grid } from '@/lib/vendor/@material-ui/core/src';
import { Theme, createStyles } from '@/lib/vendor/@material-ui/core/src/styles';
import withStyles, { WithStyles } from '@/lib/vendor/@material-ui/core/src/styles/withStyles';
import withWidth, { WithWidth } from '@/lib/vendor/@material-ui/core/src/withWidth';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.palette.common.black,
    },
  });

interface HelloProps extends WithWidth, WithStyles<typeof styles> {
  name?: string;
}

export class Hello extends React.Component<HelloProps> {
  static defaultProps = {
    name: 'Alex',
  };

  render() {
    return (
      <Grid
        className={this.props.classes.root}
        direction={this.props.width === 'sm' ? 'column' : 'row'}
      >
        <h1>Hello {this.props.name}!</h1>
      </Grid>
    );
  }
}

const Decorated = withWidth()(withStyles(styles)(Hello));

<Decorated name="Bob" />;

interface SFCProps extends WithWidth {
  name: string;
}
const WidthSFC = withWidth()(({ width, name }: SFCProps) => (
  <div style={{ width }}>hello, {name}</div>
));

<WidthSFC name="Hortense" />;

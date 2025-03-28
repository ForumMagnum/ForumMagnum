import * as React from 'react';
import { withStyles, WithStyles, createStyles, Theme } from '@/lib/vendor/@material-ui/core/src/styles';
import Typography, { TypographyProps } from '@/lib/vendor/@material-ui/core/src/Typography';

const styles = ({ palette, spacing }: Theme) =>
  createStyles({
    root: {
      padding: spacing.unit,
      backgroundColor: palette.background.default,
      color: palette.primary.dark,
    },
  });

interface Props extends WithStyles<typeof styles> {
  color: TypographyProps['color'];
  text: string;
  variant: TypographyProps['variant'];
}

const DecoratedSFC = withStyles(styles)(({ text, variant, color, classes }: Props) => (
  <Typography variant={variant} color={color} classes={classes}>
    {text}
  </Typography>
));

const DecoratedClass = withStyles(styles)(
  class extends React.Component<Props> {
    render() {
      const { text, variant, color, classes } = this.props;
      return (
        <Typography variant={variant} color={color} classes={classes}>
          {text}
        </Typography>
      );
    }
  },
);

const DecoratedNoProps = withStyles(styles)(
  class extends React.Component<WithStyles<typeof styles>> {
    render() {
      return <Typography classes={this.props.classes}>Hello, World!</Typography>;
    }
  },
);

const sfcElem = <DecoratedSFC text="Hello, World!" variant="title" color="secondary" />;
const classElem = <DecoratedClass text="Hello, World!" variant="title" color="secondary" />;
const noPropsElem = <DecoratedNoProps />;

interface Book {
  category: 'book';
  author: string;
}

interface Painting {
  category: 'painting';
  artist: string;
}

type ArtProps = Book | Painting;

const DecoratedUnionProps = withStyles(styles)(
  class extends React.Component<ArtProps & WithStyles<typeof styles>> {
    render() {
      const props = this.props;
      return (
        <Typography classes={props.classes}>
          {props.category === 'book' ? props.author : props.artist}
        </Typography>
      );
    }
  },
);

const unionPropElem = <DecoratedUnionProps category="book" author="Twain, Mark" />;

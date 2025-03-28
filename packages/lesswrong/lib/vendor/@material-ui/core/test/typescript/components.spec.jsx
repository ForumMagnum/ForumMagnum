import * as React from 'react';
import {
  AppBar,
  Avatar,
  Backdrop,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Checkbox,
  Chip,
  CircularProgress,
  ClickAwayListener,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Divider,
  Drawer,
  ExpansionPanel,
  ExpansionPanelActions,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Fade,
  FormControlLabel,
  FormGroup,
  Grid,
  GridList,
  GridListTile,
  Grow,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  MobileStepper,
  Paper,
  Popover,
  Select,
  Snackbar,
  SnackbarContent,
  SwipeableDrawer,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  withMobileDialog,
} from '@/lib/vendor/@material-ui/core/src';
import {
  withStyles,
  StyleRulesCallback,
  WithStyles,
  Theme,
  createStyles,
} from '@/lib/vendor/@material-ui/core/src/styles';
import { DialogProps } from '@/lib/vendor/@material-ui/core/src/Dialog';

const log = console.log;
const FakeIcon = () => <div>ICON</div>;

const AppBarTest = () => (
  <AppBar position="static">
    <Toolbar>
      <IconButton color="inherit" aria-label="Menu">
        <FakeIcon />
      </IconButton>
      <Typography variant="title" color="inherit">
        Title
      </Typography>
      <Button color="inherit">Login</Button>
    </Toolbar>
  </AppBar>
);

const AvatarTest = () => <Avatar alt="Image Alt" src="example.jpg" />;

const AvaterClassName = () => <Avatar className="foo" />;

const BadgeTest = () => (
  <Badge badgeContent={4} color="primary">
    <FakeIcon />
  </Badge>
);

const BottomNavigationTest = () => {
  const value = 123;

  return (
    <BottomNavigation value={value} onChange={log} showLabels>
      <BottomNavigationAction label="Recents" icon={<FakeIcon />} />
      <BottomNavigationAction label="Favorites" />
      <BottomNavigationAction label={<span>Nearby</span>} icon={<FakeIcon />} />
    </BottomNavigation>
  );
};

const ButtonTest = () => (
  <div>
    <Button>I am a button!</Button>
    <Button color="inherit">Contrast</Button>
    <Button disabled>Disabled</Button>
    <Button href="#flat-buttons">Link</Button>
    <Button size="small">Small</Button>
    <Button variant="raised">Raised</Button>
    <Button variant="fab" color="primary" aria-label="add">
      <FakeIcon />
    </Button>
    <Button tabIndex={1} title="some button">
      Raised
    </Button>
    <Button component="a">Simple Link</Button>
    <Button component={props => <a {...props} />}>Complexe Link</Button>
  </div>
);

const IconButtonTest = () => (
  <div>
    <IconButton aria-label="Delete">
      <FakeIcon />
    </IconButton>
    <IconButton aria-label="Delete" disabled>
      <FakeIcon />
    </IconButton>
    <IconButton color="secondary" aria-label="Add an alarm">
      <FakeIcon />
    </IconButton>
    <IconButton color="inherit" aria-label="Add to shopping cart">
      <FakeIcon />
    </IconButton>
    <IconButton color="primary" aria-label="Add to shopping cart">
      <FakeIcon />
    </IconButton>
  </div>
);

const CardTest = () => (
  <Card>
    <CardContent>
      <Typography variant="body1">Word of the Day</Typography>
      <Typography variant="headline" component="h2">
        be-nev-o-lent
      </Typography>
      <Typography variant="body1">adjective</Typography>
      <Typography component="p">
        well meaning and kindly.
        <br />
        {'"a benevolent smile"'}
      </Typography>
    </CardContent>
    <CardActions>
      <Button size="small">Learn More</Button>
    </CardActions>
  </Card>
);

const CardMediaTest = () => (
  <Card>
    <CardHeader
      avatar={<Avatar aria-label="Recipe">R</Avatar>}
      title="Shrimp and Chorizo Paella"
      subheader="September 14, 2016"
    />
    <CardMedia image="src.png" component="div">
      <img src={'image/src.png'} alt="Contemplative Reptile" />
    </CardMedia>
    <CardContent>
      <Typography component="p">
        This impressive paella is a perfect party dish and a fun meal to cook together with your
        guests. Add 1 cup of frozen peas along with the mussels, if you like.
      </Typography>
    </CardContent>
    <CardActions disableActionSpacing>
      <IconButton aria-label="Add to favorites">
        <FakeIcon />
      </IconButton>
      <IconButton aria-label="Share">
        <FakeIcon />
      </IconButton>
      <IconButton aria-label="Show more">
        <FakeIcon />
      </IconButton>
    </CardActions>
    <Collapse in={true} timeout="auto" unmountOnExit>
      <CardContent>
        <Typography paragraph variant="body2">
          Method:
        </Typography>
        <Typography paragraph>
          Heat 1/2 cup of the broth in a pot until simmering, add saffron and set aside for 10
          minutes.
        </Typography>
        <Typography paragraph>
          Heat oil in a (14- to 16-inch) paella pan or a large, deep skillet over medium-high heat.
          Add chicken, shrimp and chorizo, and cook, stirring occasionally until lightly browned, 6
          to 8 minutes. Transfer shrimp to a large plate and set aside, leaving chicken and chorizo
          in the pan. Add pimentón, bay leaves, garlic, tomatoes, onion, salt and pepper, and cook,
          stirring often until thickened and fragrant, about 10 minutes. Add saffron broth and
          remaining 4 1/2 cups chicken broth; bring to a boil.
        </Typography>
        <Typography paragraph>
          Add rice and stir very gently to distribute. Top with artichokes and peppers, and cook
          without stirring, until most of the liquid is absorbed, 15 to 18 minutes. Reduce heat to
          medium-low, add reserved shrimp and mussels, tucking them down into the rice, and cook
          again without stirring, until mussels have opened and rice is just tender, 5 to 7 minutes
          more. (Discard any mussels that don’t open.)
        </Typography>
        <Typography>
          Set aside off of the heat to let rest for 10 minutes, and then serve.
        </Typography>
      </CardContent>
    </Collapse>
  </Card>
);

const ChipsTest = () => (
  <div>
    <Chip label="Basic Chip" />
    <Chip avatar={<Avatar>MB</Avatar>} label="Clickable Chip" onClick={log} />
    <Chip avatar={<Avatar src={'image.bmp'} />} label="Deletable Chip" onDelete={log} />
    <Chip
      avatar={
        <Avatar>
          <FakeIcon />
        </Avatar>
      }
      label="Clickable Deletable Chip"
      onClick={log}
      onDelete={log}
    />
  </div>
);

const DialogTest = () => {
  const emails = ['username@gmail.com', 'user02@gmail.com'];
  return (
    <Dialog onClose={log} open>
      <DialogTitle>Set backup account</DialogTitle>
      <div>
        <List>
          {emails.map(email => (
            <ListItem button onClick={log} key={email}>
              <ListItemAvatar>
                <Avatar>
                  <FakeIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={email} />
            </ListItem>
          ))}
          <ListItem button onClick={log}>
            <ListItemAvatar>
              <Avatar>
                <FakeIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="add account" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <FakeIcon />
            </ListItemIcon>
            <ListItemText primary="Inbox" />
          </ListItem>
        </List>
      </div>
      <DialogContent>
        <DialogContentText variant="body2" color="primary">
          Some text
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

const DividerTest = () => (
  <div>
    <Divider />
    <Divider light />
  </div>
);

const DrawerTest = () => {
  const open = {
    top: false,
    left: false,
    bottom: false,
    right: false,
  };
  return (
    <div>
      <Drawer variant="persistent" open={open.left} onClose={log} onClick={log}>
        List
      </Drawer>
      <Drawer
        variant="temporary"
        anchor="top"
        open={open.top}
        onClose={log}
        onClick={log}
        ModalProps={{
          hideBackdrop: true,
        }}
      >
        List
      </Drawer>
      <Drawer anchor="bottom" variant="temporary" open={open.bottom} onClose={log} onClick={log}>
        List
      </Drawer>
      <Drawer variant="persistent" anchor="right" open={open.right} onClose={log} onClick={log}>
        List
      </Drawer>
    </div>
  );
};

const SwipeableDrawerTest = () => {
  const open = {
    top: false,
    left: false,
    bottom: false,
    right: false,
  };
  return (
    <div>
      <SwipeableDrawer open={open.left} onClose={log} onClick={log} onOpen={log}>
        List
      </SwipeableDrawer>
      <SwipeableDrawer
        anchor="top"
        open={open.top}
        onClose={log}
        onClick={log}
        onOpen={log}
        ModalProps={{
          hideBackdrop: true,
        }}
      >
        List
      </SwipeableDrawer>
      <SwipeableDrawer anchor="bottom" open={open.bottom} onClose={log} onClick={log} onOpen={log}>
        List
      </SwipeableDrawer>
      <SwipeableDrawer
        variant="temporary"
        anchor="right"
        open={open.right}
        onClose={log}
        onClick={log}
        onOpen={log}
      >
        List
      </SwipeableDrawer>
    </div>
  );
};

const ExpansionPanelTest = () => (
  <div>
    <ExpansionPanel onChange={log} expanded disabled>
      <ExpansionPanelSummary />
      <ExpansionPanelDetails />
    </ExpansionPanel>
    <ExpansionPanel defaultExpanded>
      <ExpansionPanelSummary expandIcon={<FakeIcon />}>
        <Typography>...</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <Typography>...</Typography>
      </ExpansionPanelDetails>
      <ExpansionPanelActions>
        <Button size="small">Save</Button>
      </ExpansionPanelActions>
    </ExpansionPanel>
  </div>
);

const GridTest = () => (
  <Grid component={Paper} container>
    <Grid item xs={12}>
      ...
    </Grid>
    <Grid item sm={12}>
      ...
    </Grid>
    <Grid item xl={true}>
      ...
    </Grid>
    <Grid item style={{ color: 'red' }}>
      ...
    </Grid>
  </Grid>
);

const GridListTest = () => (
  <GridList cellHeight={160} cols={3} onClick={log}>
    <GridListTile cols={1} rows={4} onClick={log}>
      <img src="img.png" alt="alt text" />
    </GridListTile>
    ,
  </GridList>
);

const ListTest = () => (
  <List>
    {[0, 1, 2, 3].map(value => (
      <ListItem dense button selected={false} key={value} onClick={log}>
        <Checkbox checked={true} tabIndex={-1} disableRipple />
        <ListItemText primary={`Line item ${value + 1}`} />
        <ListItemSecondaryAction>
          <IconButton aria-label="Comments">
            <FakeIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ))}
    <ListItem ContainerComponent="div" ContainerProps={{ className: 'demo' }}>
      an item
    </ListItem>
  </List>
);

const MenuTest = () => {
  const anchorEl = document.getElementById('foo')!;
  const options = [
    'Show all notification content',
    'Hide sensitive notification content',
    'Hide all notification content',
  ];

  return (
    <Menu
      id="lock-menu"
      anchorEl={anchorEl}
      open={true}
      onClose={log}
      PopoverClasses={{ paper: 'foo' }}
    >
      {options.map((option, index) => (
        <MenuItem key={option} selected={false} onClick={log}>
          {option}
        </MenuItem>
      ))}
    </Menu>
  );
};

const PaperTest = () => (
  <Paper elevation={4}>
    <Typography variant="headline" component="h3">
      This is a sheet of paper.
    </Typography>
    <Typography variant="body1" component="p">
      Paper can be used to build surface or other elements for your application.
    </Typography>
  </Paper>
);

const CircularProgessTest = () => (
  <div>
    <CircularProgress />
    <CircularProgress size={50} />
    <CircularProgress color="secondary" />
    <CircularProgress color="secondary" size={50} />
  </div>
);

const LinearProgressTest = () => (
  <div>
    <LinearProgress variant="determinate" value={12} />
    <LinearProgress color="secondary" variant="determinate" value={76} />
  </div>
);

const SelectionControlTest = () => {
  const state = {
    checkedA: true,
    checkedB: false,
    checkedF: true,
  };

  const handleChange = (name: string) => (event: React.SyntheticEvent<any>, checked: boolean) =>
    log({ [name]: checked });

  return (
    <FormGroup row>
      <FormControlLabel
        control={
          <Checkbox checked={state.checkedA} onChange={handleChange('checkedA')} value="checkedA" />
        }
        label="Option A"
      />
      <FormControlLabel
        control={
          <Checkbox checked={state.checkedB} onChange={handleChange('checkedB')} value="checkedB" />
        }
        label="Option B"
      />
      <FormControlLabel control={<Checkbox value="checkedC" />} label="Option C" />
      <FormControlLabel disabled control={<Checkbox value="checkedD" />} label="Disabled" />
      <FormControlLabel disabled control={<Checkbox checked value="checkedE" />} label="Disabled" />
      <FormControlLabel
        disabled
        control={<Checkbox checked value="checkedE" indeterminate />}
        label="Indeterminate"
      />
      <FormControlLabel
        control={<Checkbox checked={true} onChange={handleChange('checkedF')} value="checkedF" />}
        label="Custom color"
      />
    </FormGroup>
  );
};

const SwitchTest = () => {
  const state = {
    checkedA: true,
    checkedB: false,
    checkedE: true,
  };
  const handleChange = (name: string) => (event: React.SyntheticEvent<any>, checked: boolean) =>
    log({ [name]: checked });

  return (
    <div>
      <Switch checked={state.checkedA} onChange={handleChange('checkedA')} aria-label="checkedA" />
      <Switch checked={state.checkedB} onChange={handleChange('checkedB')} aria-label="checkedB" />
      <Switch checked={false} aria-label="checkedC" disabled />
      <Switch checked aria-label="checkedD" disabled />
      <Switch checked={state.checkedE} onChange={handleChange('checkedE')} aria-label="checkedD" />
    </div>
  );
};

const SnackbarTest = () => (
  <div>
    <Button onClick={log}>Open simple snackbar</Button>
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={true}
      autoHideDuration={6e3}
      onClose={log}
      ContentProps={
        {
          // 'aria-describedby': 'message-id',
          // ^ will work once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22582 is merged.
        }
      }
      message={<span id="message-id">Note archived</span>}
      action={[
        <Button key="undo" color="secondary" size="small" onClick={log}>
          UNDO
        </Button>,
        <IconButton key="close" aria-label="Close" color="inherit" onClick={log}>
          <FakeIcon />
        </IconButton>,
      ]}
    />
  </div>
);

const SnackbarContentTest = () => {
  const action = (
    <Button color="secondary" size="small">
      lorem ipsum dolorem
    </Button>
  );
  return (
    <div>
      <SnackbarContent message="I love snacks." action={action} />
      <SnackbarContent
        message={
          'I love candy. I love cookies. I love cupcakes. \
          I love cheesecake. I love chocolate.'
        }
      />
      <SnackbarContent message="I love candy. I love cookies. I love cupcakes." action={action} />
      <SnackbarContent
        message={
          'I love candy. I love cookies. I love cupcakes. \
          I love cheesecake. I love chocolate.'
        }
        action={action}
      />
    </div>
  );
};

const StepperTest = () =>
  class DotsMobileStepper extends React.Component<{
    classes: { root: string };
  }> {
    state = {
      activeStep: 0,
    };

    handleNext = () => {
      this.setState({
        activeStep: this.state.activeStep + 1,
      });
    };

    handleBack = () => {
      this.setState({
        activeStep: this.state.activeStep - 1,
      });
    };

    render() {
      const classes = this.props.classes;
      const defaultProps = {
        steps: 2,
        nextButton: <Button>Next</Button>,
        backButton: <Button>Back</Button>,
      };
      return (
        <MobileStepper
          variant="dots"
          steps={6}
          position="static"
          activeStep={this.state.activeStep}
          className={classes.root}
          {...defaultProps}
        />
      );
    }
  };

const TableTest = () => {
  const styles = (theme: Theme) => {
    const backgroundColor: string = theme.palette.secondary.light;
    return createStyles({
      paper: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
        backgroundColor,
        overflowX: 'auto',
      },
    });
  };

  let id = 0;
  function createData(name: string, calories: number, fat: number, carbs: number, protein: number) {
    id += 1;
    return { id, name, calories, fat, carbs, protein };
  }

  const data = [
    createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
    createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
    createData('Eclair', 262, 16.0, 24, 6.0),
    createData('Cupcake', 305, 3.7, 67, 4.3),
    createData('Gingerbread', 356, 16.0, 49, 3.9),
  ];

  function BasicTable(props: WithStyles<typeof styles>) {
    const classes = props.classes;

    return (
      <Paper className={classes.paper}>
        <Table>
          <TableHead classes={{ root: 'foo' }}>
            <TableRow>
              <TableCell>Dessert (100g serving)</TableCell>
              <TableCell numeric>Calories</TableCell>
              <TableCell numeric>Fat (g)</TableCell>
              <TableCell numeric>Carbs (g)</TableCell>
              <TableCell numeric>Protein (g)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(n => {
              return (
                <TableRow key={n.id}>
                  <TableCell>{n.name}</TableCell>
                  <TableCell numeric>{n.calories}</TableCell>
                  <TableCell numeric>{n.fat}</TableCell>
                  <TableCell numeric>{n.carbs}</TableCell>
                  <TableCell numeric>{n.protein}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                count={5}
                rowsPerPage={2}
                page={1}
                onChangePage={() => {}}
                onChangeRowsPerPage={event => log({ rowsPerPage: event.target.value })}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </Paper>
    );
  }

  return withStyles(styles)(BasicTable);
};

const TabsTest = () => {
  const TabContainer: React.SFC = props => <div style={{ padding: 20 }}>{props.children}</div>;

  type ClassKey = 'root' | 'button';

  const styles: StyleRulesCallback<ClassKey> = theme => ({
    root: {
      flexGrow: 1,
      marginTop: theme.spacing.unit * 3,
      backgroundColor: theme.palette.background.paper,
    },
    button: {
      display: 'flex',
    },
  });

  class BasicTabs extends React.Component<WithStyles<typeof styles>> {
    state = {
      value: 0,
    };

    handleChange = (event: React.SyntheticEvent<any>, value: number) => {
      this.setState({ value });
    };

    render() {
      const classes = this.props.classes;

      return (
        <div className={classes.root}>
          <AppBar position="static">
            <Tabs value={this.state.value} onChange={this.handleChange}>
              <Tab label="Item One" />
              <Tab label="Item Two" />
              <Tab label="Item Three" />
            </Tabs>
          </AppBar>
          {this.state.value === 0 && <TabContainer>{'Item One'}</TabContainer>}
          {this.state.value === 1 && <TabContainer>{'Item Two'}</TabContainer>}
          {this.state.value === 2 && <TabContainer>{'Item Three'}</TabContainer>}
        </div>
      );
    }
  }

  return withStyles(styles)(BasicTabs);
};

const TextFieldTest = () => (
  <div>
    <TextField id="name" label="Name" value={'Alice'} />
    <TextField id="name" label={<strong>Name</strong>} value={'Alice'} />
    <TextField
      id="name"
      label="Name"
      value={'Alice'}
      onChange={event => log({ name: event.currentTarget.value })}
    />
    <TextField id="name" label="Name" value={'Alice'} InputProps={{ classes: { root: 'foo' } }} />
    <TextField
      type="number"
      inputProps={{
        min: '0',
        max: '10',
        step: '1',
        style: {
          // just a long css property to test autocompletion
          WebkitAnimationIterationCount: 0,
        },
      }}
    />
  </div>
);

const SelectTest = () => (
  <Select input={<Input />} value={10} onChange={e => log(e.currentTarget.value)}>
    <MenuItem value="">
      <em>None</em>
    </MenuItem>
    <MenuItem value={10}>Ten</MenuItem>
    <MenuItem value={20}>Twenty</MenuItem>
    <MenuItem value={30}>Thirty</MenuItem>
  </Select>
);

const InputAdornmentTest = () => <InputAdornment position="end" onClick={() => alert('Hello')} />;

const ResponsiveComponentTest = () => {
  const ResponsiveComponent = withMobileDialog({
    breakpoint: 'sm',
  })(({ children, width, fullScreen }) => (
    <div style={{ width, position: fullScreen ? 'fixed' : 'static' }}>{children}</div>
  ));
  <ResponsiveComponent />;

  const ResponsiveDialogComponent = withMobileDialog<DialogProps>()(Dialog);
};

const TooltipComponentTest = () => (
  <div>
    <Tooltip id="tooltip-top-start" title="Add" placement="top-start">
      <Button>top-start</Button>
    </Tooltip>
    <Tooltip id="tooltip-top-start" title={<strong>Add</strong>} placement="top-start">
      <Button>top-start</Button>
    </Tooltip>
  </div>
);

const ClickAwayListenerComponentTest = () => (
  <ClickAwayListener onClickAway={() => {}}>
    <div />
  </ClickAwayListener>
);

const TransitionTest = () => (
  <>
    <Fade in={false}>
      <div />
    </Fade>
    <Collapse in={false} mountOnEnter unmountOnExit timeout={200}>
      <div />
    </Collapse>
    <Grow in={false} timeout="auto" onEnter={() => {}}>
      <div />
    </Grow>
  </>
);

const BackdropTest = () => <Backdrop open onTouchMove={() => {}} />;

const PopoverTest = () => <Popover open ModalClasses={{ root: 'foo', hidden: 'bar' }} />;

const InputLabelTest = () => (
  <InputLabel
    FormLabelClasses={{
      root: 'foo',
      asterisk: 'foo',
      disabled: 'foo',
      error: 'foo',
      filled: 'foo',
      focused: 'foo',
      required: 'foo',
    }}
  />
);

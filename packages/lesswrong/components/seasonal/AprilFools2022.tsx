import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import FavoriteIcon from '@material-ui/icons/Favorite';
import deepOrange from '@material-ui/core/colors/deepOrange';
import yellow from '@material-ui/core/colors/yellow';
import green from '@material-ui/core/colors/green';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';

export const enableGoodHeartProject = new DatabasePublicSetting<boolean>('enableGoodHeartProject',false) // enables UI for 2022 LW April Fools

export const goodHeartStartDate = new Date("04/01/2022")

const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px"
  },
  column: {
    flex: "1",
    minWidth: 180
  },
  columnHeading: {
    ...theme.typography.commentStyle,
    ...theme.typography.body1,
    marginBottom: 4,
    display: "flex",
    alignItems: "center"
  },
  userRow: {
    display: "flex",
    ...theme.typography.commentStyle,
    background: "white",
    marginBottom: 2,
    alignItems: "center",
    boxShadow: theme.boxShadow
  },
  index: {
    width: 20,
    padding: 6,
    fontSize: 10,
    textAlign: "center",
    paddingLeft: 6,
    opacity: .65
  },
  username: {
    padding: 6,
  },
  goodHeartTokens: {
    marginLeft: 'auto',
    padding: 6,
  },
  goodestHeartIcon: {
    fontSize: 18,
    marginRight: 5,
    color: deepOrange[700]
  },  
  veryGoodHeartIcon: {
    fontSize: 18,
    marginRight: 5,
    color: yellow[900]
  },
  goodHeartIcon: {
    fontSize: 18,
    marginRight: 5,
    color: green[900]
  },
});

export const AprilFools2022 = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, SectionTitle, UsersNameDisplay, SectionFooter } = Components

  const {results} = useMulti({
      terms: {
        // view: 'usersByGoodHeartTokens'
      },
      collectionName: "Users",
      fragmentName: 'UsersProfile',
      enableTotal: false,
      limit: 15,
    });

  if (!enableGoodHeartProject.get()) return null

  return <SingleColumnSection>
    <SectionTitle title="The Good Heart Project"/>
    <div className={classes.row}>
      <div className={classes.column}>
        <div className={classes.columnHeading}>
          <FavoriteIcon className={classes.goodestHeartIcon}/>
          <span style={{color:deepOrange[700]}}>Goodest Hearts</span>
        </div>
        {results?.slice(0,5).map((user, i)=> <div key={user._id} className={classes.userRow} style={{color:deepOrange[700]}}>
          <span className={classes.index}>{ i+1 }</span>
          <span className={classes.username}><UsersNameDisplay user={user}/></span>
          <span className={classes.goodHeartTokens}>${user.goodHeartTokens || 0}</span>
        </div>)}
      </div>
      <div className={classes.column}>
        <div className={classes.columnHeading}>
          <FavoriteIcon className={classes.veryGoodHeartIcon}/>
          <span style={{color:yellow[900]}}>Good Hearts</span>
        </div>
        {results?.slice(5,10).map((user, i)=> <div key={user._id} className={classes.userRow} style={{color:yellow[900]}}>
          <span className={classes.index}>{ i+6 }</span>
          <span className={classes.username}><UsersNameDisplay user={user}/></span>
          <span className={classes.goodHeartTokens}>${user.goodHeartTokens || 0}</span>
        </div>)}
      </div>
      <div className={classes.column}>
        <div className={classes.columnHeading}>
          <FavoriteIcon className={classes.goodHeartIcon}/>
          <span style={{color:green[900]}}>Kinda Good Hearts</span>
        </div>
        {results?.slice(10,15).map((user, i)=> <div key={user._id} className={classes.userRow} style={{color:green[900]}}>
          <span className={classes.index}>{ i+11 }</span>
          <span className={classes.username}><UsersNameDisplay user={user}/></span>
          <span className={classes.goodHeartTokens}>${user.goodHeartTokens || 0}</span>
        </div>)}
      </div>
    </div>
    <SectionFooter>
      <Link to="/posts/mz3hwS4c9bc9EHAm9/replacing-karma-with-good-heart-tokens-worth-usd1"><em>What's this about?</em></Link>
    </SectionFooter>
  </SingleColumnSection>;
}

const AprilFools2022Component = registerComponent('AprilFools2022', AprilFools2022, {styles});

declare global {
  interface ComponentTypes {
    AprilFools2022: typeof AprilFools2022Component
  }
}


import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import FavoriteIcon from '@/lib/vendor/@material-ui/icons/src/Favorite';
import classNames from 'classnames';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import UsersNameDisplay from "../users/UsersNameDisplay";
import SectionFooter from "../common/SectionFooter";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const UsersProfileMultiQuery = gql(`
  query multiUserAprilFools2022Query($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

export const enableGoodHeartProject = new DatabasePublicSetting<boolean>('enableGoodHeartProject',false) // enables UI for 2022 LW April Fools

export const goodHeartStartDate = new Date("04/01/2022")

const styles = (theme: ThemeType) => ({
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
    background: theme.palette.panelBackground.default,
    marginBottom: 2,
    alignItems: "center",
    boxShadow: theme.palette.boxShadow.default,
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
    color: theme.palette.text.aprilFools.orange,
  },
  orange: {
    color: theme.palette.text.aprilFools.orange,
  },
  veryGoodHeartIcon: {
    fontSize: 18,
    marginRight: 5,
    color: theme.palette.text.aprilFools.yellow,
  },
  yellow: {
    color: theme.palette.text.aprilFools.yellow,
  },
  goodHeartIcon: {
    fontSize: 18,
    marginRight: 5,
    color: theme.palette.text.aprilFools.green,
  },
  green: {
    color: theme.palette.text.aprilFools.green,
  },
});

export const AprilFools2022 = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { data } = useQuery(UsersProfileMultiQuery, {
    variables: {
      selector: { default: {} },
      limit: 15,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.users?.results;

  if (!enableGoodHeartProject.get()) return null

  return <SingleColumnSection>
    <SectionTitle title="The Good Heart Project"/>
    <div className={classes.row}>
      <div className={classes.column}>
        <div className={classes.columnHeading}>
          <FavoriteIcon className={classes.goodestHeartIcon}/>
          <span className={classes.orange}>Goodest Hearts</span>
        </div>
        {results?.slice(0,5).map((user, i)=> <div key={user._id} className={classNames(classes.userRow, classes.orange)}>
          <span className={classes.index}>{ i+1 }</span>
          <span className={classes.username}><UsersNameDisplay user={user}/></span>
          <span className={classes.goodHeartTokens}>${user.goodHeartTokens || 0}</span>
        </div>)}
      </div>
      <div className={classes.column}>
        <div className={classes.columnHeading}>
          <FavoriteIcon className={classes.veryGoodHeartIcon}/>
          <span className={classes.yellow}>Good Hearts</span>
        </div>
        {results?.slice(5,10).map((user, i)=> <div key={user._id} className={classNames(classes.userRow, classes.yellow)}>
          <span className={classes.index}>{ i+6 }</span>
          <span className={classes.username}><UsersNameDisplay user={user}/></span>
          <span className={classes.goodHeartTokens}>${user.goodHeartTokens || 0}</span>
        </div>)}
      </div>
      <div className={classes.column}>
        <div className={classes.columnHeading}>
          <FavoriteIcon className={classes.goodHeartIcon}/>
          <span className={classes.green}>Kinda Good Hearts</span>
        </div>
        {results?.slice(10,15).map((user, i)=> <div key={user._id} className={classNames(classes.userRow, classes.green)}>
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

export default registerComponent('AprilFools2022', AprilFools2022, {styles});




import React, {useState} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useMulti } from '../../lib/crud/withMulti';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import { useQuery, gql } from '@apollo/client';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SectionTitle } from "../common/SectionTitle";
import { MenuItem } from "../common/Menus";
import { ContentStyles } from "../common/ContentStyles";
import { Loading } from "../vulcan-core/Loading";
import { FormatDate } from "../common/FormatDate";
import { UsersNameDisplay } from "../users/UsersNameDisplay";

const styles = (theme: ThemeType) => ({
  selectUser: {
    margin: 16,
  },
  userKeyDropdown: {
    marginRight: 8,
  },
  userInfoArea: {
    margin: 16,
    
    "& ul": {
      paddingInlineStart: "20px",
    },
  },
  ipAddressReputationLink: {
    color: theme.palette.primary.main,
    textDecoration: "underline",
  },
  closedListItem: {
    cursor: "pointer",
    listStyleType: "disclosure-closed",
  },
  openListItem: {
    listStyleType: "disclosure-open",
  },
  clickToReveal: {
    cursor: "pointer",
    color: theme.palette.primary.main,
    textDecoration: "underline",
  },
});

const accountIdentifierTypes = [
  { key: "slug", label: "User-slug" },
  { key: "userId", label: "User ID" },
  { key: "clientId", label: "Client ID" },
  { key: "ip", label: "IP Address" },
];

const ModerationAltAccountsInner = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  
  const { query } = useLocation();
  const { slug,clientId,userId,ip } = query;
  const {initialAccountIdentifierType, initialAccountIdentifier} = (
       (userId   ? {initialAccountIdentifierType: "userId",   initialAccountIdentifier: userId} : null)
    ?? (slug     ? {initialAccountIdentifierType: "slug",     initialAccountIdentifier: slug} : null)
    ?? (clientId ? {initialAccountIdentifierType: "clientId", initialAccountIdentifier: clientId} : null)
    ?? (ip       ? {initialAccountIdentifierType: "ip",       initialAccountIdentifier: ip} : null)
    ?? ({initialAccountIdentifierType: "slug", initialAccountIdentifier: ""})
  );
  const [startingIdentifierType,setStartingIdentifierType] = useState<string>(initialAccountIdentifierType);
  const [startingIdentifier,setStartingIdentifier] = useState(initialAccountIdentifier);

  if(!currentUser || !currentUser.isAdmin) {
    return <SingleColumnSection>
      You must be logged in as an admin to use this page.
    </SingleColumnSection>
  }
  
  return <SingleColumnSection>
    <SectionTitle title="Alt-Accounts Finder" />

    <ContentStyles contentType="comment">
      <p>This is a moderation tool for identifying users with alternate accounts,
      to help with investigating cases of suspected ban-evasion, sockpuppet
      downvoting, and similar issues.</p>

      <p><i>Please be conservative in your use of this tool.</i> The intended
      purpose is to identify users who are evading bans, or coordinating large
      numbers of accounts to vote abusively. Try to view the minimum amount of
      information necessary to confirm (or rule out) that an account is
      violating site rules, and only proceed look at identifying information
      after a rule-violation is confirmed. Mere criticism is not abusive
      behavior, even if it's wrong!</p>
      
      <p>Accounts that are linked by clientID logged in from the same browser,
      without clearing cookies in between; they are very unlikely to be different
      people (though it's possible if they have shared a device). Accounts linked
      by IP address are more likely to be different people; they could share an
      office, group house, or (less likely but still possible) an ISP or a VPN
      provider.</p>
    </ContentStyles>

    <div className={classes.selectUser}>
      <Select
        className={classes.userKeyDropdown}
        value={startingIdentifierType}
        onChange={ev => {
          setStartingIdentifierType(ev.target.value);
        }}
      >
        {accountIdentifierTypes.map(selection => <MenuItem
          key={selection.key}
          value={selection.key}
        >{selection.label}</MenuItem>)}
      </Select>
      <Input value={startingIdentifier} onChange={ev => {
        setStartingIdentifier(ev.currentTarget.value);
      }}/>
    </div>
    
    <div className={classes.userInfoArea}>
      {startingIdentifierType==="slug" && <AltAccountsNodeUserBySlug slug={startingIdentifier} classes={classes}/>}
      {startingIdentifierType==="userId" && <AltAccountsNodeUserByID userId={startingIdentifier} classes={classes}/>}
      {startingIdentifierType==="clientId" && <AltAccountsNodeClientID clientId={startingIdentifier} classes={classes}/>}
      {startingIdentifierType==="ip" && <AltAccountsNodeIPAddress ipAddress={startingIdentifier} classes={classes}/>}
    </div>
  </SingleColumnSection>
}

const AltAccountsNodeUserBySlug = ({slug, classes}: {
  slug: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {results,loading} = useMulti({
    collectionName: "Users",
    fragmentName: "UserAltAccountsFragment",
    terms: { view: "usersProfile", slug },
    skip: !slug,
  });
  const user = results?.[0];
  if (!slug) {
    return <ContentStyles contentType="comment"><i>Select a user to continue</i></ContentStyles>
  }
  if (loading) {
    return <Loading/>
  }
  if (!user) {
    return <ContentStyles contentType="comment">No users found with slug {slug}</ContentStyles>
  }
  
  return <div>
    <AltAccountsNodeUser user={user} classes={classes}/>
  </div>
}

const AltAccountsNodeUserByID = ({userId, classes}: {
  userId: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {document: user, loading} = useSingle({
    documentId: userId,
    collectionName: "Users",
    fragmentName: "UserAltAccountsFragment",
  });
  if (loading) return <Loading/>;
  if (!user) return <>{`Couldn't find user with ID ${userId}`}</>
  return <AltAccountsNodeUser user={user} classes={classes}/>
}

const AltAccountsNodeUser = ({user, classes}: {
  user: UserAltAccountsFragment,
  classes: ClassesType<typeof styles>,
}) => {
  const [expandedClientIDs, setExpandedClientIDs] = useState(false);
  const [expandedIPs, setExpandedIPs] = useState(false);

  return <div>
    <div><CensoredUserName user={user} classes={classes}/></div>
    
    <ul>
      <li>Vote count: {user.voteCount} (small downvotes: {user.smallDownvoteCount}; big downvotes: {user.bigDownvoteCount})</li>
      {expandedClientIDs
        ? <li className={classes.openListItem}>
            <div>Client IDs</div>
            <ul>
              {user.associatedClientIds.map(clientId => <li key={clientId.clientId}>
                <AltAccountsNodeClientID clientId={clientId.clientId!} classes={classes}/>
              </li>)}
            </ul>
          </li>
        : <li onClick={() => setExpandedClientIDs(true)} className={classes.closedListItem}>
            Client IDs: {user.associatedClientIds.map(clientId => clientId.clientId).join(", ")}
          </li>
      }
      {expandedIPs
        ? <li className={classes.openListItem}>
            <div>IP Addresses</div>
            <ul>
              {user.IPs.map(ip => <li key={ip}>
                <AltAccountsNodeIPAddress ipAddress={ip} classes={classes}/>
              </li>)}
            </ul>
          </li>
        : <li onClick={() => setExpandedIPs(true)} className={classes.closedListItem}>
            IP addresses: {user.IPs.length}x (click to expand)
          </li>
      }
    </ul>
  </div>
}

const AltAccountsNodeClientID = ({clientId, classes}: {
  clientId: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded,setExpanded] = useState(false);
  
  const { results, loading } = useMulti({
    collectionName: "ClientIds",
    fragmentName: "ModeratorClientIDInfo",
    terms: {
      view: "getClientId",
      clientId
    },
    skip: !clientId,
  });
  const clientIdInfo = (results?.length===1 ? results[0] : null);
  
  return <div>
    ClientID {clientId}
    {loading && <Loading/>}
    {clientIdInfo && <div>
      <div>First seen referrer: {clientIdInfo.firstSeenReferrer}</div>
      <div>First seen landing page: {clientIdInfo.firstSeenLandingPage}</div>
      <div>First seen: <FormatDate date={clientIdInfo.createdAt!}/></div>
      <ul>
        {expanded
          ? <li className={classes.openListItem}>
              <div>Associated users</div>
              <ul>
                {clientIdInfo.users.map(u => <li key={u._id}>
                  <AltAccountsNodeUserByID userId={u._id} classes={classes}/>
                </li>)}
              </ul>
            </li>
          : <li className={classes.closedListItem} onClick={() => setExpanded(true)}>
              {`Associated users: ${clientIdInfo.users.length}x (click to reveal)`}
            </li>
        }
      </ul>
    </div>}
  </div>
}

const AltAccountsNodeIPAddress = ({ipAddress, classes}: {
  ipAddress: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded,setExpanded] = useState(false);
  const {data, loading} = useQuery(gql`
    query ModeratorIPAddressInfo($ipAddress: String!) {
      moderatorViewIPAddress(ipAddress: $ipAddress) {
        ip
        userIds
      }
    }
  `, {
    variables: {ipAddress}
  });
  
  if (loading || !data?.moderatorViewIPAddress)
    return <Loading/>

  const {userIds} = data.moderatorViewIPAddress;
  const ipReputationCheckUrl = `https://www.ipqualityscore.com/free-ip-lookup-proxy-vpn-test/lookup/${ipAddress}`;

  return <div>
    <div>IP Address {ipAddress}</div>
    <div>
      <a target="_blank" rel="noreferrer" href={ipReputationCheckUrl} className={classes.ipAddressReputationLink}>
        Check IP address reputation
      </a>
    </div>
    
    <ul>
      {expanded
        ? <li className={classes.openListItem}>
            <div>Associated users</div>
            <ul>
              {userIds.map((userId: string) => <li key={userId}>
                <AltAccountsNodeUserByID userId={userId} classes={classes}/>
              </li>)}
            </ul>
          </li>
        : <li className={classes.closedListItem} onClick={() => setExpanded(true)}>
            {`${userIds.length} users (click to reveal)`}
          </li>
      }
    </ul>
  </div>
}

const CensoredUserName = ({user, classes}: {
  user: UserAltAccountsFragment,
  classes: ClassesType<typeof styles>,
}) => {
  const [revealName,setRevealName] = useState(false);
  
  if (revealName) {
    return <UsersNameDisplay user={user} color={true}/>
  } else {
    return <span className={classes.clickToReveal} onClick={() => setRevealName(true)}>{user._id}</span>
  }
}

export const ModerationAltAccounts = registerComponent('ModerationAltAccounts', ModerationAltAccountsInner, {styles});





import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useMulti } from '../../lib/crud/withMulti';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import { useQuery, gql } from '@apollo/client';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType): JssStyles => ({
  selectUser: {
    margin: 16,
  },
  userKeyDropdown: {
    marginRight: 8,
  },
  userInfoArea: {
    margin: 16,
  },
});

const accountIdentifierTypes = [
  { key: "slug", label: "User-slug" },
  { key: "userId", label: "User ID" },
  { key: "clientId", label: "Client ID" },
  { key: "ip", label: "IP Address" },
];

const ModerationAltAccounts = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, SectionTitle, ContentStyles } = Components;
  const currentUser = useCurrentUser();
  
  const { params } = useLocation();
  const { slug,clientId,userId,ip } = params;
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
  classes: ClassesType,
}) => {
  const {results,loading} = useMulti({
    collectionName: "Users",
    fragmentName: "UserAltAccountsFragment",
    terms: { view: "usersProfile", slug },
    skip: !slug,
  });
  const user = results?.[0];
  
  const { ContentStyles, Loading } = Components;
  
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
  classes: ClassesType,
}) => {
  const {document: user, loading} = useSingle({
    documentId: userId,
    collectionName: "Users",
    fragmentName: "UsersProfile",
  });
  const { Loading } = Components;
  
  if (loading) return <Loading/>;
  if (!user) return <>{`Couldn't find user with ID ${userId}`}</>
  return <AltAccountsNodeUser user={user} classes={classes}/>
}

const AltAccountsNodeUser = ({user, classes}: {
  user: UserAltAccountsFragment,
  classes: ClassesType,
}) => {
  const { UsersNameDisplay } = Components;
  const [expandedClientIDs, setExpandedClientIDs] = useState(false);
  const [expandedIPs, setExpandedIPs] = useState(false);

  return <div>
    <div><UsersNameDisplay user={user}/></div>
    
    <ul>
      {expandedClientIDs
        ? user.associatedClientIds.map(clientId => <li key={clientId.clientId}>
            <AltAccountsNodeClientID clientId={clientId.clientId} classes={classes}/>
          </li>)
        : <li onClick={() => setExpandedClientIDs(true)}>
            Client IDs: {user.associatedClientIds.map(clientId => clientId.clientId).join(", ")}
          </li>
      }
      {expandedIPs
        ? user.IPs.map(ip => <li key={ip}>
            <AltAccountsNodeIPAddress ipAddress={ip} classes={classes}/>
          </li>)
        : <li onClick={() => setExpandedIPs(true)}>
            IP addresses: {user.IPs.length}x (click to expand)
          </li>
      }
    </ul>
  </div>
}

const AltAccountsNodeClientID = ({clientId, classes}: {
  clientId: string,
  classes: ClassesType,
}) => {
  const { Loading, FormatDate } = Components;
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
  
  return <div onClick={() => setExpanded(true)}>
    ClientID {clientId}
    {loading && <Loading/>}
    {clientIdInfo && <div>
      <div>First seen referrer: {clientIdInfo.firstSeenReferrer}</div>
      <div>First seen landing page: {clientIdInfo.firstSeenLandingPage}</div>
      <div>First seen: <FormatDate date={clientIdInfo.createdAt}/></div>
      <div>
        {"Associated users: "}
        {expanded
          ? <ul>
              {clientIdInfo.users.map(u => <li key={u._id}>
                <AltAccountsNodeUserByID userId={u._id} classes={classes}/>
              </li>)}
            </ul>
          : `${clientIdInfo.users.length}x (click to reveal)`
        }
      </div>
    </div>}
  </div>
}

const AltAccountsNodeIPAddress = ({ipAddress, classes}: {
  ipAddress: string,
  classes: ClassesType,
}) => {
  const { Loading } = Components;
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

  return <div onClick={() => setExpanded(true)}>
    IP Address {ipAddress} (<a target="_blank" rel="noreferrer" href={ipReputationCheckUrl}
    >check reputation</a>)
    
    <div>
      <div>Associated user IDs:</div>
      {expanded
        ? <ul>
            {userIds.map((userId: string) =>
              <li key={userId}>
                <AltAccountsNodeUserByID userId={userId} classes={classes}/>
              </li>
            )}
          </ul>
        : `${userIds.length} users (click to reveal)`
      }
    </div>
  </div>
}

const ModerationAltAccountsComponent = registerComponent('ModerationAltAccounts', ModerationAltAccounts, {styles});

declare global {
  interface ComponentTypes {
    ModerationAltAccounts: typeof ModerationAltAccountsComponent
  }
}



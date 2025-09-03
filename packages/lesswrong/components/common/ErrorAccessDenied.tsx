import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from './withUser';
import LoginForm from "../users/LoginForm";
import SingleColumnSection from "./SingleColumnSection";
import { Typography } from "./Typography";
import { StatusCodeSetter } from '../next/StatusCodeSetter';

const styles = (theme: ThemeType) => ({
  root: theme.isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 16,
      fontWeight: 500,
      lineHeight: '26px',
      textWrap: 'pretty',
      marginTop: 30
    }
    :{},
});

/**
 * Show a simple "you don't have access" message if the user is logged in,
 * or a "please log in" message if the user is logged out.
 *
 * Most of the time, we use this when a page is meant to be accessed by only a subset of
 * logged in users, so by default this prompts the user to log in if they are logged out.
 *
 * However, for pages that are normally meant to be publicly accessible (like the post page),
 * we skip the login prompt and just display the "you don't have access" message.
 */
const ErrorAccessDenied = ({explanation, skipLoginPrompt, classes}: {
  explanation?: string,
  skipLoginPrompt?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  
  if (currentUser || skipLoginPrompt) {
    const message = `Sorry, you don't have access to this page.${(explanation ? ` ${explanation}` : "")}`
    return <>
      <StatusCodeSetter status={403}/>
      <SingleColumnSection>
        <div className={classes.root}>{message}</div>
      </SingleColumnSection>
    </>
  } else {
    return <>
      <StatusCodeSetter status={403}/>
      <SingleColumnSection>
        <Typography variant='body1' className={classes.root}>
          Please log in to access this page.
        </Typography>
        <LoginForm startingState='login'/>
      </SingleColumnSection>
    </>
  }
}

export default registerComponent(
  "ErrorAccessDenied",
  ErrorAccessDenied,
  {styles},
);



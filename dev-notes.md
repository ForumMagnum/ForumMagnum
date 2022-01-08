
### Steps to First Successful Deploy
0. Attempting to use Dockerfile to build and deploy (which uses `yarn run production`):
1. The first failure when attempting to deploy was in `runProduction.sh`, where I didn't specify any github credentials for the settings file
    a. To resolve this issue, I need to specify a valid settings file to the `build.js` script. EA & LW seem to do this by cloning an encrypted Credential file stored publicly on github. Which is encrypted using `$TRANSCRYPT_SECRET`
    b. For the purpose of testing, I'm just going to use the `settings.json` file. All required env variables will be put in `.env.example`
    questions:
        - What is the structure of the ForumCredentials repository, and what is the structure of the `.env` file (or environment config in general) used by most developers?
2. Another error was no `MONGO_URL` in the environment, but this is pretty easy to solve, just add one.
    a. we added `dotEnv` to load environment variables locally
3. Another error might be that ports 3000 and 3001 were not exposed?
4. Deploy successful!

### Steps to removing obvious site errors
1. "GraphQLError: Field error: value is not an instance of Date", on the RecentDiscussionFeed, which is a MixedTypeFeed, and requires a 'cutoff'. The 'cutoff' value does not seem to be a Date, which is required by the schema?
2. Investigating further:
    - It appears that the RecentDiscussionFeed Query returns data and an error (the above error), but for some reason, when using breakpoint, the data from the `useQuery` call is not actually given to the MixedFeedType component, it has `error` but data remains undefined. This doesn't make sense because when executing the same API call against the server directly (using GraphiQL), both data and error are returned.
    - MixedTypeFeed, line 121
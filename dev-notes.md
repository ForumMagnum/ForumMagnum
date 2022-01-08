
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
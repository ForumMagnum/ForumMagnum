
### Steps to First Successful Deploy
1. The first failure when attempting to deploy was in `runProduction.sh`, where I didn't specify any github credentials for the settings file
    a. To resolve this issue, I need to specify a valid settings file to the `build.js` script. EA & LW seem to do this by cloning an encrypted Credential file stored publicly on github. Which is encrypted using `$TRANSCRYPT_SECRET`
    b. For the purpose of testing, I'm just going to use the `settings.json` file. All required env variables will be put in `.env.example`
    questions:
        - What is the structure of the ForumCredentials repository, and what is the structure of the `.env` file (or environment config in general) used by most developers?
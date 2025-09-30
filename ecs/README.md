If you need to update the nightly prod > dev database dump, the logic is in the refresh_dev.sh script.  Instructions:
1. Update the script.
2. (Pre-reqs: make sure you have the `aws` cli installed, with an access token sufficient to do ~all the things.  Also make sure you have `docker` installed.)
3. Run `./ecs/push_refresh_script_update.sh` (if you're in the repo root directory).  This will rebuild the container with the script and push it to ECR, where it'll get picked up on the next scheduled nightly run.

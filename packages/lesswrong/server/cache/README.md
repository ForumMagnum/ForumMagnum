# Caching in CloudFront

It is possible to set up CloudFront (a CDN) to cache post pages for logged out users. In principle this could be extended quite easily to other CDNs, but currently the implementation is quite coupled to CloudFront specifically.

## How to set up CloudFront in general (not for caching)

Assuming you are using Elastic Beanstalk to run your servers, you can set up CloudFront as a proxy (to just pass through requests with no caching) as follows:
1. Click "Create distribution" in [CloudFront](https://us-east-1.console.aws.amazon.com/cloudfront/v4/home), fill in the form like so:
  - Origin settings:
    - Origin domain: This is the domain of your elastic beanstalk environment (like xxxxxxx.us-east-1.elasticbeanstalk.com)
    - Origin path: Leave blank
    - Name: Whatever you want
    - Enable [Origin Shield](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html): Yes (very important, this makes caching global rather than by region which will greatly increase the hit rate once caching is set up)
    - Origin Shield region: Same as your Elastic Beanstalk environment
  - Default cache behavior settings:
    - Compress objects automatically: Doesn't matter. CloudFront won't recompress gzipped objects as brotli so this feature isn't that useful
    - Viewer protocol policy: "Redirect HTTP to HTTPS" (others may also work)
    - Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
    - Restrict viewer access: no
    - Cache policy: CachingDisabled
    - Origin request policy: AllViewer
  - ...leave all other settings as is apart from:
    - Custom SSL certificate: Set this to the one associated with your Elastic Beanstalk environment
    - Standard logging: Turn this on if you want to set up [monitoring](#monitoring), you could leave this until later though. Follow the instructions in the monitoring section for how exactly to set it up
2. The "Distribution domain name" in CloudFront should now point to your Elastic Beanstalk environment, it may not actually be accessible yet due to https issues, but setting it as the entry point for the live site should fix this (because then the Origin header will match what is in the SSL certificate). Set the target of the CNAME/A record to the "Distribution domain name" to use the CloudFront distribution for the live site. Once this has updated you should be able to load the site as normal and see headers like "X-Cache" and "X-Amz-Cf-Id" in the response

## How to enable caching of post pages

1. Set `swrCaching.enabled` to true. This sets the appropriate "Cache-Control" header (for logged out users) and changes the posts page to be more cache friendly (render relative dates as absolute)
2. Add "Behaviours" in CloudFront to make it start using this header to cache post pages:
  - A behaviour for the `/posts/*` route. This requires a cache policy that uses `loginToken` as part of the cache key, and also an edge function to handle an edge case (see [here](#cache-policy--edge-function-for-posts))
  - A behaviour for `/js/bundle.js` and `/allStyles` to cache each version with a long TTL, this means cached pages from previous deployments can get a matching bundle and stylesheet (see [here](#cache-policy-for-jsbundlejs-and-allstyles))
3. For handling invalidations, create an IAM user that has permission to create invalidations for the CloudFront distribution (see [here](#policy-for-iam-user-to-create-invalidations-in-cloudfront) for the policy required). Then set the `swrCaching.accessKeyId` (IAM user), `swrCaching.secretAccessKey` (IAM user), and `swrCaching.distributionId` (CloudFront distribution) database settings in your ForumMagnum instance

### Cache policy + edge function for /posts

Use a cache policy with the following settings:
- Minimum TTL: 0
- Maximum TTL: 31536000 (just needs to be higher than 86400)
- Default TTL: 0
- Headers: [cache-group, accept-encoding] (used for the edge case below)
- Query strings: All
- Include the following cookies: [loginToken] (this makes it cache for logged out but not logged in, very important)

There is an edge case where SlackBot gets a slightly different version of the page. To make sure this version doesn't get served to real users you can add a "Viewer request" edge function that adds a cache-group header for that user agent:

```javascript
function handler(event) {
    const request = event.request;
    const headers = request.headers;

    const userAgent = headers['user-agent'] ? headers['user-agent'].value : null;
    const isSlackBot = userAgent && userAgent.startsWith("Slackbot-LinkExpanding");

    if (isSlackBot) {
        headers['cache-group'] = { value: 'slackbot' };
    } else {
        headers['cache-group'] = { value: 'default' };
    }

    return request;
}
```

### Cache policy for `/js/bundle.js` and `/allStyles`

Use a cache policy with the following settings:
- Minimum TTL: 1
- Maximum TTL: 31536000
- Default TTL: 86400
- Headers: [accept-encoding] (used for the edge case below)
- Query strings: All
- Include the following cookies: None

IMPORTANT: You also need to set a "Response headers policy" that removes `Set-Cookie` headers, so that the same clientId cookie doesn't get set for multiple users. It just needs to have:
- Remove headers: Set-Cookie

### Policy for IAM user to create invalidations in CloudFront

You may want to get a broader policy that just allows `cloudfront:CreateInvalidation` for everything, but attaching this policy to the user will work to restrict to the specific distribution:

```
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "VisualEditor0",
			"Effect": "Allow",
			"Action": [
				"cloudfront:ListInvalidations",
				"cloudfront:GetInvalidation",
				"cloudfront:CreateInvalidation"
			],
			"Resource": "arn:aws:cloudfront::[AWS account id]:distribution/[CloudFront distribution id]"
		}
	]
}
```

## Monitoring

To monitor the cache hit rate, you can:
- Enable Standard logging (which will create access logs in an S3 bucket)
- Set up Amazon Athena to query these logs (this makes it possible to query them with SQL)
- Query them in [Hex](https://hex.tech/) if you have that set up

_Note: I (Will H) did try fairly hard to capture the hit rate directly in our standard analytics, but because requests don't necessarily hit our servers and the client doesn't have access to the X-Cache header I concluded it was impossible_

### Enabling standard logging

Follow the [docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html) from AWS. When creating the bucket you will need to enable [ACLs](https://stackoverflow.com/questions/47815526/s3-bucket-policy-vs-access-control-list).

### Setting up Amazon Athena

Follow the [docs](https://docs.aws.amazon.com/athena/latest/ug/cloudfront-logs.html) from AWS on this as well. When it is set up you can try running this query to check it is working as expected (gets the hit rate on posts):

```sql
SELECT
    date,
    COUNT(*) AS total_requests,
    SUM(CASE WHEN x_edge_result_type = 'Hit' THEN 1 ELSE 0 END) AS cache_hits,
    SUM(CASE WHEN x_edge_result_type = 'RefreshHit' THEN 1 ELSE 0 END) AS cache_refresh_hits,
    SUM(CASE WHEN x_edge_result_type = 'Miss' THEN 1 ELSE 0 END) AS cache_misses,
    SUM(CASE WHEN x_edge_result_type = 'Redirect' OR x_edge_result_type = 'Error' THEN 1 ELSE 0 END) AS error_or_redirect,
    SUM(CASE WHEN x_edge_result_type = 'Hit' OR x_edge_result_type = 'RefreshHit' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS hit_rate_percentage
FROM
    -- This is what the table is called for the EA Forum
    "AwsDataCatalog".default.cloudfront_prod_standard_logs
WHERE
    cs_uri_stem LIKE '/posts/%/_%'
GROUP BY
    date
ORDER BY
    date DESC;
```

### Connecting Amazon Athena to Hex

To connect Hex to Athena you will need to:
- Create another IAM user in AWS that has the AmazonAthenaFullAccess and AmazonS3FullAccess policies (these are AWS managed policies that you can select)
- Create a data source in Hex for the CloudFront logs with the following settings (Settings > Data sources > "+ Connection" > "Amazon Athena"):
  - Host and port: athena.us-east-1.amazonaws.com, 443 (edit as applicable for AWS region)
  - S3 output path: s3://output-path-that-was-created-in-athena-setup/ (NOT the CloudFront logs path)
  - AWS access key ID: [From the user you created]
  - AWS secret access key: [From the user you created]

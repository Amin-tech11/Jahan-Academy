# GA4 reporting inside the admin panel

The “آمار بازدید سایت” section reads GA4 Property **558971968** through the Google
Analytics Data API. The public measurement ID `G-54XY5B8GLK` collects events; it
does not grant access to reports. The existing site tracking remains unchanged.

## Google configuration

1. Create a dedicated Google Cloud project or select the project's approved Cloud project.
2. Enable **Google Analytics Data API**.
3. Under **IAM & Admin → Service Accounts**, create `jahan-analytics-dashboard`.
   Do not give it project Owner or Editor roles. It does not need domain-wide delegation.
4. In Analytics, select Property **558971968**, then **Admin → Property access
   management → Add users**. Add the service account's email with **Viewer** access.
5. Create a JSON key under the service account's **Keys** tab. Store it outside Git
   and outside any public web folder. Do not paste it into chat, frontend variables,
   screenshots, logs, API responses or documentation. Treat the JSON as a private credential.

## Local backend

Set these private backend environment variables before starting the API:

```dotenv
JAHAN_ANALYTICS_ENABLED=true
JAHAN_ANALYTICS_PROPERTY_ID=558971968
JAHAN_ANALYTICS_CREDENTIALS_FILE=F:/DevData/Secrets/jahan-ga4-service-account.json
```

The API also needs its existing Redis and database services. Restart the API after
changing environment variables, sign into `http://localhost:5000/admin` as a global
super administrator, and select **آمار بازدید سایت**. Use **به‌روزرسانی** to check
the connection. No migration is required. Disabled configuration shows a setup
state without fabricated metrics; a missing or invalid configured key shows an error.

## Production

Deploy only an approved and CI-verified `main` version. The backend's read-only
bind mount maps `/opt/jahan-academy-test/analytics-secrets` to
`/run/secrets/google-analytics`; the frontend and migration container do not receive
this mount. Runtime preparation creates the private directory with mode `0700`.

Install the dedicated JSON as
`/opt/jahan-academy-test/analytics-secrets/service-account.json` with mode `0600`.
The API image runs as the non-root `jahan` user: set the directory and file owner
to that container user's numeric UID/GID before enabling reporting. Keep the
directory at `0700`; do not broaden it to world-readable to solve permissions.
For the existing production container, the operator can determine and apply ownership:

```sh
api_uid=$(docker exec jahan-academy-test-backend-1 id -u)
api_gid=$(docker exec jahan-academy-test-backend-1 id -g)
test "$api_uid" -gt 0
chown "$api_uid:$api_gid" /opt/jahan-academy-test/analytics-secrets
chown "$api_uid:$api_gid" /opt/jahan-academy-test/analytics-secrets/service-account.json
chmod 700 /opt/jahan-academy-test/analytics-secrets
chmod 600 /opt/jahan-academy-test/analytics-secrets/service-account.json
```

Configure `runtime.env` privately:

```dotenv
JAHAN_ANALYTICS_ENABLED=true
JAHAN_ANALYTICS_PROPERTY_ID=558971968
JAHAN_ANALYTICS_CREDENTIALS_FILE=/run/secrets/google-analytics/service-account.json
```

Restart only the isolated Jahan Academy backend to apply these variables. Do not
modify the unrelated Niyayesh services. Keep the key out of application images and
release archives. Credential delivery and activation are separate from code deployment;
an empty mount is safe when reporting is disabled. To disable reporting, set
`JAHAN_ANALYTICS_ENABLED=false` and restart the API. Revoke and replace the Google
key if it is exposed; never reuse a backup/Sheets account for this integration.

## Measurements, access and freshness

- Only authenticated global super administrators can use either reporting endpoint.
  Support, consultant and content-editor accounts cannot gain this access through
  a panel-section assignment. The public site never receives reporting credentials.
- `/api/v1/reporting/analytics?days=7|28|90` returns active users, new users, sessions,
  page views and engagement rate, with an equally long preceding comparison period.
  Both periods exclude today and use GA4's Property-local dates (`yesterday` and
  relative day ranges). The response reports Google's timezone and retrieval time.
- Daily data is reported as returned by Google, without inventing missing dates.
  Period users are Google's distinct period totals, never a sum of daily users.
  Engagement rate is the period-level Google metric, not an average of daily rates.
- Channels use `sessionDefaultChannelGroup` and sessions; devices also use sessions.
  Top pages use `pagePath` and views. Query strings, user IDs and custom user
  dimensions are not requested. Top-ten lists are not substitutes for period totals.
- `/api/v1/reporting/analytics/realtime` reports Google's active users over the most
  recent 30 minutes; it is independent of the historical period selector.
- Redis stores aggregate reports for 300 seconds and realtime for 60 seconds.
  Distributed short-lived locks prevent concurrent viewers from duplicating refreshes.
  Cache failure fails closed rather than issuing unbounded Google requests.
- Polling pauses in background tabs. Each successful report shows its retrieval
  timestamp; pressing refresh can return the same cached report. Failed requests
  are errors, never zero visits. Google thresholding/grouping/sampling flags are
  surfaced. Data may be delayed or reduced by consent, blockers and GA processing.
- OAuth uses only `https://www.googleapis.com/auth/analytics.readonly`. The issuer
  and signing key come from the private file; token and report endpoint origins are
  fixed in server code. A credential file cannot redirect token requests elsewhere.

## Verification

Unit and isolated HTTP tests cover identity authorization, bounded periods, fixed
endpoints/scopes, comparison dates, distinct-user totals, cache TTLs/locks, missing
credentials and upstream errors. Browser tests use intercepted synthetic report
fixtures only for UI verification; those fixtures never populate live dashboards.
Actual connection verification requires the separately provisioned Viewer account.

Official references:

- https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart
- https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/batchRunReports
- https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runRealtimeReport
- https://developers.google.com/analytics/devguides/reporting/data/v1/quotas

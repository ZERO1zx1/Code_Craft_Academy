# Gmail SMTP learner notification setup

CodeCraft Academy sends learner notification e-mails only when the learner has enabled **E-mail мэдэгдэл** in `/notifications`. The application records each attempted external delivery alongside the in-app notification so that staff can inspect outcomes without exposing message content or credentials.

## Required secure configuration

Configure these values in the project's secure environment settings. Do not commit them to `.env`, source code, fixtures, or client-side variables.

| Variable | Purpose |
|---|---|
| `GMAIL_SMTP_USER` | The Gmail or Google Workspace sender address used in the message `From` field. |
| `GMAIL_SMTP_APP_PASSWORD` | The 16-character Google App Password for that sender account. Whitespace is ignored by the server. |

The server connects to `smtp.gmail.com` over TLS on port `465`. A credential verification test confirms authentication without delivering a message, while application tests mock the transport so that automated tests do not send learner e-mail.

## Creating an App Password

1. Sign in to the intended sender's Google account and open **Security**.
2. Turn on **2-Step Verification**. Google does not offer App Passwords until this is enabled.
3. Open **App passwords**, select **Mail**, choose **Other**, and name it `CodeCraft Academy`.
4. Copy the generated code into `GMAIL_SMTP_APP_PASSWORD` through the secure settings flow, and set `GMAIL_SMTP_USER` to the same sending account.
5. Re-run the SMTP credential validation before publishing changes.

Google Workspace administrators may restrict App Passwords. If the setting is absent, use an approved sender account or ask the Workspace administrator to enable the permitted authentication method; never substitute the account's ordinary Google password.

## Operational safeguards

- Use the address belonging to the configured sender only; do not impersonate an arbitrary `From` address.
- Obtain learner consent with the notification preference toggle and respect opt-out immediately.
- Gmail may apply recipient, spam, and sending-rate limits or temporarily throttle delivery. Treat failed rows in `notification_deliveries` as delivery failures, rather than retrying indefinitely.
- Keep e-mail content limited to the learning update and a link back to the platform; never include passwords, private assessment attachments, or other sensitive data.
- The SMTP connection happens server-side only. The browser receives no SMTP secret, and the deployment environment—not a checked-in local `.env` file—must provide the credentials.

## Validation checklist

1. Confirm `pnpm vitest run server/gmail-smtp.test.ts` authenticates successfully without sending mail.
2. Confirm `pnpm test` passes the consent-driven transport mock test.
3. Enable **E-mail мэдэгдэл** with a non-production test learner, publish one low-risk learning update, then inspect the delivery record and recipient inbox.
4. If delivery fails, check the audit record, sender account security alerts, App Password status, and provider limits before attempting another send.

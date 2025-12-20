"use client";

import React, { useMemo, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useCurrentUser } from "@/components/common/withUser";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { useMutation } from "@apollo/client/react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

type MailgunRiskLevel = "low" | "medium" | "high";

const styles = defineStyles("EmailSenderPage", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
  },
  intro: {
    color: theme.palette.grey[700],
    marginTop: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(420px, 1fr) minmax(360px, 520px)",
    gap: 16,
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  section: {
    padding: 16,
    borderTop: theme.palette.border.faint,
  },
  sectionTitle: {
    margin: 0,
    marginBottom: 8,
  },
  sectionHint: {
    color: theme.palette.grey[700],
    marginBottom: 12,
  },
  row: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  grow: { flexGrow: 1 },
  textarea: {
    fontFamily: theme.typography.fontFamily,
  },
  previewPane: {
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
    overflow: "hidden",
  },
  iframe: {
    border: "none",
    width: "100%",
    height: 420,
    display: "block",
    background: theme.palette.background.paper,
  },
  mono: {
    fontFamily: theme.typography.fontFamily,
    whiteSpace: "pre-wrap",
    fontSize: 12,
    marginTop: 12,
    background: theme.palette.grey[50],
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
    padding: 12,
  },
  label: {
    display: "block",
    fontSize: 12,
    color: theme.palette.grey[700],
    marginBottom: 6,
  },
  input: {
    width: "100%",
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
    padding: "10px 12px",
    fontSize: 14,
    background: theme.palette.background.paper,
    color: theme.palette.text.normal,
    outline: "none",
  },
  textareaEl: {
    width: "100%",
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
    padding: "10px 12px",
    fontSize: 14,
    background: theme.palette.background.paper,
    color: theme.palette.text.normal,
    outline: "none",
    fontFamily: theme.typography.fontFamily,
  },
  select: {
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
    padding: "10px 12px",
    fontSize: 14,
    background: theme.palette.background.paper,
    color: theme.palette.text.normal,
    outline: "none",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    userSelect: "none",
    cursor: "pointer",
  },
  checkbox: {
    width: 16,
    height: 16,
  },
  button: {
    border: theme.palette.border.faint,
    background: theme.palette.greyAlpha(0.08),
    color: theme.palette.text.normal,
    padding: "10px 14px",
    borderRadius: theme.borderRadius.default,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  primaryButton: {
    background: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.contrastText,
  },
  secondaryButton: {
    background: theme.palette.secondary.main,
    border: `1px solid ${theme.palette.secondary.main}`,
    color: theme.palette.secondary.contrastText,
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  tabRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  tab: {
    border: theme.palette.border.faint,
    background: theme.palette.greyAlpha(0.06),
    color: theme.palette.text.normal,
    padding: "8px 10px",
    borderRadius: theme.borderRadius.default,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  tabActive: {
    background: theme.palette.greyAlpha(0.14),
    border: theme.palette.border.normal,
  },
  divider: {
    height: 1,
    background: theme.palette.border.faint,
    marginTop: 12,
    marginBottom: 12,
  },
  errorBox: {
    color: theme.palette.error.dark,
    background: theme.palette.greyAlpha(0.15),
    border: `1px solid ${theme.palette.error.main}`,
    borderRadius: theme.borderRadius.default,
    padding: 12,
    marginTop: 12,
  },
  dangerBox: {
    background: theme.palette.greyAlpha(0.12),
    border: `1px solid ${theme.palette.warning.main}`,
    borderRadius: theme.borderRadius.default,
    padding: 12,
    marginTop: 12,
  },
}));

const PREVIEW_QUERY = gql(`
  query AdminEmailPreviewAudience($input: AdminEmailPreviewAudienceInput!) {
    adminEmailPreviewAudience(input: $input)
  }
`);

const SEND_TEST_MUTATION = gql(`
  mutation AdminSendTestEmail($input: AdminSendTestEmailInput!) {
    adminSendTestEmail(input: $input)
  }
`);

const SEND_BULK_MUTATION = gql(`
  mutation AdminSendBulkEmail($input: AdminSendBulkEmailInput!) {
    adminSendBulkEmail(input: $input)
  }
`);

const SAMPLE_UNSUBSCRIBE_URL = "https://www.lesswrong.com/emailToken/EXAMPLE_TOKEN";

function renderPreviewHtml(html: string): string {
  // Provide a basic standalone HTML doc for iframe preview.
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; margin: 16px; }
      a { color: #2a66c9; }
      pre { white-space: pre-wrap; }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;
}

function parsePositiveIntOrNull(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

const EmailSenderPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [subject, setSubject] = useState("Test Email");
  const [from, setFrom] = useState("");
  const [html, setHtml] = useState("<p>Hello!</p><p><a href=\"{{unsubscribeUrl}}\">Unsubscribe</a></p>");
  const [text, setText] = useState("Hello!\n\nUnsubscribe: {{unsubscribeUrl}}\n");

  const [verifiedEmailOnly, setVerifiedEmailOnly] = useState(true);
  const [requireMailgunValid, setRequireMailgunValid] = useState(false);
  const [excludeUnsubscribed, setExcludeUnsubscribed] = useState(true);
  const [excludeDeleted, setExcludeDeleted] = useState(true);
  const [maxMailgunRisk, setMaxMailgunRisk] = useState<MailgunRiskLevel | "any">("any");
  const [includeUnknownRisk, setIncludeUnknownRisk] = useState(true);

  const [maxRecipients, setMaxRecipients] = useState("100000");
  const [batchSize, setBatchSize] = useState("1000");
  const [concurrency, setConcurrency] = useState("20");

  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [previewTab, setPreviewTab] = useState<"html" | "text">("html");
  const [confirmBulk, setConfirmBulk] = useState(false);

  const filter = useMemo(() => ({
    verifiedEmailOnly,
    requireMailgunValid,
    excludeUnsubscribed,
    excludeDeleted,
    maxMailgunRisk: maxMailgunRisk === "any" ? null : maxMailgunRisk,
    includeUnknownRisk,
  }), [
    verifiedEmailOnly,
    requireMailgunValid,
    excludeUnsubscribed,
    excludeDeleted,
    maxMailgunRisk,
    includeUnknownRisk,
  ]);

  const { data: previewData, loading: previewLoading, refetch: refetchPreview } = useQuery(PREVIEW_QUERY, {
    variables: { input: { filter } },
    ssr: false,
    skip: !previewEnabled,
  });

  const [sendTest, { data: sendTestData, loading: sendTestLoading, error: sendTestError }] = useMutation(SEND_TEST_MUTATION);
  const [sendBulk, { data: sendBulkData, loading: sendBulkLoading, error: sendBulkError }] = useMutation(SEND_BULK_MUTATION);

  if (!userIsAdmin(currentUser)) {
    return <SingleColumnSection>
      <p>You must be logged in as an admin to use this page.</p>
    </SingleColumnSection>;
  }

  const preview = previewData?.adminEmailPreviewAudience;
  const testResult = sendTestData?.adminSendTestEmail;
  const bulkResult = sendBulkData?.adminSendBulkEmail;

  const htmlPreview = html.replaceAll("{{unsubscribeUrl}}", SAMPLE_UNSUBSCRIBE_URL);
  const textPreview = text.replaceAll("{{unsubscribeUrl}}", SAMPLE_UNSUBSCRIBE_URL);
  const missingUnsub = !(html.includes("{{unsubscribeUrl}}") || text.includes("{{unsubscribeUrl}}"));

  const maxRecipientsN = parsePositiveIntOrNull(maxRecipients);
  const batchSizeN = parsePositiveIntOrNull(batchSize);
  const concurrencyN = parsePositiveIntOrNull(concurrency);
  const bulkEnabled = !!subject.trim() && !!maxRecipientsN && !!batchSizeN && !!concurrencyN && confirmBulk;

  return <SingleColumnSection>
    <div className={classes.root}>
      <div className={classes.header}>
        <div>
          <h2 style={{ margin: 0 }}>Email Sender</h2>
          <div className={classes.intro}>
            Admin-only Mailgun sender with per-recipient unsubscribe links. Use <code>{"{{unsubscribeUrl}}"}</code> in HTML/Text.
          </div>
        </div>
      </div>

      <div className={classes.grid}>
        <div className={classes.section}>
          <h3 className={classes.sectionTitle}>Compose</h3>
          <div className={classes.sectionHint}>
            HTML is sent as-is; for bulk sends we substitute <code>%recipient.unsubscribeUrl%</code> via Mailgun recipient variables.
          </div>
          <label className={classes.label}>Subject</label>
          <input className={classes.input} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <div style={{ height: 12 }} />
          <label className={classes.label}>From (optional; defaults to no-reply@lesserwrong.com)</label>
          <input className={classes.input} value={from} onChange={(e) => setFrom(e.target.value)} />
          <div style={{ height: 12 }} />
          <label className={classes.label}>HTML</label>
          <textarea className={classes.textareaEl} rows={10} value={html} onChange={(e) => setHtml(e.target.value)} />
          <div style={{ height: 12 }} />
          <label className={classes.label}>Text</label>
          <textarea className={classes.textareaEl} rows={6} value={text} onChange={(e) => setText(e.target.value)} />

          {missingUnsub ? (
            <div className={classes.dangerBox}>
              <strong>Warning:</strong> neither HTML nor Text includes <code>{"{{unsubscribeUrl}}"}</code>. We should always include an unsubscribe link.
            </div>
          ) : null}
        </div>

        <div className={classes.section}>
          <h3 className={classes.sectionTitle}>Preview</h3>
          <div className={classes.sectionHint}>
            Preview uses a sample unsubscribe URL: <code>{SAMPLE_UNSUBSCRIBE_URL}</code>
          </div>
          <div className={classes.tabRow}>
            <button
              type="button"
              className={`${classes.tab} ${previewTab === "html" ? classes.tabActive : ""}`}
              onClick={() => setPreviewTab("html")}
            >
              HTML
            </button>
            <button
              type="button"
              className={`${classes.tab} ${previewTab === "text" ? classes.tabActive : ""}`}
              onClick={() => setPreviewTab("text")}
            >
              Text
            </button>
          </div>
          <div className={classes.previewPane}>
            {previewTab === "html" ? (
              <iframe className={classes.iframe} srcDoc={renderPreviewHtml(htmlPreview)} />
            ) : (
              <div className={classes.mono}>{textPreview}</div>
            )}
          </div>
        </div>
      </div>

      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Audience</h3>
        <div className={classes.sectionHint}>
          These filters affect both preview counts and bulk send. (The “Max risk” filter uses Mailgun validation rows.)
        </div>
        <div className={classes.row}>
          <label className={classes.checkboxRow}>
            <input className={classes.checkbox} type="checkbox" checked={verifiedEmailOnly} onChange={(e) => setVerifiedEmailOnly(e.target.checked)} />
            Verified primary email only
          </label>
          <label className={classes.checkboxRow}>
            <input className={classes.checkbox} type="checkbox" checked={requireMailgunValid} onChange={(e) => setRequireMailgunValid(e.target.checked)} />
            Require Mailgun isValid=true
          </label>
          <label className={classes.checkboxRow}>
            <input className={classes.checkbox} type="checkbox" checked={excludeUnsubscribed} onChange={(e) => setExcludeUnsubscribed(e.target.checked)} />
            Exclude unsubscribeFromAll
          </label>
          <label className={classes.checkboxRow}>
            <input className={classes.checkbox} type="checkbox" checked={excludeDeleted} onChange={(e) => setExcludeDeleted(e.target.checked)} />
            Exclude deleted
          </label>
        </div>
        <div className={classes.row} style={{ marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Max Mailgun risk</div>
            <select
              className={classes.select}
              value={maxMailgunRisk}
              onChange={(e) => setMaxMailgunRisk(e.target.value as any)}
            >
              <option value="any">Any</option>
              <option value="low">Low only</option>
              <option value="medium">Low + Medium</option>
              <option value="high">Low + Medium + High</option>
            </select>
          </div>
          <label className={classes.checkboxRow}>
            <input className={classes.checkbox} type="checkbox" checked={includeUnknownRisk} onChange={(e) => setIncludeUnknownRisk(e.target.checked)} />
            Include risk=unknown / missing Mailgun validation
          </label>
          <div className={classes.grow} />
          <button
            type="button"
            className={`${classes.button} ${classes.primaryButton} ${previewLoading ? classes.buttonDisabled : ""}`}
            onClick={async () => {
              setPreviewEnabled(true);
              await refetchPreview();
            }}
            disabled={previewLoading}
          >
            Preview audience
          </button>
        </div>
        {preview ? <pre className={classes.mono}>{JSON.stringify(preview, null, 2)}</pre> : null}
      </div>

      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Send</h3>
        <div className={classes.sectionHint}>
          Test sends go to a single user and always include a real unsubscribe token. Bulk sends generate unsubscribe tokens in batches.
        </div>
        <div className={classes.row}>
          <button
            type="button"
            className={`${classes.button} ${classes.primaryButton} ${sendTestLoading ? classes.buttonDisabled : ""}`}
            onClick={async () => {
              await sendTest({
                variables: {
                  input: {
                    userId: currentUser!._id,
                    subject,
                    from: from.trim() || null,
                    html,
                    text,
                  },
                },
              });
            }}
            disabled={sendTestLoading}
          >
            Send test to me
          </button>
          {sendTestError ? <div className={classes.errorBox}>{String(sendTestError.message)}</div> : null}
        </div>
        {testResult ? <pre className={classes.mono}>{JSON.stringify(testResult, null, 2)}</pre> : null}

        <div className={classes.divider} />
        <h4 style={{ margin: 0 }}>Bulk send</h4>
        <div className={classes.row} style={{ marginTop: 8 }}>
          <div>
            <label className={classes.label}>Max recipients (safety)</label>
            <input className={classes.input} value={maxRecipients} onChange={(e) => setMaxRecipients(e.target.value)} />
          </div>
          <div>
            <label className={classes.label}>Batch size</label>
            <input className={classes.input} value={batchSize} onChange={(e) => setBatchSize(e.target.value)} />
          </div>
          <div>
            <label className={classes.label}>Concurrency</label>
            <input className={classes.input} value={concurrency} onChange={(e) => setConcurrency(e.target.value)} />
          </div>
        </div>
        <label className={classes.checkboxRow} style={{ marginTop: 10 }}>
          <input className={classes.checkbox} type="checkbox" checked={confirmBulk} onChange={(e) => setConfirmBulk(e.target.checked)} />
          I understand this can email many users
        </label>
        <div className={classes.row}>
          <button
            type="button"
            className={`${classes.button} ${classes.secondaryButton} ${(sendBulkLoading || !bulkEnabled) ? classes.buttonDisabled : ""}`}
            onClick={async () => {
              await sendBulk({
                variables: {
                  input: {
                    filter,
                    subject,
                    from: from.trim() || null,
                    html,
                    text,
                    maxRecipients: maxRecipientsN,
                    batchSize: batchSizeN,
                    concurrency: concurrencyN,
                  },
                },
              });
            }}
            disabled={sendBulkLoading || !bulkEnabled}
          >
            Send bulk email
          </button>
          {!bulkEnabled ? (
            <div className={classes.sectionHint}>
              Provide valid numbers and check the confirmation box.
            </div>
          ) : null}
        </div>
        {sendBulkError ? <div className={classes.errorBox}>{String(sendBulkError.message)}</div> : null}
        {bulkResult ? <pre className={classes.mono}>{JSON.stringify(bulkResult, null, 2)}</pre> : null}
      </div>
    </div>
  </SingleColumnSection>;
};

export default registerComponent("EmailSenderPage", EmailSenderPage);



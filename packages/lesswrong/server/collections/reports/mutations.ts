import schema from "@/lib/collections/reports/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";
import { ChatPostMessageResponse, WebClient } from "@slack/web-api";
import { userGetDisplayName } from "@/lib/collections/users/helpers";


async function postReportsToSunshine(report: DbReport, context: ResolverContext): Promise<ChatPostMessageResponse | undefined> {

  const slackBotToken = process.env.AMANUENSIS_SLACK_BOT_TOKEN;
  const moderationChannelId = process.env.MODERATION_CHANNEL_ID;
  if (!moderationChannelId) {
    // eslint-disable-next-line no-console
    console.error('MODERATION_CHANNEL_ID is not set');
    return;
  }
  if (!slackBotToken) {
    // eslint-disable-next-line no-console
    console.error('AMANUENSIS_SLACK_BOT_TOKEN is not set');
    return;
  }

  const baseUrl = `https://${process.env.SITE_URL ?? 'lesswrong.com'}`;

  const user = await context.Users.findOne({ _id: report.userId });
  const [comment, post] = await Promise.all([
    report.commentId ? context.Comments.findOne({ _id: report.commentId }) : null,
    report.postId ? context.Posts.findOne({ _id: report.postId }) : null,
  ]);
  const reportedUser = await context.Users.findOne({ _id: report.reportedUserId ?? comment?.userId ?? post?.userId });

  const contentSlug = report.commentId ? `a comment on ${post?.title}` : report.postId ? `the post ${post?.title}` : `user ${reportedUser?.displayName}`;
  const description = report.description ?? '';
  const userLink = user ? `${baseUrl}/users/${user.slug}` : '';
  const userName = userGetDisplayName(user);
  const url = `${baseUrl}${report.link}`;

  const slack = new WebClient(slackBotToken);

  return await slack.chat.postMessage({
    channel: moderationChannelId,
    text: `Reported ${contentSlug}: ${description}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `Reported ${contentSlug}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Reported by <${userLink}|${userName}>:* _${description}_`,
        }
      },
      {
        type: "divider",
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: `View ${contentSlug} on LessWrong`,
              emoji: true,
            },
            value: `view_${contentSlug}_on_lesswrong`,
            url,
          },
        ]
      },
    ],
  });
}

function newCheck(user: DbUser | null, document: CreateReportDataInput | null, context: ResolverContext) {
  return userCanDo(user, [
    'report.create',
    'reports.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbReport | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'report.update.own',
      'reports.edit.own',
    ])
    : userCanDo(user, [
      'report.update.all',
      'reports.edit.all',
    ]);
}


export async function createReport({ data }: CreateReportInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Reports', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Reports', callbackProps);
  let documentWithId = afterCreateProperties.document;

  backgroundTask(postReportsToSunshine(documentWithId, context));

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Reports', documentWithId);

  return documentWithId;
}

export async function updateReport({ selector, data }: UpdateReportInput, context: ResolverContext) {
  const { currentUser, Reports } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: reportSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Reports', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Reports, reportSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Reports', updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: Reports, oldDocument, data: origData }));

  return updatedDocument;
}

export const createReportGqlMutation = makeGqlCreateMutation('Reports', createReport, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Reports', rawResult, context)
});

export const updateReportGqlMutation = makeGqlUpdateMutation('Reports', updateReport, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Reports', rawResult, context)
});

export const graphqlReportTypeDefs = () => gql`
  input CreateReportDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateReportInput {
    data: CreateReportDataInput!
  }
  
  input UpdateReportDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateReportInput {
    selector: SelectorInput!
    data: UpdateReportDataInput!
  }
  
  type ReportOutput {
    data: Report
  }

  extend type Mutation {
    createReport(data: CreateReportDataInput!): ReportOutput
    updateReport(selector: SelectorInput!, data: UpdateReportDataInput!): ReportOutput
  }
`;

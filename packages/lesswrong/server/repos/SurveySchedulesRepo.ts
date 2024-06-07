import SurveySchedules from "@/lib/collections/surveySchedules/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

type SurveyScheduleWithSurvey = DbSurveySchedule & {
  survey: DbSurvey,
};

class SurveySchedulesRepo extends AbstractRepo<"SurveySchedules"> {
  constructor() {
    super(SurveySchedules);
  }

  async getCurrentFrontpageSurvey(
    currentUser: DbUser | null,
    clientId: string,
  ): Promise<SurveyScheduleWithSurvey | null> {
    const isLoggedIn = !!currentUser;

    const karmaClause = isLoggedIn
      ? `
        CASE ss."minKarma"
          WHEN NULL THEN TRUE
          ELSE ss."minKarma" < COALSCE(u."karma", 0)
        END AND
        CASE ss."maxKarma"
          WHEN NULL THEN TRUE
          ELSE ss."maxKarma" > COALSCE(u."karma", 0)
        END AND
      `
      : ""

    // TODO: Filter out surveys the user has already responded to
    return this.getRawDb().oneOrNone(`
      SELECT ss.*, ROW_TO_JSON(s.*) "survey"
      FROM "SurveySchedules" ss
      JOIN "Surveys" s ON s."_id" = ss."surveyId"
      WHERE
        (ss."endDate" IS NULL OR ss."endDate" > CURRENT_TIMESTAMP) AND
        (ss."startDate" IS NULL OR ss."startDate" < CURRENT_TIMESTAMP) AND
        ss."deactivated" IS NOT TRUE AND
        ${karmaClause}
        CASE ss."target"
          WHEN 'loggedInOnly' THEN $1
          WHEN 'loggedOutOnly' THEN NOT $1
          ELSE TRUE
        END
      ORDER BY
        ss."clientIds" @> ('{' || $2 || '}')::VARCHAR[] DESC,
        "endDate" ASC,
        "_id" DESC
      LIMIT 1
    `, [isLoggedIn, clientId]);
  }

  async assignClientToSurveySchedule(
    surveyScheduleId: string,
    clientId: string,
  ): Promise<void> {
    await this.none(`
      UPDATE "SurveySchedules"
      SET "clientIds" = FM_ADD_TO_SET("clientIds", $2)
      WHERE "_id" = $1
    `, [surveyScheduleId, clientId]);
  }
}

recordPerfMetrics(SurveySchedulesRepo);

export default SurveySchedulesRepo;

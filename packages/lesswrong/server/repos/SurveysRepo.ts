import Surveys from "@/lib/collections/surveys/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class SurveysRepo extends AbstractRepo<"Surveys"> {
  constructor() {
    super(Surveys);
  }

  async deleteOrphanedQuestions(
    surveyId: string,
    questionIds: string[],
  ): Promise<void> {
    await this.none(`
      DELETE FROM "SurveyQuestions"
      WHERE
        "surveyId" = $1 AND
        NOT ARRAY["_id"] @> $2::VARCHAR[]
    `, [surveyId, questionIds]);
  }
}

recordPerfMetrics(SurveysRepo);

export default SurveysRepo;

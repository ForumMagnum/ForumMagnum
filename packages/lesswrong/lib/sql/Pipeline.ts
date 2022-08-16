class Stage {
  protected constructor(private data: any) {}

  static fromData(data: any) {
    const keys = Object.keys(data);
    if (keys.length !== 1) {
      throw new Error("Invalid pipeline stage format");
    }
    const stageName = keys[0];
    const stageData = data[stageName];
    switch (stageName) {
      case "$match":     return new MatchStage(stageData);
      case "$addFields": return new AddFieldsStage(stageData);
      case "$sort":      return new SortStage(stageData);
      case "$limit":     return new LimitStage(stageData);
      case "$lookup":    return new LookupStage(stageData);
      case "$project":   return new ProjectStage(stageData);
      case "$unwind":    return new UnwindStage(stageData);
      default:           throw new Error(`Invalid pipeline stage: ${stageName}`);
    }
  }
}

class MatchStage extends Stage {}

class AddFieldsStage extends Stage {}

class SortStage extends Stage {}

class LimitStage extends Stage {}

class LookupStage extends Stage {}

class ProjectStage extends Stage {}

class UnwindStage extends Stage {}

class Pipeline<T extends {}> {
  private stages: Stage[];

  constructor(data: T[]) {
    this.stages = data.map((stageData) => Stage.fromData(stageData));
  }

  compile() {
  }
}

export default Pipeline;

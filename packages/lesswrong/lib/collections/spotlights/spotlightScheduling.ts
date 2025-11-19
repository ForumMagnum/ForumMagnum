import sortBy from "lodash/sortBy";
import maxBy from "lodash/maxBy";

export const MS_IN_DAY = 1000 * 60 * 60 * 24;

export interface SpotlightOrderingFields {
  _id: string;
  position: number;
  lastPromotedAt: Date | string | number;
  duration?: number | null;
}

export interface PromotionScheduleEntry<T extends SpotlightOrderingFields> {
  spotlight: T;
  activationDate: Date;
  endDate: Date;
}

export const getDateValue = (value: Date | string | number | null | undefined) => {
  if (value instanceof Date) {
    const timestamp = value.valueOf();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
  if (typeof value === "string" || typeof value === "number") {
    const timestamp = new Date(value).valueOf();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
  return 0;
};

export const getCurrentSpotlight = <T extends SpotlightOrderingFields>(spotlights: T[]) => {
  return maxBy(spotlights, spotlight => getDateValue(spotlight.lastPromotedAt));
};

export const getSpotlightsByPosition = <T extends SpotlightOrderingFields>(spotlights: T[]) => {
  return sortBy(spotlights, spotlight => spotlight.position);
};

export const getPromotionOrderedSpotlights = <T extends SpotlightOrderingFields>(spotlights: T[]) => {
  if (!spotlights.length) return [];

  const spotlightsByPosition = getSpotlightsByPosition(spotlights);
  const currentSpotlight = getCurrentSpotlight(spotlightsByPosition);
  
  if (!currentSpotlight) return spotlightsByPosition;
  
  const currentIndex = spotlightsByPosition.findIndex(spotlight => spotlight._id === currentSpotlight._id);

  if (currentIndex === -1) return spotlightsByPosition;
  
  return [
    ...spotlightsByPosition.slice(currentIndex),
    ...spotlightsByPosition.slice(0, currentIndex),
  ];
};

export const buildPromotionSchedule = <T extends SpotlightOrderingFields>(orderedSpotlights: T[]): PromotionScheduleEntry<T>[] => {
  if (!orderedSpotlights.length) {
    return [];
  }
  let activationTimestamp = getDateValue(orderedSpotlights[0].lastPromotedAt);
  return orderedSpotlights.map((spotlight, index) => {
    if (index === 0) {
      activationTimestamp = getDateValue(spotlight.lastPromotedAt);
    } else {
      const previousSpotlight = orderedSpotlights[index - 1];
      activationTimestamp += (previousSpotlight.duration ?? 0) * MS_IN_DAY;
    }
    const activationDate = new Date(activationTimestamp);
    const endDate = new Date(activationDate.valueOf() + ((spotlight.duration ?? 0) * MS_IN_DAY));
    return {
      spotlight,
      activationDate,
      endDate,
    };
  });
};



export interface TimeSeries {
    start: number,
    interval: number,
    values: number[]
}

export const nullKarmaInflationSeries: TimeSeries = {
    start: Date.now(),
    interval: 1,
    values: [1]
}
let karmaInflationCache: TimeSeries = nullKarmaInflationSeries

export const getKarmaInflationSeries = () => karmaInflationCache;
export const setKarmaInflationSeries = (newKarmaInflationSeries: TimeSeries) => { karmaInflationCache = newKarmaInflationSeries };

/**
 * 
 * @param cmpField Field to compare to startTimestamp e.g. "$postedAt"
 * @param startTimestamp Unix timestamp in milliseconds
 * @param interval Interval to group by in milliseconds
 * @returns 
 */
export const timeSeriesIndexExpr = (cmpField: string, startTimestamp: number, interval: number) => {
    return {
        $floor: {
            $divide: [
                {
                    $subtract: [
                        cmpField,
                        new Date(startTimestamp)
                    ]
                },
                interval
            ]
        }
    }
}

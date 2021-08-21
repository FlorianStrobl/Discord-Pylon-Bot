// Florian Crafter - June 2021 - Version 1.3

// msToTimeString(330000);                          // "5m 30s"
// msToTimeString(330000, 'short', false, ' ', 15); //  "5m 30s"

// msToTimeString(330000, 'short');                 // "5m 30s"
// msToTimeString(330000, 'medium');                // "5mins 30secs"
// msToTimeString(330000, 'long');                  // "5minutes 30seconds"

// msToTimeString(330000, 'short', true, ', ', 2);  // "5 m, 30 s"
// msToTimeString(330000, 'short', false, '', 1);   // "5m"
// msToTimeString(301000, 'long', true);            // "5 minutes 1 second"

// same as in timeStringToMS.ts
const timeUnitValues: { [index: string]: number } = {
  ns: 1e-6,
  μs: 1e-3,
  ms: 1,
  s: 1000,
  min: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
  mth: 1000 * 60 * 60 * 24 * 30,
  y: 1000 * 60 * 60 * 24 * 365,
  a: 1000 * 60 * 60 * 24 * 365.25,
  dec: 1000 * 60 * 60 * 24 * 365 * 10,
  cen: 1000 * 60 * 60 * 24 * 365 * 100
};

const fullTimeUnitNames: {
  [index: string]: { short: string; medium: string; long: string };
} = {
  ns: { short: 'ns', medium: 'nanosec', long: 'nanosecond' },
  μs: { short: 'μs', medium: 'microsec', long: 'microsecond' },
  ms: { short: 'ms', medium: 'millisec', long: 'millisecond' },
  s: { short: 's', medium: 'sec', long: 'second' },
  min: { short: 'm', medium: 'min', long: 'minute' },
  h: { short: 'h', medium: 'hr', long: 'hour' },
  d: { short: 'd', medium: 'day', long: 'day' },
  w: { short: 'wk', medium: 'wk', long: 'week' },
  mth: { short: 'mth', medium: 'mo', long: 'month' },
  y: { short: 'y', medium: 'yr', long: 'year' },
  dec: { short: 'dec', medium: 'dec', long: 'decade' },
  cen: { short: 'cen', medium: 'cent', long: 'century' }
};

export function msToTimeString(
  time: number,
  format: 'short' | 'medium' | 'long' = 'short',
  spaceBetweenNumberAndUnit: boolean = false,
  stringBetweenUnits: string = ' ',
  numberOfMostSignificantUnitsShown: number = 15
): string | undefined {
  if (!Number.isFinite(time) || time <= 0) return undefined; // invalid input time

  // format mode
  if (format !== 'short' && format !== 'medium' && format !== 'long')
    format = 'short';

  let timeStr: string = ''; // the return string
  let nr: number = 0;

  // go through all times beginning with the end
  for (let i = Object.keys(timeUnitValues).length; i >= 0; --i) {
    const key: string = Object.keys(timeUnitValues)[i]; // get current key

    // skip special year
    if (key === 'a') continue;

    let ctime: number = time / timeUnitValues[key]; // current time
    if (ctime >= 1) {
      // if false, it is the wrong unit
      if (numberOfMostSignificantUnitsShown < ++nr) break;

      ctime = Math.floor(ctime); // format ctime

      // add strings to the final timeStr string
      timeStr += ctime; // time value
      timeStr += spaceBetweenNumberAndUnit ? ' ' : ''; // space between time and unit
      // add unit (with s if more than one)
      timeStr +=
        fullTimeUnitNames[key][format] +
        (ctime !== 1 && format !== 'short' ? 's' : '');

      // space between units
      timeStr += stringBetweenUnits;

      // remove current time from main time
      time -= ctime * timeUnitValues[key];
    }
  }

  // remove unwanted end string
  while (timeStr.endsWith(stringBetweenUnits) && stringBetweenUnits !== '')
    timeStr = timeStr.slice(0, -1 * stringBetweenUnits.length);

  // return the result
  if (timeStr === '') return undefined;
  else return timeStr;
}

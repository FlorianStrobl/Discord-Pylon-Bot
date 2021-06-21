// Florian Crafter - June 2021 - Version 1.0

// timeStringToMS: https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/Functions/TimeStringToMS.ts
// msToTimeString(time: number, format?: 'short' | 'medium' | 'long', spaces?: boolean);

// msToTimeString(330000, "short", false) returns 5m30s
// msToTimeString(330000, "short", true) returns 5m 30s
// msToTimeString(330000, "medium", false) returns 5mins30secs
// msToTimeString(330000, "medium", true) returns 5 mins 30 secs
// msToTimeString(330000, "long", false) returns 5minutes30seconds
// msToTimeString(330000, "long", true) returns 5 minutes 30 seconds
// msToTimeString(301000, "long", true) returns 5 minutes 1 second

// same as timeStringToMS()
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
  format?: 'short' | 'medium' | 'long',
  spaces?: boolean
): string | undefined {
  // format mode
  if (
    format === undefined ||
    (format !== 'short' && format !== 'medium' && format !== 'long')
  )
    format = 'short';

  // space mode
  if (spaces === undefined) spaces = false;

  // the return string
  let timeStr: string = '';

  // go through all times beginning with the end
  for (let i = Object.keys(timeUnitValues).length; i >= 0; --i) {
    // get current key
    const key: string = Object.keys(timeUnitValues)[i];
    // skip special year
    if (key === 'a') continue;

    // current time
    let ctime: number = time / timeUnitValues[key];
    if (ctime >= 1) {
      // format ctime
      ctime = Math.floor(ctime);

      // add string to timeStr
      // time
      timeStr += ctime;
      // space between time
      timeStr += spaces === true && format !== 'short' ? ' ' : '';
      // unit
      timeStr +=
        fullTimeUnitNames[key][format] +
        (ctime !== 1 && format !== 'short' ? 's' : '');
      // space between timers
      timeStr += spaces === true ? ' ' : '';

      // format time
      time -= ctime * timeUnitValues[key];
    }
  }

  // remove unwanted spaces
  while (timeStr[timeStr.length - 1] === ' ') timeStr = timeStr.slice(0, -1);

  // return the result
  if (timeStr === '') return undefined;
  else return timeStr;
}

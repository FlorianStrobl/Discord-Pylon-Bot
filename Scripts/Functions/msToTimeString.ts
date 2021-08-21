// Florian Crafter - June 2021 - Version 1.2

// msToTimeString(time: number, format?: 'short' | 'medium' | 'long', spaces?: boolean);

// msToTimeString(330000, "short", false)        => 5m30s
// msToTimeString(330000, "short", true) ....... => 5m 30s
// msToTimeString(330000, "medium", false)       => 5mins30secs
// msToTimeString(330000, "medium", true) ...... => 5 mins 30 secs
// msToTimeString(330000, "long", false)         => 5minutes30seconds
// msToTimeString(330000, "long", true) ........ => 5 minutes 30 seconds
// msToTimeString(301000, "long", true)          => 5 minutes 1 second
// msToTimeString(301000, "long", true, 1) ..... => 5 minutes
// msToTimeString(301000, "long", true, 2, ", ") => 5 minutes, 1 second

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
  format: 'short' | 'medium' | 'long' = 'short',
  spaces: boolean = false,
  numberOfMostSignificantUnits: number = 15,
  joinString: string = ' '
): string | undefined {
  // format mode
  if (format !== 'short' && format !== 'medium' && format !== 'long')
    format = 'short';

  let timeStr: string = '';  // the return string
  let nr: number = 0;

  // go through all times beginning with the end
  for (let i = Object.keys(timeUnitValues).length; i >= 0; --i) {
    const key: string = Object.keys(timeUnitValues)[i]; // get current key
    
    // skip special year
    if (key === 'a') continue;

    // current time
    let ctime: number = time / timeUnitValues[key];
    if (ctime >= 1) {
      if ((numberOfMostSignificantUnits) < ++nr) break;

      // format ctime
      ctime = Math.floor(ctime);

      // add string to timeStr
      timeStr += ctime; // time
      timeStr += spaces === true && format !== 'short' ? ' ' : ''; // space between time
      // add unit
      timeStr +=
        fullTimeUnitNames[key][format] +
        (ctime !== 1 && format !== 'short' ? 's' : '');
      // space between timers
      timeStr += spaces === true ? joinString : '';

      // format time
      time -= ctime * timeUnitValues[key];
    }
  }

  // remove unwanted end string
  while (timeStr.endsWith(joinString))
    timeStr = timeStr.slice(0, -1 * joinString.length);

  // return the result
  if (timeStr === '') return undefined;
  else return timeStr;
}

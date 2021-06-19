// Florian Crafter - June 2021 - Version 1.1b

// strings have to be in a special format: number (can have "." or "," for decimal places) unit (units are defined below)
// you can have as many of these string parts as you want
// minutes and hours are special cases wich support ":" for eg. "5:30min"
// case and spaces are ignored

// timeStringToMS("5:30min 3minutes 2mins 44m 3.6m ") returns 3486000 (57min and 30+36sec = 3486000ms)
// "1 week 3 days 12 hours" is the same as "1w3d12h"

const timeUnits: { [index: string]: string[] } = {
  ns: ['nanosecond(s)', 'nanosec(s)'],
  μs: ['us', 'microsec(s)', 'microsecond(s)'],
  ms: ['millisecond(s)', 'millisec(s)'],
  s: ['sec(s)', 'second(s)'],
  min: ['minute(s)', 'm', 'min(s)'],
  h: ['hr(s)', 'hour(s)'],
  d: ['day(s)'],
  w: ['wk(s)', 'week(s)'],
  mth: ['mth(s)', 'month(s)'],
  y: ['year(s)'],
  a: ['julianyear(s)'],
  dec: ['decade(s)'],
  cen: ['cent(s)', 'century', 'centuries']
};

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

export function timeStringToMS(timeStr: string): number | undefined {
  // get values
  const values:
    | { numberPart: string; unit: string }[]
    | undefined = getUnitAndNumber(timeStr);

  // check values for errors
  if (values === undefined) return undefined;

  let ms: number = 0;
  try {
    // get the values in ms
    for (let i = 0; i < values.length; ++i)
      ms += getMs(values[i].numberPart, values[i].unit);
  } catch (_) {
    return undefined;
  }

  return ms;
}

function getUnitAndNumber(
  timeStr: string
): { numberPart: string; unit: string }[] | undefined {
  // returns the strings (s) and numbers (n) of a string formatted as: "nnssnnssnnss"
  // /[0-9.,:]/g = regex for getting all the chars in a string which are equal to 0-9.,:
  // /[^0-9.,:]/g = regex for getting all the chars in a string which are not equal to 0-9.,:

  // format string basics (lowercase and no spaces)
  timeStr = timeStr
    .toLowerCase()
    .split(' ')
    .join('');

  // get the numbers and units in a single string (and format the time strings)
  const unit: string = timeStr.replace(/[0-9.,:]/g, ' ');
  const numberPart: string = timeStr
    .replace(/[^0-9.,:]/g, ' ')
    .replace(',', '.');

  // get the numbers and units in an array and remove all the empty strings
  let units: string[] | undefined = unit.split(' ').filter((str) => str !== '');
  const numberParts: string[] = numberPart
    .split(' ')
    .filter((str) => str !== '');

  // replace eg. minute to min
  units = getExactUnits(units);

  // error checking
  if (
    unit === '' ||
    unit === undefined ||
    numberPart === '' ||
    numberPart === undefined ||
    units === undefined ||
    units.length === 0 ||
    numberParts.length === 0 ||
    units.length !== numberParts.length
  )
    return undefined;

  // get the two arrays in a single one
  let ans: { numberPart: string; unit: string }[] = [];
  for (let i = 0; i < units.length; ++i)
    ans.push({ numberPart: numberParts[i], unit: units[i] });

  // return the answer
  return ans;

  function getExactUnits(units: string[]): string[] | undefined {
    let exactUnits: string[] = [];

    // for each unit of the array
    for (const unit of units) {
      if (timeUnits[unit] !== undefined) {
        // it's a main unit, just push it and skip the rest
        exactUnits.push(unit);
        continue;
      } else {
        // it's not a main unit, so search the right one
        // for each time unit
        for (const timeUnit in timeUnits) {
          // for each allias of a time unit
          for (const timeUnitAllias of timeUnits[timeUnit]) {
            if (
              timeUnitAllias.replace('(s)', '') === unit ||
              timeUnitAllias.replace('(s)', 's') === unit
            ) {
              // it's the unit, push the value and skip the rest
              exactUnits.push(timeUnit);
              continue;
            }
          }
        }
      }
    }

    if (exactUnits.length !== units.length) return undefined;

    return exactUnits;
  }
}

function getMs(number: string, unit: string): number {
  // check for special case
  if (number.includes(':')) {
    switch (unit) {
      case 'min':
        return (
          Number(number.split(':')[0]) * timeUnitValues['min'] +
          Number(number.split(':')[1]) * timeUnitValues['s']
        );
      case 'h':
        const seconds: number =
          number.split(':').length === 3
            ? Number(number.split(':')[2]) * timeUnitValues['s']
            : 0;
        return (
          Number(number.split(':')[0]) * timeUnitValues['h'] +
          Number(number.split(':')[1]) * timeUnitValues['min'] +
          seconds
        );
      default:
        throw new Error('Used ":" with a unit which doesn\'t support it');
    }
  }

  // default case
  return Number(number) * timeUnitValues[unit];
}

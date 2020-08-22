// Minesweeper in DC by Clash Crafter
// Version: 1.1c - 22.08.2020

// Command group
const Commands = new discord.command.CommandGroup({
  defaultPrefix: '.',
  additionalPrefixes: ['!']
});

// Minesweeper
Commands.on(
  'minesweeper',
  (args) => ({
    fieldSize: args.numberOptional(),
    numberOfBombs: args.numberOptional()
  }),
  async (msg, { fieldSize, numberOfBombs }) => {
    if (!fieldSize) {
      fieldSize = 7;
    } else if (fieldSize > 14) {
      fieldSize = 14;
      await msg?.reply('Not over 14 rows!');
    } else if (fieldSize < 4) {
      fieldSize = 4;
      await msg?.reply('Not under 4 rows!');
    }

    if (!numberOfBombs) {
      numberOfBombs = 2;
    } else if (numberOfBombs < 1) {
      numberOfBombs = 1;
      await msg?.reply('At least 1 bomb!');
    } else if (numberOfBombs > fieldSize) {
      numberOfBombs = fieldSize;
      await msg?.reply('Too many bombs!');
    }

    var field: Array<string> = await generateField(fieldSize, numberOfBombs);

    await msg?.reply(
      `*Minesweeper: fieldsize: ${fieldSize} + bombs: ${numberOfBombs}*\n` +
        field.join('')
    );
  }
);

async function generateField(fieldSize: number, numberOfBombs: number) {
  let bombCoordinates: number;
  var coordinatesWithNotZeroOrBomb: Array<number> = [];
  var theActualNumber: Array<number> = [];

  var possibleNumbers: Array<number> = [
    1,
    -1,
    fieldSize,
    fieldSize + 1,
    fieldSize + 2,
    -fieldSize,
    -(fieldSize + 1),
    -(fieldSize + 2)
  ];

  // initialize the Array
  var field = new Array(fieldSize * fieldSize + (fieldSize - 1)).fill('||0️⃣||');

  // set the \n on the Array for a perfect rectangle
  for (var i = 1; i < fieldSize; i++) {
    field[i * (fieldSize + 1) - 1] = '\n';
  }

  // set the Bomb and save the numbers that have to be set
  for (var i = 0; i < numberOfBombs; i++) {
    bombCoordinates = Math.floor(Math.random() * Math.floor(field.length));
    if (field[bombCoordinates] == '||💣||' || field[bombCoordinates] == '\n') {
      i--;
    } else {
      field[bombCoordinates] = '||💣||';

      for (var y = 0; y < possibleNumbers.length; y++) {
        if (
          field[bombCoordinates + possibleNumbers[y]] != '\n' &&
          field[bombCoordinates + possibleNumbers[y]] != '||💣||' &&
          field[bombCoordinates + possibleNumbers[y]]
        ) {
          coordinatesWithNotZeroOrBomb.push(
            bombCoordinates + possibleNumbers[y]
          );
          theActualNumber[bombCoordinates + possibleNumbers[y]] =
            (theActualNumber[bombCoordinates + possibleNumbers[y]] ?? 0) + 1;
        }
      }
    }
  }

  // set the numbers in the field
  coordinatesWithNotZeroOrBomb.forEach(async (theCoordinate) => {
    if (field[theCoordinate] != '||💣||') {
      switch (theActualNumber[theCoordinate]) {
        case 1:
          field[theCoordinate] = '||:one:||';
          break;
        case 2:
          field[theCoordinate] = '||:two:||';
          break;
        case 3:
          field[theCoordinate] = '||:three:||';
          break;
        case 4:
          field[theCoordinate] = '||:four:||';
          break;
        case 5:
          field[theCoordinate] = '||:five:||';
          break;
        case 6:
          field[theCoordinate] = '||:six:||';
          break;
        case 7:
          field[theCoordinate] = '||:seven:||';
          break;
        case 8:
          field[theCoordinate] = '||:eight:||';
          break;
        case 9:
          field[theCoordinate] = '||:nine:||';
          break;
        default:
          // there is no emoji for more than nine so...
          field[theCoordinate] = '||❗||';
          break;
      }
    }
  });

  return field;
}

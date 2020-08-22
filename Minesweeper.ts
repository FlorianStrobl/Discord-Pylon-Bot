// Minesweeper in DC by Clash Crafter
// Version: 1.1b - 22.08.2020

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
    }

    if (!numberOfBombs) {
      numberOfBombs = 2;
    }

    let bombCoordinates: number;
    var field = new Array(fieldSize * fieldSize + (fieldSize - 1)).fill(
      '||0️⃣||'
    );

    var coordinatesWithNotZeroOrBomb: Array<number> = [];
    var theActualNumber: Array<number> = [];

    var possibleOnes: Array<number> = [
      1,
      -1,
      fieldSize,
      fieldSize + 1,
      fieldSize + 2,
      -fieldSize,
      -(fieldSize + 1),
      -(fieldSize + 2)
    ];

    for (var i = 1; i < fieldSize; i++) {
      field[i * (fieldSize + 1) - 1] = '\n';
    }

    for (var i = 0; i < numberOfBombs; i++) {
      bombCoordinates = Math.floor(Math.random() * Math.floor(field.length));
      if (
        field[bombCoordinates] == '||💣||' ||
        field[bombCoordinates] == '\n'
      ) {
        i--;
      } else {
        field[bombCoordinates] = '||💣||';

        for (var y = 0; y < possibleOnes.length; y++) {
          if (
            field[bombCoordinates + possibleOnes[y]] != '\n' &&
            field[bombCoordinates + possibleOnes[y]] != '||💣||' &&
            field[bombCoordinates + possibleOnes[y]]
          ) {
            coordinatesWithNotZeroOrBomb.push(bombCoordinates + possibleOnes[y]);
            theActualNumber[bombCoordinates + possibleOnes[y]] =
              (theActualNumber[bombCoordinates + possibleOnes[y]] ?? 0) + 1;
          }
        }

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
                field[theCoordinate] = '||❗||';
                break;
            }
          }
        });
      }
    }

    await msg?.reply(
      `*Minesweeper: fieldsize: ${fieldSize} + Bombs: ${numberOfBombs}*\n` +
        field.join('')
    );
  }
);

// minesweeper
// Author: Clash Crafter
// Version: 1.0

const Commands = new discord.command.CommandGroup({
  defaultPrefix: '.',
  additionalPrefixes: ['!']
});

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
            field[bombCoordinates + possibleOnes[y]] = '||❗||';
          }
        }
      }
    }

    await msg?.reply(
      `*Minesweeper: fieldsize: ${fieldSize} + Bombs: ${numberOfBombs}*\n` +
        field.join('')
    );
  }
);

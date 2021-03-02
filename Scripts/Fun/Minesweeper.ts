// Minesweeper in DC by Clash Crafter
// Version: 1.2a - 23.08.2020

const GameCommand = new discord.command.CommandGroup({
  defaultPrefix: '.',
  additionalPrefixes: ['!']
});

// #region the variables
let mineMsgId: string;
let firstTime: boolean;
let field: Array<string>;
let theActualField: Array<string>;
let mineSize: number;
let mineBombs: number;
let winCounter: number = 0;
// #endregion

// Shows a minesweeper field
GameCommand.raw('showField', async (msg) => {
  await msg?.reply((await generateField(10, 3, false, -1)).join(''));
});

// Minesweeper (with spoilers)
GameCommand.on(
  'minesweeper',
  (args) => ({
    fieldSize: args.numberOptional(),
    numberOfBombs: args.numberOptional()
  }),
  async (msg, { fieldSize, numberOfBombs }) => {
    if (!fieldSize) fieldSize = 7;
    else if (fieldSize > 14) {
      fieldSize = 14;
      await msg?.reply('Not over 14 rows!');
    } else if (fieldSize < 4) {
      fieldSize = 4;
      await msg?.reply('Not under 4 rows!');
    }

    if (!numberOfBombs) numberOfBombs = 2;
    else if (numberOfBombs < 1) {
      numberOfBombs = 1;
      await msg?.reply('At least 1 bomb!');
    } else if (numberOfBombs > fieldSize) {
      numberOfBombs = fieldSize;
      await msg?.reply('Too many bombs!');
    }

    let field: Array<string> = await generateField(
      fieldSize,
      numberOfBombs,
      true,
      -1
    );

    await msg?.reply(
      `*Minesweeper: fieldsize: ${fieldSize} + bombs: ${numberOfBombs}*\n${field.join(
        ''
      )}`
    );
  }
);

// Minesweeper coop
GameCommand.on(
  'minesweeperCoop',
  (args) => ({
    fieldSize: args.numberOptional(),
    numberOfBombs: args.numberOptional()
  }),
  async (msg, { fieldSize, numberOfBombs }) => {
    if (!fieldSize) fieldSize = 7;
    else if (fieldSize > 14) {
      fieldSize = 14;
      await msg?.reply('Not over 14 rows!');
    } else if (fieldSize < 4) {
      fieldSize = 4;
      await msg?.reply('Not under 4 rows!');
    }

    if (!numberOfBombs) numberOfBombs = 2;
    else if (numberOfBombs < 1) {
      numberOfBombs = 1;
      await msg?.reply('At least 1 bomb!');
    } else if (numberOfBombs > fieldSize) {
      numberOfBombs = fieldSize;
      await msg?.reply('Too many bombs!');
    }

    field = new Array(fieldSize * fieldSize + (fieldSize - 1)).fill(
      '||:black_medium_small_square:||'
    );

    for (let i: number = 1; i < fieldSize; ++i)
      field[i * (fieldSize + 1) - 1] = '\n';

    await msg
      ?.reply(
        `**Minesweeper**: fieldsize: ${fieldSize} + bombs: ${numberOfBombs}\n *!op x y*  for open a field \n${field.join(
          ''
        )}`
      )
      .then((m) => (mineMsgId = m.id));

    firstTime = true;
    mineBombs = numberOfBombs;
    mineSize = fieldSize;
  }
);

// Open field for coop
GameCommand.on(
  'op',
  (args) => ({
    x: args.number(),
    y: args.number()
  }),
  async (msg, { x, y }) => {
    if (!mineMsgId) return;

    await msg?.delete();

    // get msg
    const msgOld = await (
      await discord.getGuildTextChannel(msg.channelId)
    )?.getMessage(mineMsgId);

    // too big/little numbers
    if (x > mineSize)
      return setTimeout(() => {
        msg?.reply('x not over: ' + mineSize + '!');
      }, 15000);
    else if (x < 1)
      return setTimeout(() => {
        msg?.reply('x has to be at least 1!');
      }, 15000);
    if (y > mineSize)
      return setTimeout(() => {
        msg?.reply('y not over: ' + mineSize);
      }, 15000);
    else if (y < 1)
      return setTimeout(() => {
        msg?.reply('y has to be at least 1!');
      }, 15000);

    // the coordinate of the field in the array
    let z: number = (y - 1) * (mineSize + 1) + (x - 1);

    // generate the field at the first opened field
    if (firstTime) {
      theActualField = await generateField(mineSize, mineBombs, false, z);
      firstTime = false;
    }

    // check if really a new field
    if (field[z] != theActualField[z]) {
      winCounter++;

      field[z] = theActualField[z];

      await msgOld?.edit(
        `**Minesweeper**: fieldsize: ${mineSize} + bombs: ${mineBombs}\n *!op x y*  for open a field \n${field.join(
          ''
        )}`
      );

      // check lose and resets values if
      if (field[z] === '💣') {
        firstTime = true;
        mineMsgId = '';
        mineSize = 0;
        mineBombs = 0;
        winCounter = 0;
        field = [];
        theActualField = [];
        return setTimeout(() => {
          msgOld?.delete();
          msg?.reply(`${msg.member.toMention()} loses the game!`);
        }, 15000);
      }

      // check win
      if (theActualField.length - (mineSize - 1) - winCounter <= mineBombs) {
        firstTime = true;
        mineMsgId = '';
        mineSize = 0;
        mineBombs = 0;
        winCounter = 0;
        field = [];
        theActualField = [];
        return setTimeout(() => {
          msgOld?.delete();
          msg?.reply(msg.member.toMention() + ' wins the game!');
        }, 15000);
      }
    }
  }
);

// generate a new field
async function generateField(
  fieldSize: number,
  numberOfBombs: number,
  spoiler: boolean,
  firstField: number
): Promise<string[]> {
  let bombCoordinates: number;
  let coordinatesWithNotZeroOrBomb: Array<number> = [];
  let theActualNumber: Array<number> = [];
  let spoilers: string = '';

  // spoiler for the single player
  if (spoiler) spoilers = '||';

  // coordinates in the array were a number will probably be
  let possibleNumbers: Array<number> = [
    1,
    -1,
    fieldSize,
    fieldSize + 1,
    fieldSize + 2,
    -fieldSize,
    -(fieldSize + 1),
    -(fieldSize + 2)
  ];

  // initialize the array
  let field = new Array(fieldSize * fieldSize + (fieldSize - 1)).fill(
    spoilers + '0️⃣' + spoilers
  );

  // set the \n on the array for a perfect rectangle
  for (let i: number = 1; i < fieldSize; ++i)
    field[i * (fieldSize + 1) - 1] = '\n';

  // set the bomb and save the numbers that have to be set
  for (let i: number = 0; i < numberOfBombs; ++i) {
    bombCoordinates = Math.floor(Math.random() * Math.floor(field.length));
    if (
      field[bombCoordinates] == spoilers + '💣' + spoilers ||
      field[bombCoordinates] == '\n' ||
      bombCoordinates == firstField
    ) {
      --i;
    } else {
      field[bombCoordinates] = spoilers + '💣' + spoilers;

      for (let y: number = 0; y < possibleNumbers.length; y++) {
        if (
          field[bombCoordinates + possibleNumbers[y]] != '\n' &&
          field[bombCoordinates + possibleNumbers[y]] !=
            spoilers + '💣' + spoilers &&
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
    if (field[theCoordinate] != spoilers + '💣' + spoilers) {
      const numbers: Array<string> = [
        discord.decor.Emojis.ONE,
        discord.decor.Emojis.TWO,
        discord.decor.Emojis.THREE,
        discord.decor.Emojis.FOUR,
        discord.decor.Emojis.FIVE,
        discord.decor.Emojis.SIX,
        discord.decor.Emojis.SEVEN,
        discord.decor.Emojis.EIGHT,
        discord.decor.Emojis.NINE
      ];
      if (theActualNumber[theCoordinate] - 1 < numbers.length)
        field[theCoordinate] =
          spoilers + numbers[theActualNumber[theCoordinate] - 1] + spoilers;
      // there is no emoji for more than nine so...
      else field[theCoordinate] = spoilers + '❗' + spoilers;
    }
  });

  return field;
}

// Minesweeper in DC by Clash Crafter
// Version: 1.2 - 23.08.2020

const Commands = new discord.command.CommandGroup({
  defaultPrefix: '!'
});

// #region the Variables
var mineMsgId: string;
var mineSize: number;
var mineBombs: number;
var field: Array<string>;
var firstTime: boolean;
var theActualField: Array<string>;
var winCounter: number = 0;
// #endregion

Commands.raw('showField', async (msg) => {
  await msg?.reply((await generateField(10, 3, false, -1)).join(''));
});

// Minesweeper (with Spoilers)
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

    let field: Array<string> = await generateField(
      fieldSize,
      numberOfBombs,
      true,
      -1
    );

    await msg?.reply(
      `*Minesweeper: fieldsize: ${fieldSize} + bombs: ${numberOfBombs}*\n` +
        field.join('')
    );
  }
);

// Minesweeper coop
Commands.on(
  'minesweeperCoop',
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

    field = new Array(fieldSize * fieldSize + (fieldSize - 1)).fill(
      '||:black_medium_small_square:||'
    );

    for (let i = 1; i < fieldSize; i++) {
      field[i * (fieldSize + 1) - 1] = '\n';
    }

    await msg
      ?.reply(
        `**Minesweeper**: fieldsize: ${fieldSize} + bombs: ${numberOfBombs}\n *!op x y*  for open a field` +
          field.join('')
      )
      .then(async (theMsg) => {
        mineMsgId = theMsg.id;
      });

    firstTime = true;
    mineBombs = numberOfBombs;
    mineSize = fieldSize;
  }
);

// Open field for coop
Commands.on(
  'op',
  (args) => ({
    x: args.number(),
    y: args.number()
  }),
  async (msg, { x, y }) => {
    if (!mineMsgId) {
      return;
    }

    await msg?.delete();

    // get the to edit msg
    const theChannel = await discord.getGuildTextChannel(msg.channelId);
    const theOldMsg = await theChannel?.getMessage(mineMsgId);

    // too big/little numbers
    if (x > mineSize) {
      return setTimeout(async () => {
        await msg?.reply('x not over: ' + mineSize + '!');
      }, 15000);
    } else if (x < 1) {
      return setTimeout(async () => {
        await msg?.reply('x has to be at least 1!');
      }, 15000);
    }
    if (y > mineSize) {
      return setTimeout(async () => {
        await msg?.reply('y not over: ' + mineSize);
      }, 15000);
    } else if (y < 1) {
      return setTimeout(async () => {
        await msg?.reply('y has to be at least 1!');
      }, 15000);
    }

    // the coordinate of the field in the array
    let z = (y - 1) * (mineSize + 1) + (x - 1);

    // generate the field at the first opened field
    if (firstTime) {
      theActualField = await generateField(mineSize, mineBombs, false, z);
      firstTime = false;
    }

    // check if really a new field
    if (field[z] != theActualField[z]) {
      winCounter++;

      field[z] = theActualField[z];

      await theOldMsg?.edit(
        `**Minesweeper**: fieldsize: ${mineSize} + bombs: ${mineBombs}\n *!op x y*  for open a field` +
          field.join('')
      );

      // check lose
      if (field[z] == '💣') {
        firstTime = true;
        mineMsgId = '';
        mineSize = 0;
        mineBombs = 0;
        winCounter = 0;
        field = [];
        theActualField = [];
        return setTimeout(async () => {
          await theOldMsg?.delete();
          await msg?.reply(msg.member.toMention() + ' loses the game!');
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
        return setTimeout(async () => {
          await theOldMsg?.delete();
          await msg?.reply(msg.member.toMention() + ' wins the game!');
        }, 15000);
      }
    }
  }
);

// generate a field
async function generateField(
  fieldSize: number,
  numberOfBombs: number,
  spoiler: boolean,
  firstField: number
) {
  let bombCoordinates: number;
  let coordinatesWithNotZeroOrBomb: Array<number> = [];
  let theActualNumber: Array<number> = [];
  let spoilers: string = '';

  // spoiler for the single player
  if (spoiler) {
    spoilers = '||';
  }

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

  // initialize the Array
  let field = new Array(fieldSize * fieldSize + (fieldSize - 1)).fill(
    spoilers + '0️⃣' + spoilers
  );

  // set the \n on the Array for a perfect rectangle
  for (let i = 1; i < fieldSize; i++) {
    field[i * (fieldSize + 1) - 1] = '\n';
  }

  // set the Bomb and save the numbers that have to be set
  for (let i = 0; i < numberOfBombs; i++) {
    bombCoordinates = Math.floor(Math.random() * Math.floor(field.length));
    if (
      field[bombCoordinates] == spoilers + '💣' + spoilers ||
      field[bombCoordinates] == '\n' ||
      bombCoordinates == firstField
    ) {
      i--;
    } else {
      field[bombCoordinates] = spoilers + '💣' + spoilers;

      for (var y = 0; y < possibleNumbers.length; y++) {
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
      switch (theActualNumber[theCoordinate]) {
        case 1:
          field[theCoordinate] = spoilers + ':one:' + spoilers;
          break;
        case 2:
          field[theCoordinate] = spoilers + ':two:' + spoilers;
          break;
        case 3:
          field[theCoordinate] = spoilers + ':three:' + spoilers;
          break;
        case 4:
          field[theCoordinate] = spoilers + ':four:' + spoilers;
          break;
        case 5:
          field[theCoordinate] = spoilers + ':five:' + spoilers;
          break;
        case 6:
          field[theCoordinate] = spoilers + ':six:' + spoilers;
          break;
        case 7:
          field[theCoordinate] = spoilers + ':seven:' + spoilers;
          break;
        case 8:
          field[theCoordinate] = spoilers + ':eight:' + spoilers;
          break;
        case 9:
          field[theCoordinate] = spoilers + ':nine:' + spoilers;
          break;
        default:
          // there is no emoji for more than nine so...
          field[theCoordinate] = spoilers + '❗' + spoilers;
          break;
      }
    }
  });

  return field;
}

import * as Definitions from './definitions';
import * as Settings from './settings';
import * as BetterKV from '../Extra/betterKV';

export function GenerateRandString(
  characterSet: string,
  length: number
): string {
  // generating new password
  let pwd: string = '';
  for (let i: number = 0; i < length; ++i)
    pwd += characterSet.charAt(Math.floor(Math.random() * characterSet.length));
  return pwd;
}

// TODO
export function SaveNewUser(
  userId: discord.Snowflake,
  userInfos?: Object
): Definitions.GHC_User {
  return {} as any;
}

export function GenerateCaptcha(): { msg: string; value: string } {
  const captchaString: string = GenerateRandString(
    Settings.charactersForCaptcha,
    5
  );

  let answerString: string = '';
  for (const s of captchaString)
    answerString += Settings.charactersForRandString.split('')[
      Settings.charactersForCaptcha.lastIndexOf(s)
    ];

  return { msg: captchaString, value: answerString };
}

export const DeleteSpaces = (str: string) => str.split(' ').join('');

// TODO
export function GetObjectKeys(enums: object): string[] {
  let keys = [];
  for (const key in enums) keys.push(key);
  return keys;
}

export async function EditMessage(
  message:
    | discord.Snowflake
    | discord.Message
    | discord.GuildMemberMessage
    | null
    | undefined,
  text: string | discord.Embed | null | undefined,
  channel?: discord.Snowflake
): Promise<discord.Message | undefined> {
  if (
    text === undefined ||
    text === null ||
    message === undefined ||
    message === null
  )
    return undefined;

  let _message: discord.Message | undefined | null;
  if (
    message instanceof discord.GuildMemberMessage ||
    message instanceof discord.Message
  ) {
    _message = message;
  } else {
    await discord
      .getGuildTextChannel(channel as discord.Snowflake)
      .then(async (c) => {
        try {
          _message = await c?.getMessage(message as discord.Snowflake);
        } catch (_) {}
      });
  }

  if (_message?.author.id !== Settings.pylonId || _message === null)
    return undefined;

  if (text instanceof discord.Embed)
    return await _message?.edit(text as discord.Embed);
  else return await _message?.edit(text as string);
}

export async function SendMessage(
  were:
    | discord.Snowflake
    | discord.Message
    | discord.GuildMemberMessage
    | discord.GuildTextChannel
    | null
    | undefined,
  message:
    | string
    | discord.Embed
    | discord.Message.IOutgoingMessageOptions
    | null
    | undefined,
  deleteTime?: number
): Promise<discord.Message | undefined> {
  if (
    were === undefined ||
    were === null ||
    message === undefined ||
    message == null
  )
    return undefined;

  let sendMessageChannel: discord.GuildTextChannel | undefined;
  if (were instanceof discord.GuildTextChannel) {
    sendMessageChannel = were;
  } else if (
    were instanceof discord.GuildMemberMessage ||
    were instanceof discord.Message
  ) {
    sendMessageChannel = (await were.getChannel()) as discord.GuildTextChannel;
  } else {
    await discord
      .getGuildTextChannel(were as discord.Snowflake)
      .then(async (c) => (sendMessageChannel = c as discord.GuildTextChannel));
  }

  const msg:
    | discord.Message
    | undefined = await sendMessageChannel?.sendMessage(
    (message as unknown) as discord.Message.OutgoingMessageArgument<
      discord.Message.OutgoingMessageOptions
    >
  );

  await SaveClearMessages(sendMessageChannel?.id, msg?.id);

  if (deleteTime !== undefined)
    setTimeout(() => msg?.delete(), deleteTime > 30000 ? 28000 : deleteTime);

  return msg;
}

export function DateString(notbox?: boolean, shift?: number): string {
  const date: Date = new Date(Date.now() + (shift ?? 0));
  const _box = notbox ? '' : '`';
  return `${_box}[${date.getDate()}.${date.getMonth() +
    1}.${date.getUTCFullYear()} - ${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date
    .getSeconds()
    .toString()
    .padStart(2, '0')}]${_box}`;
}

export function TimeString(notbox?: boolean, shift?: number): string {
  const date: Date = new Date(Date.now() + (shift ?? 0));
  const _box = notbox ? '' : '`';
  return `${_box}[${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date
    .getSeconds()
    .toString()
    .padStart(2, '0')}]${_box}`;
}

// help msg
export async function HelpMsg(
  pageNr: number,
  permissionLvl: number | Definitions.PermsRolesEnum
): Promise<discord.Embed> {
  // get all prefixes
  let prefixString: string = '';
  for (let i: number = 0; i < Settings.prefixes.length; ) {
    prefixString += Settings.prefixes[i];
    if (++i < Settings.prefixes.length) prefixString += '/';
  }

  // cmds which are in help and for this permission
  const possibleCmds: Definitions.command[] = Settings.cmds
    .filter((c) => c.inHelp && c.permLvl <= permissionLvl!)
    .sort((a, b) => (a.permLvl as number) - (b.permLvl as number));

  // get the cmds for the given page
  let commandsArray: Definitions.command[] = [];
  for (let i: number = 0; i < Settings.nrElementsPage; ++i)
    commandsArray[i] = possibleCmds[i + pageNr * Settings.nrElementsPage];

  const nrPages: number = Math.ceil(
    possibleCmds.length / Settings.nrElementsPage
  );

  const embed: discord.Embed = new discord.Embed({
    color: Settings.Color.DEFAULT,
    title: 'Command: *.help*',
    description:
      '` The prefixes for this server are: "' +
      prefixString +
      '" `' +
      "\n**__Note:__ don't forget a parameter, otherwise a command won't work!**\nTo see the commands for other permission groups, use a number as parameter for the help command. If an argument has a `?` after it, it means that this argument is optional.",
    footer: {
      text: `${pageNr + 1}/${nrPages} - Help Lvl: ${
        permissionLvl <= Definitions.PermsRolesEnum.OWNER
          ? permissionLvl
          : Definitions.PermsRolesEnum.OWNER
      }`
    }
  });

  commandsArray.forEach(async (cmd) =>
    embed.addField({
      name: `${cmd.name}`,
      value:
        ((cmd.permLvl ?? 0) == 0
          ? `[@everyone] `
          : `[<@&${Settings.RolePerms[(cmd.permLvl as number) ?? 0]}>] `) +
        `${cmd.description}\n${
          cmd.password ?? false ? ' Requires password!' : ''
        }`
    })
  );

  return embed;
}

// logs actions of the bot in the #bot channel
export async function Log(
  color: number,
  title: string,
  message: string
): Promise<void> {
  await SendMessage(
    Settings.Channels.BOT,
    new discord.Embed({
      color: color,
      title: title,
      description: message,
      timestamp: new Date().toISOString()
    })
  );
}

// GHC Embeds
export async function GHCEmbed(nr: number): Promise<discord.Embed> {
  const guild: discord.Guild = await discord.getGuild();
  const Owner: discord.GuildMember | null = await guild?.getMember(
    guild.ownerId
  );

  const aMSG: discord.Embed = new discord.Embed({
    color: Settings.Color.DEFAULT,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'GHCBot',
      iconUrl: guild?.getIconUrl()?.toString() ?? undefined
    },
    thumbnail: { url: Settings.GHC_MSGS[nr].img ?? undefined },
    title: Settings.GHC_MSGS[nr].Title,
    description: Settings.GHC_MSGS[nr].Description,
    author: {
      name:
        Settings.GHC_MSGS[nr].Author ?? false
          ? Owner?.user.username
          : undefined,
      iconUrl:
        Settings.GHC_MSGS[nr].Author ?? false
          ? Owner?.user.getAvatarUrl().toString() ?? undefined
          : undefined
    }
  });

  // add all fields to the embed from the settings.array
  if ((Settings.GHC_MSGS[nr].Fields ?? undefined) !== undefined)
    for await (let f of Settings.GHC_MSGS[nr].Fields!) aMSG.addField(f);

  return aMSG;
}

// fires up on error - to do
export async function OnError(
  msg: discord.command.ICommandContextDeprecated,
  arg?: any
): Promise<void> {
  console.log(msg.command);
  await SendMessage(
    msg.message,
    new discord.Embed({
      color: Settings.Color.ERROR,
      title: 'Error',
      description: `${msg.message.member.toMention()} An error occured!\nHere the arguments you need: ${
        (msg.command as any).options.description
      }`
    })
  );

  if (!msg) {
    console.log('Error1');
    return;
  }

  console.log('Error2');
}

// save message ids
export async function SaveClearMessages(
  channelId: discord.Snowflake | undefined,
  messageId: discord.Snowflake | undefined
): Promise<void> {
  if (messageId === undefined || channelId === undefined) return;

  let messages: discord.Snowflake[] =
    (await BetterKV.get<discord.Snowflake[]>(
      `messages-${channelId}`,
      'clearcmd'
    )) ?? [];

  messages.push(messageId);
  while (JSON.stringify(messages).length > 8192) messages.splice(0, 1);

  await BetterKV.save(`messages-${channelId}`, messages, 'clearcmd');
}

function TimeCalculator(
  time: string,
  size:
    | 'ns'
    | 'μs'
    | 'ms'
    | 's'
    | 'min'
    | 'h'
    | 'd'
    | 'w'
    | 'mth'
    | 'y'
    | 'a'
    | 'dec'
    | 'cen'
): number | undefined {
  if (
    time
      .split('')
      .some(
        (s) =>
          ![
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '.',
            ':'
          ].includes(s)
      )
  )
    return;

  if (!time.includes(':')) {
    if (isNaN(Number.parseFloat(time))) return;
    else return Number.parseFloat(time) * Settings.timeUnits[size];
  }

  const times: string[] = time.split(':');

  const firstTime: number = Number.parseInt(times[0]!);
  let secondTime: number = Number.parseInt(times[1]!);

  if (times.length !== 2 || isNaN(firstTime) || isNaN(secondTime)) return;

  if (times[1].toString().length < 2) secondTime *= 10;
  else
    while (secondTime.toString().length > 2)
      secondTime = Number.parseInt(secondTime / 10 + '');

  if (size === 'min')
    return (
      firstTime * Settings.timeUnits['min'] +
      secondTime * Settings.timeUnits['s']
    );
  if (size === 'h')
    return (
      firstTime * Settings.timeUnits['h'] +
      secondTime * Settings.timeUnits['min']
    );

  return;
}

export function CustomTimeStringToMS(time?: string): number | undefined {
  if (time === undefined) return;

  time = time
    .split(' ')
    .join('')
    .toLowerCase();

  for (const key in Settings.timeUnitsAlliases) {
    let finalTime: number | undefined;

    finalTime = TimeCalculator(time.replace(key, ''), key as any);
    if (finalTime !== undefined) return finalTime;

    for (const keys of Settings.timeUnitsAlliases[key as 'ms']) {
      if (keys.includes('(s)')) {
        finalTime = TimeCalculator(
          time.replace(keys.replace('(s)', 's'), ''),
          key as any
        );
        if (finalTime !== undefined) return finalTime;
        finalTime = TimeCalculator(
          time.replace(keys.replace('(s)', ''), ''),
          key as any
        );
        if (finalTime !== undefined) return finalTime;
      } else {
        finalTime = TimeCalculator(time.replace(keys, ''), key as any);
        if (finalTime !== undefined) return finalTime;
      }
    }
  }

  return;
}

// check if two objects are the same
function isEquivalent(a: any, b: any): boolean {
  // Create arrays of property names
  let aProps = Object.getOwnPropertyNames(a);
  let bProps = Object.getOwnPropertyNames(b);

  // sorting so they are in the same order (the order of properties)
  aProps.sort();
  bProps.sort();

  // If number of properties is different,
  // objects are not equivalent
  if (aProps.length != bProps.length) return false;

  for (var i = 0; i < aProps.length; i++) {
    let propName = aProps[i];

    // If values of same property are not equal,
    // objects are not equivalent
    if (a[propName] !== b[propName]) return false;
  }

  // If we made it this far, objects
  // are considered equivalent
  return true;
}

// check if two objects are the same but not strictly since b has to have all properties of a but not the otherway around
function hasProperties(a: any, b: any): boolean {
  // Create arrays of property names
  const aProps: string[] = Object.getOwnPropertyNames(a);

  for (var i = 0; i < aProps.length; i++) {
    let propName: string = aProps[i];

    // If values of same property are not equal,
    // objects are not equivalent
    if (a[propName] !== b[propName]) return false;
  }

  return true;
}

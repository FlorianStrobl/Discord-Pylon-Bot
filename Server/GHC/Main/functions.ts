import * as Definitions from './definitions';
import * as Settings from './settings';

export function TimeString(): string {
  return (
    '`[' +
    `${new Date(Date.now())
      .getHours()
      .toString()
      .padStart(2, '0')}:${new Date(Date.now())
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${new Date(Date.now())
      .getSeconds()
      .toString()
      .padStart(2, '0')}` +
    ']`'
  );
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
  const possibleCmds: Array<Definitions.command> = Settings.cmds
    .filter((c) => c.inHelp && c.permLvl <= permissionLvl!)
    .sort((a, b) => a.permLvl - b.permLvl);

  // get the cmds for the given page
  let commandsArray: Array<Definitions.command> = [];
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
          : `[<@&${Settings.RolePerms[cmd.permLvl ?? 0]}>] `) +
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
  await discord
    .getGuildTextChannel(Settings.Channels.BOT)
    .then(async (channel) => {
      await channel?.sendMessage(
        new discord.Embed({
          color: color,
          title: title,
          description: message,
          timestamp: new Date().toISOString()
        })
      );
    });
}

export async function ClearMessages(
  messageId: string,
  channelId: string
): Promise<void> {
  let messages: string[] =
    (await Definitions.KV.get(`messages-${channelId}`)) ?? [];
  messages.push(messageId);
  while (JSON.stringify(messages).length > 8192) messages.splice(0, 1);

  await Definitions.KV.put(`messages-${channelId}`, messages);
}

// GHC Embeds
export async function GHCEmbed(nr: number): Promise<discord.Embed> {
  const guild: discord.Guild = await discord.getGuild();
  const Owner: discord.GuildMember | null = await guild?.getMember(
    await guild.ownerId
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
  if ((Settings.GHC_MSGS[nr].Fields ?? undefined) !== undefined) {
    for await (let f of Settings.GHC_MSGS[nr].Fields!) {
      aMSG.addField(f);
    }
  }

  return aMSG;
}

// fires up on error - to do
export async function OnError(
  msg: discord.command.ICommandContextDeprecated,
  arg?: any
): Promise<void> {
  console.log(msg.command);
  msg.message.reply(
    new discord.Embed({
      color: Settings.Color.ERROR,
      title: 'Error',
      description: `${msg.message.member.toMention()} An error occured!\nHere the arguments you need: ${
        // @ts-ignore
        msg.command.options.description
      }`
    })
  );
  if (!msg) {
    console.log('Error1');
    return;
  }

  console.log('Error2');
}

// delete msg after X milliseconds
export async function delMsg(
  msg: discord.Message | discord.Channel,
  duration: number
): Promise<void> {
  setTimeout(
    async () => await msg?.delete(),
    duration < 20000 ? duration : 19000
  );
}

export async function getPwd(pwd?: string): Promise<string | boolean> {
  const cPwd: string | undefined = await Definitions.KV.get<string>(`pwd`);

  if (cPwd === undefined) return false;
  if (pwd !== undefined) return cPwd === pwd;
  console.log('k');
  return cPwd;
}

// get the size in bytes of an object saved as JSON
const GetSize = async (data: any) => JSON.stringify(data).length;

// get size in bytes from a key in KV
async function GetKeySize(key: string): Promise<number | undefined> {
  let value: any = await Definitions.KV.get(key);
  if (value !== undefined && value !== null) {
    return JSON.stringify(value).length;
  } else {
    return undefined;
  }
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
  const aProps: Array<string> = Object.getOwnPropertyNames(a);

  for (var i = 0; i < aProps.length; i++) {
    let propName: string = aProps[i];

    // If values of same property are not equal,
    // objects are not equivalent
    if (a[propName] !== b[propName]) return false;
  }

  return true;
}

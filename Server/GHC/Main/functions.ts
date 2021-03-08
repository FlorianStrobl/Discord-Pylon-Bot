import * as Settings from './settings';
import * as Definitions from './definitions';
import * as Database from './database';

// enabled-
// only channel-
// whitelisted user
// whitelisted roles
// blacklisted channel
// blacklisted user
// blacklisted roles
// general perms (roles X and above)
// password

// Check stuff for cmd
export async function OnCmd(
  msg: discord.GuildMemberMessage,
  cmd: Definitions.command,
  pwd?: string
): Promise<boolean> {
  if (!Settings.enabled) {
    // bot disabled
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: Settings.botMessages.en.botDisabled
      })
    );
    return false;
  }

  if (
    cmd.cooldown !== 0 &&
    Date.now() <
      ((await Database.GetData(`user-${msg.member.user.id}`, 'user'))?.c ??
        Number.MAX_SAFE_INTEGER)
  ) {
    // user is in cooldown
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: Settings.botMessages.en.cmdCooldownMsg.replace(
          'x',
          (
            ((await Database.GetData(`user-${msg.member.user.id}`, 'user'))?.c -
              Date.now()) /
            1000
          ).toString()
        )
      })
    );
    return false;
  } else if (cmd.cooldown !== 0) {
    await Database.UpdateDataValues(
      `user-${msg.member.user.id}`,
      (u) => {
        u.c = Date.now() + cmd.cooldown;
        return u;
      },
      'user'
    );
  }

  if (!cmd.enabled) {
    // cmd disabled
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: Settings.botMessages.en.cmdNotActive
      })
    );
    return false;
  }

  if (
    cmd.password === true &&
    pwd !== ((await Definitions.KV.get<string>(`pwd`)) ?? null)
  ) {
    // wrong password
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: Settings.botMessages.en.cmdNotPassword
      })
    );
    return false;
  }

  if (
    (cmd.blacklistUserRolesChannel.length !== 0 &&
      (cmd.blacklistUserRolesChannel.includes(msg.member.user.id) ||
        msg.member.roles.some((r) =>
          cmd.blacklistUserRolesChannel.includes(r)
        ))) ||
    (Settings.noCommands.length !== 0 &&
      (Settings.noCommands.includes(msg.member.user.id) ||
        msg.member.roles.some((r) => Settings.noCommands.includes(r))))
  ) {
    // user/role is on global/local blacklist
    await noPermMsg(msg, cmd);
    return false;
  }

  if (
    (cmd.blacklistUserRolesChannel.length !== 0 &&
      cmd.blacklistUserRolesChannel.includes(msg.channelId)) ||
    (cmd.onlyChannels.length !== 0 &&
      !cmd.onlyChannels.includes(msg.channelId)) ||
    (Settings.noCommands.length !== 0 &&
      Settings.noCommands.includes(msg.channelId))
  ) {
    // channel is on global/local/manual blacklist
    await msg
      ?.reply(
        new discord.Embed({
          color: Settings.Color.ERROR,
          title: 'Error',
          description: Settings.botMessages.en.cmdNotChannel
        })
      )
      .then(async (m) => setTimeout(async () => await m?.delete(), 10000));
    return false;
  }

  if (cmd.onlyBotChatMsg === true) {
    // only #bot msg
    await delMsg(
      await msg?.reply(
        new discord.Embed({
          color: Settings.Color.RED,
          timestamp: new Date().toISOString(),
          title: 'Warnung',
          description: `Bitte schreibe diesen Command in den <#${Settings.Channels.CMD}> channel.`
        })
      ),
      10000
    );
  }

  if (
    cmd.whitelistedUserRoles.length !== 0 &&
    (cmd.whitelistedUserRoles.includes(msg.member.user.id) ||
      msg.member.roles.some((r) => cmd.whitelistedUserRoles.includes(r)))
  ) {
    // user/role has permission because whitelist
    return true;
  }

  if (
    Settings.RolePerms.filter(
      (p) => Settings.RolePerms.indexOf(p) >= cmd.permLvl
    ).some((r) => msg.member.roles.includes(r))
  ) {
    // user has permission because of role
    return true;
  }

  await noPermMsg(msg, cmd);
  return false;
}

// help msg
export async function HelpMsg(
  pageNr: number,
  permissionLvl: number | Definitions.PermsRolesEnum
): Promise<discord.Embed> {
  const possibleCmds: Array<Definitions.command> = Settings.cmds
    .filter((c) => c.inHelp && c.permLvl <= permissionLvl!)
    .sort((a, b) => a.permLvl - b.permLvl);

  const nrPages: number = Math.ceil(
    possibleCmds.length / Settings.nrElementsPage
  );

  let commandsArray: Array<Definitions.command> = [];
  // get the cmds for the given page
  for (let i: number = 0; i < Settings.nrElementsPage; i++)
    commandsArray[i] = possibleCmds[i + pageNr * Settings.nrElementsPage];

  const embed: discord.Embed = new discord.Embed({
    color: Settings.Color.DEFAULT,
    title: 'Command: *.help*',
    description:
      '` The prefixes for this server are: "./!" `' +
      "\n**__Note:__ don't forget a parameter, otherwise a command won't work!**\nTo see the commands for other permission groups, use a number as parameter for the help command. If an argument has a `?` after it, it means that this argument is optional.",
    footer: {
      text: `${pageNr + 1}/${nrPages} - Help Lvl: ${
        permissionLvl <= Definitions.PermsRolesEnum.OWNER
          ? permissionLvl
          : Definitions.PermsRolesEnum.OWNER
      }`
    }
  });

  commandsArray.forEach(async (cmd) => {
    embed.addField({
      name: `${cmd.name}`,
      value:
        ((cmd.permLvl ?? 0) == 0
          ? `[@everyone] `
          : `[<@&${Settings.RolePerms[cmd.permLvl ?? 0]}>] `) +
        `${cmd.description}\n${
          cmd.password ?? false ? ' Requires password!' : ''
        }`
    });
  });

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
      description: `${msg.message.member.toMention()} An error occured! Did you forgot an argument? See the needed arguments with !help. If you didn't forget an argument and you have the permission to do the command, write a bug report in the <#${
        Settings.Channels.FEEDBACK
      }> channel please.`
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

// get the size in bytes of an object saved as JSON
async function GetSize(data: any): Promise<number> {
  return JSON.stringify(data).length;
}

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

// error msg for no permissions
async function noPermMsg(
  msg: discord.Message,
  cmd: Definitions.command
): Promise<void> {
  await discord.getGuild(discord.getGuildId()).then(async (guild) => {
    await discord
      .getGuildTextChannel(Settings.Channels.BOT)
      .then(async (channel) => {
        await channel?.sendMessage(
          new discord.Embed({
            color: Settings.Color.ERROR,
            title: '🔒 Error',
            timestamp: new Date().toISOString(),
            thumbnail: { url: msg.member?.user.getAvatarUrl() ?? undefined },
            footer: {
              text: 'GHCBot',
              iconUrl: guild?.getIconUrl()?.toString()
            },
            fields: [
              {
                name: 'User',
                value: msg.member?.toMention() ?? `-`,
                inline: true
              },
              { name: 'Channel', value: `<#${msg.channelId}>`, inline: true },
              { name: 'Command', value: cmd.name, inline: true },
              {
                name: 'Message content',
                value: msg.content ?? `-`,
                inline: false
              }
            ]
          })
        );
      });
  });

  await msg?.reply(
    new discord.Embed({
      color: Settings.Color.ERROR,
      title: '🔒 Error',
      description: Settings.botMessages.en.cmdNoPerms.replace(
        '@user',
        msg.member!.toMention()
      )
    })
  );
}

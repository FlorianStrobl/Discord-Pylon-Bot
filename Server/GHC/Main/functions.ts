import * as Settings from './settings';

import * as Definitions from './definitions';

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
      ((await GetUser(msg.member.user.id))?.c ??
        Number.MAX_SAFE_INTEGER / 1000) *
        1000
  ) {
    // user is in cooldown
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: Settings.botMessages.en.cmdCooldownMsg.replace(
          'x',
          (
            ((await GetUser(msg.member.user.id))!.c - Date.now()) /
            1000
          ).toString()
        )
      })
    );
    return false;
  } else if (cmd.cooldown !== 0) {
    await ChangeUserValues(msg.member.user.id, (u) => {
      u.c = Date.now() + cmd.cooldown;
      return u;
    });
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
    await NoPermissionMsg(msg, cmd);
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
      10000,
      await msg?.reply(
        new discord.Embed({
          color: Settings.Color.RED,
          timestamp: new Date().toISOString(),
          title: 'Warnung',
          description: `Bitte schreibe diesen Command in den <#${Settings.Channels.CMD}> channel.`
        })
      )
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

  await NoPermissionMsg(msg, cmd);
  return false;
}

// error msg for no permissions
export async function NoPermissionMsg(
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

// send embed in #news with or without title
export async function MsgNewschannel(
  description: string | undefined,
  title?: string
): Promise<void> {
  if (!description) return;

  await discord
    .getGuildNewsChannel(Settings.Channels.NEWS)
    .then(async (channel) => {
      await channel?.sendMessage(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          description: description,
          title:
            title === undefined || title === null || title === ''
              ? undefined
              : title,
          timestamp:
            title === undefined || title === null || title === ''
              ? undefined
              : new Date().toISOString()
        })
      );
    });
}

// delete msg after X milliseconds
export async function delMsg(
  duration: number,
  msg: discord.Message | discord.Channel
): Promise<void> {
  setTimeout(
    async () => await msg?.delete(),
    duration < 20000 ? duration : 19000
  );
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

// get the size in bytes of an object saved as JSON
export async function GetSize(data: any): Promise<number> {
  return JSON.stringify(data).length;
}

// get size in bytes from a key in KV
export async function GetKeySize(key: string): Promise<number | undefined> {
  let value: any = await Definitions.KV.get(key);
  if (value !== undefined && value !== null) {
    return JSON.stringify(value).length;
  } else {
    return undefined;
  }
}

// save the values for an given user
export async function SaveUser(user: Definitions.GHC_User): Promise<void> {
  try {
    let size: number = (await Definitions.KV.get<number>(`userCountSize`)) ?? 0;

    // TO DO: new user values are to much so new Key

    let users: Array<Definitions.GHC_User>;

    // check if user is already in a key and change + return if so
    for (let i: number = 0; i <= size; i++) {
      users =
        (await Definitions.KV.get<Array<Definitions.GHC_User>>(`user.${i}`)) ??
        [];

      let index: number = users.findIndex((u) => u.i === user.i);

      if (index !== -1) {
        // change value of existing user in local array
        users[index] = user;
        if ((await GetSize(users)) <= Settings.maxSizePerKey) {
          //console.log('user saved in current key');
          // not too big for KV
          await Definitions.KV.put(`user.${i}`, users);
        } else {
          //console.log('user was too big for current key');
          // too big for KV so:
          users.splice(index, 1);
          await Definitions.KV.put(`user.${i}`, users);
          // user is now deleted from the KV so he is handlet as a new User
          await SaveUser(user); // this should be pretty rare so no real performance lost
        }
        return;
      }
    }

    // it is a new user
    for (let i: number = 0; i <= size; i++) {
      users =
        (await Definitions.KV.get<Array<Definitions.GHC_User>>(`user.${i}`)) ??
        [];

      if (users.length === 0 && size === 0)
        await Definitions.KV.put(`userCountSize`, 0);

      users.push(user);

      if ((await GetSize(users)) <= Settings.maxSizePerKey) {
        //console.log('new user in some key saved');
        // user is added to this key because here is some space left
        await Definitions.KV.put(`user.${i}`, users);
        return;
      }
    }

    // no key had space so new key is cerated
    size++;
    await Definitions.KV.put(`userCountSize`, size);
    await Definitions.KV.put(`user.${size}`, [user]);
  } catch (e) {
    console.log(e + '1');
  }
}

// deletes the values for an given userId
export async function DeleteUser(userId: string): Promise<void> {
  let size: number = (await Definitions.KV.get<number>(`userCountSize`)) ?? 0;

  // get the user in the array if in it
  for (let i: number = 0; i <= size; i++) {
    let users: Array<Definitions.GHC_User> =
      (await Definitions.KV.get<Array<Definitions.GHC_User>>(`user.${i}`)) ??
      [];

    let index: number = users.findIndex((u) => u.i === userId);

    if (index !== -1) {
      // in this array is the user, so delete user from the array
      users.splice(index, 1);

      if (users.length === 0) {
        // if array is empty, delete the whole key and bring the order right
        await Definitions.KV.delete(`user.${i}`);
        await ChangeUserOrder();
      } else {
        // if it is not empty, save the new values
        await Definitions.KV.put(`user.${i}`, users);
      }

      return;
    }
  }
}

// if e.g. key 4 is deleted, but the size was 7
async function ChangeUserOrder(): Promise<void> {
  let size: number = (await Definitions.KV.get<number>(`userCountSize`)) ?? 0;
  let users: Array<Definitions.GHC_User> | undefined;

  for (let i: number = 0; i <= size; i++) {
    users = await Definitions.KV.get<Array<Definitions.GHC_User>>(`user.${i}`);

    if (users === undefined) {
      size--;
      await Definitions.KV.put(`userCountSize`, size);

      for (let y: number = i; y <= size; y++) {
        // put the next value in the key before
        await Definitions.KV.put(
          `user.${y}`,
          (await Definitions.KV.get<Array<Definitions.GHC_User>>(
            `user.${y + 1}`
          )) ?? []
        );
      }
      return;
    }
  }
}

// returns the values for an given userId
export async function GetUser(
  userId: string
): Promise<Definitions.GHC_User | undefined> {
  let size: number = (await Definitions.KV.get<number>(`userCountSize`)) ?? 0;
  let user: Definitions.GHC_User | undefined;

  for (let i: number = 0; i <= size; i++) {
    user = (
      (await Definitions.KV.get<Array<Definitions.GHC_User>>(`user.${i}`)) ?? []
    ).find((u) => u.i === userId);

    if (user !== undefined) return user;
  }

  return undefined;
}

// return all user
export async function GetAllUser(): Promise<
  Array<Definitions.GHC_User> | undefined
> {
  const size: number = (await Definitions.KV.get<number>(`userCountSize`)) ?? 0;

  let users: Array<Definitions.GHC_User> = [];
  for (let i: number = 0; i <= size; i++) {
    users = users.concat(
      (await Definitions.KV.get<Array<Definitions.GHC_User>>(`user.${i}`)) ?? []
    );
  }

  if (users.length === 0) return undefined;

  return users;
}

// return all user with this properties
export async function GetAllUserWith(
  cb: (value: Definitions.GHC_User) => boolean
): Promise<Array<Definitions.GHC_User> | undefined> {
  let user: Array<Definitions.GHC_User> = (await GetAllUser()) ?? [];
  let filtered: Array<Definitions.GHC_User> = [];

  for (let i = 0; i < user.length; ++i) if (cb(user[i])) filtered.push(user[i]);

  if (filtered.length === 0) return undefined;

  return filtered;
}

// change user values
export async function ChangeUserValues(
  userId: string,
  cb: (user: Definitions.GHC_User) => Definitions.GHC_User
): Promise<void> {
  let size: number = (await Definitions.KV.get<number>(`userCountSize`)) ?? 0;

  for (let i: number = 0; i <= size; ++i) {
    let users: Array<Definitions.GHC_User> =
      (await Definitions.KV.get<Array<Definitions.GHC_User>>(`user.${i}`)) ??
      [];

    let n: number = users.findIndex((u) => u.i === userId);

    if (n !== -1) {
      await SaveUser(cb(users[n]));
      return;
    }
  }
}

// TO DO
async function OptimizeDatabase(alg?: 'size' | 'index', del?: boolean) {
  let size: number = (await Definitions.KV.get<number>(`userCountSize`)) ?? 0;

  // delete data you can't access (but this can be caussed because you hit Pylon Limits, so maybe it deletes data you want)
  if (del === true)
    for (let i: number = size; i < size + 10; i++)
      if (
        (await Definitions.KV.get<Definitions.GHC_User>(`user.${i}`)) !==
        undefined
      )
        await Definitions.KV.delete(`user.${i}`);

  await ChangeUserOrder();

  if (alg !== undefined && alg !== null) {
    let user: Definitions.GHC_User[] = [];

    if (alg === 'index') {
      // sort data in index
      user = user.concat(
        (await GetAllUser())?.sort(function(a, b) {
          if (a.i.toLowerCase() > b.i.toLowerCase()) return 1;
          else if (a.i.toLowerCase() < b.i.toLowerCase()) return -1;
          else return 0;
        }) ?? []
      );
    } else if (alg === 'size') {
      // sort data in size (from lowest to highest)
      user = user.concat(
        (await GetAllUser())?.sort(
          (a, b) => JSON.stringify(a).length - JSON.stringify(b).length
        ) ?? []
      );
    }

    if (user.length !== 0) {
      // delete old values and save new ones
      for (let i: number = 0; i <= size; i++)
        await Definitions.KV.delete(`user.${i}`);

      for (let i: number = 0; i < user.length; i++) await SaveUser(user[i]);
    }
  }
}

// check if two objects are the same
export function isEquivalent(a: any, b: any): boolean {
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

// check if two objects are the same
export function hasProperties(a: any, b: any): boolean {
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

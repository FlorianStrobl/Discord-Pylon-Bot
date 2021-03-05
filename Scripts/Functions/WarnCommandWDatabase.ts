const adminRoles: string[] = ['id'];
const warnRole: string = 'id';
const removeRole: string = 'id';
const adminLogChannel: string = 'id';

const WarnCommands: discord.command.CommandGroup = new discord.command.CommandGroup(
  {
    defaultPrefix: '!'
  }
);

import * as Database from './database'; // code here "https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/Functions/Database.ts"

interface structure {
  index: string;
  reason: string[];
  author: string[];
}

WarnCommands.on(
  {
    name: 'warn',
    description: 'warn a user'
  },
  (_arguments) => ({
    member: _arguments.guildMember(),
    reason: _arguments.text()
  }),
  async (message, { member, reason }) => {
    if (!message.member.roles.some((r) => adminRoles.includes(r))) {
      await message.reply('You are not permitted to use this command.');
      return;
    }

    if (member.roles.some((r) => adminRoles.includes(r))) {
      await message.reply("You can't warn a teammember.");
      return;
    }

    if (member.user.bot) {
      await message.reply("You can't warn a bot.");
      return;
    }

    try {
      await member.removeRole(removeRole);
      await member.addRole(warnRole);
    } catch (_) {}

    await message.reply(
      `User ${member.toMention()} was warned by ${message.member.toMention()} with the reason: "${reason}".`
    );

    discord
      .getGuildTextChannel(adminLogChannel)
      .then((channel) =>
        channel?.sendMessage(
          `User ${member.toMention()} was warned by ${message.member.toMention()} with the reason: "${reason}".`
        )
      );

    const oldData = await Database.GetData(
      `warncase-${member.user.id}`,
      'warncases'
    );
    if (oldData === undefined)
      await Database.SaveData(
        {
          index: `warncase-${member.user.id}`,
          reason: [reason],
          author: [message.member.user.id]
        },
        'warncases'
      );
    else
      await Database.UpdateDataValues(
        `warncase-${member.user.id}`,
        // @ts-ignore
        (data: structure) => {
          data.reason.push(reason);
          data.author.push(message.member.user.id);
          return data;
        },
        'warncases'
      );
  }
);

WarnCommands.on(
  {
    name: 'get-warn',
    description: 'get warn infos about a user'
  },
  (_arguments) => ({
    user: _arguments.guildMember()
  }),
  async (message, { user }) => {
    if (!message.member.roles.some((r) => adminRoles.includes(r))) {
      await message.reply('You are not permitted to use this command.');
      return;
    }

    // @ts-ignore
    const infos: undefined | structure = await Database.GetData(
      `warncase-${user.user.id}`,
      'warncases'
    );

    if (infos === undefined) await message.reply('No cases for this user!');
    else {
      let msg: string = `Warn cases for user <@${user.user.id}>: `;
      console.log(infos);
      for (let i: number = 0; i < infos.reason.length; ++i) {
        console.log('once');
        msg = msg.replace(
          msg,
          msg +
            `\nAuthor: <@${infos.author[i] ?? 'no id'}>. Reason: ${infos.reason[
              i
            ] ?? 'no reason'}`
        );
      }

      await message.reply(msg);
    }
  }
);

WarnCommands.on(
  {
    name: 'delete-warn',
    description: 'delete all the cases from a user'
  },
  (_arguments) => ({
    user: _arguments.guildMember()
  }),
  async (message, { user }) => {
    if (!message.member.roles.some((r) => adminRoles.includes(r))) {
      await message.reply('You are not permitted to use this command.');
      return;
    }

    if (await Database.DeleteData(`warncase-${user.user.id}`, 'warncases'))
      await message.reply(
        `Warn cases for the user ${user.toMention()} were succesfully deleted.`
      );
    else
      await message.reply(
        `No warn cases were deleted for the user ${user.toMention()}. Probably were no data saved before...`
      );
  }
);

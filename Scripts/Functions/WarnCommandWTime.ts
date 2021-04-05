// Florian Crafter - March 2021 - Version 1.0

// Command: !ban <user | userId> <time> <reason?>
// Command: !revokeBan <userId>

// This script uses my time script (https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/Functions/TimeStringToMS.ts)
// You have to copy it and then import the CustomTimeStringToMS() function

// You can use your own KV or Command Group, just dont forget that the KV key is `bans`.
// Since the data is {user, duration} and saved as an Array in KV, you can only save about 130 bans, since the KV has a maximum of 8196 bytes...
// If you need more, you have to delete some KV data and remove the bans manually...
// !!! THE TIME HAS TO BE WITHOUT SPACES !!!
// If you want a perma ban, just put the maximum time (per default 2years) as time.

// the time precision is +-5min

const commands = new discord.command.CommandGroup();
const banKv = new pylon.KVNamespace('bans');

import { CustomTimeStringToMS } from './time';

const adminRolesOrUser: string[] = [];
const logChannel: string = '';
const maxTime: number = 1000 * 60 * 60 * 24 * 365 * 2;

commands.on(
  { name: 'revokeBan', filters: discord.command.filters.canBanMembers() },
  (args) => ({
    userId: args.string()
  }),
  async (message, { userId }) => {
    let result: boolean = false;
    try {
      discord.getGuild().then(async (guild) => {
        await guild.deleteBan(userId);
      });
      result = true;
    } catch (error) {
      await message?.reply(
        `The user itself couldn't get unbanned. Error ${error}`
      );
    }

    try {
      let bans:
        | { userId: string; duration: number }[]
        | undefined = await getBans();

      if (bans === undefined && result === false) {
        await message?.reply(`There are currently no bans saved.`);
        return;
      }

      for (let i: number = 0; i < bans.length; ++i)
        if (bans[i].userId === userId) bans.splice(i, 1);

      await saveBans(bans);

      if (logChannel === '' || logChannel == null)
        await message?.reply(`The user [${'`' + userId + '`'}] was unbanned.`);
      else
        discord
          .getGuildTextChannel(logChannel)
          .then(
            async (c) =>
              await c?.sendMessage(
                `The user [${'`' + userId + '`'}] was unbanned.`
              )
          );
    } catch (error) {
      await message?.reply(`Error! The error is: ${error}`);
    }
  }
);

commands.on(
  { name: 'ban', filters: discord.command.filters.canBanMembers() },
  (args) => ({
    member: args.guildMember(),
    time: args.string(),
    reason: args.textOptional()
  }),
  async (message, { member, time, reason }) => {
    if (
      member.roles.some((r) => adminRolesOrUser.includes(r)) ||
      adminRolesOrUser.includes(member.user.id)
    ) {
      // check if the member should be bannable
      await message?.reply(
        `You can't warn a person with a role higher than yours or with the same role.`
      );
      return;
    }

    // the actuall ban
    try {
      await member.ban({ reason: reason ?? `You have been banned. F` });
    } catch (error) {
      await message?.reply(
        `Error! The member ${member.toMention()} couldn't been ban. Error message: ${error}`
      );
      return;
    }

    const duration: number | undefined = CustomTimeStringToMS(time);

    // time gets saved
    if (
      (duration ?? Number.MAX_SAFE_INTEGER) < maxTime &&
      (duration ?? Number.MAX_SAFE_INTEGER) > 0
    ) {
      let currentData: { userId: string; duration: number }[] =
        (await getBans()) ?? [];

      currentData.push({
        userId: member.user.id,
        duration: Date.now() + (duration ?? 0)
      });

      if (JSON.stringify(currentData).length > 8196) {
        await message?.reply(
          `Error! You have saved too many bans. The system can't save anymore. Clear the old bans to ban a new user, or ban him without a time limitation.`
        );
        // You have to open "new pylon.KVNamespace('bans').get('bans')" and delete some of the data since you only can save data up to 8196 bytes.
        throw new Error(`Data size is over 8196 bytes.`);
      } else await saveBans(currentData);
    }

    // the ban message
    let banMessage: string = `Done. ${member.user.username} has been banned. Reason: *${reason}*. `;

    if ((duration ?? Number.MAX_SAFE_INTEGER) < maxTime)
      banMessage +=
        duration === undefined || duration < 0
          ? `The ban has no time set.`
          : `The user is banned for ${(duration / 3.6e6).toFixed(2)} hours.`;

    if (logChannel === '' || logChannel == null)
      await message?.reply(banMessage);
    else
      discord
        .getGuildTextChannel(logChannel)
        .then(async (c) => await c?.sendMessage(banMessage));
  }
);

pylon.tasks.cron('bans', '0 0/5 * * * * *', async () => {
  let data:
    | { userId: string; duration: number }[]
    | undefined = await getBans();

  if (data === undefined) return;

  for (let i: number = 0; i < data.length; ++i) {
    if (data[i].duration <= Date.now()) {
      // time for a user is over
      discord.getGuild().then(async (guild) => {
        try {
          // deletes the ban
          await guild.deleteBan((data as any)[i].userId);

          if (logChannel != null || logChannel !== '')
            await discord.getGuildTextChannel(logChannel).then(async (c) => {
              await c?.sendMessage(
                `User [${'`' +
                  (data as any)[i].userId +
                  '`'}] was automatically unbanned.`
              );
            });
        } catch (error) {
          console.log(error);
        }

        (data as any).splice(i, 1);

        await saveBans(data);
      });
    }
  }
});

async function getBans(): Promise<
  { userId: string; duration: number }[] | undefined
> {
  return await banKv.get<{ userId: string; duration: number }[]>(`bans`);
}

async function saveBans(
  data: { userId: string; duration: number }[] | null | undefined
): Promise<boolean> {
  try {
    if (data === undefined || data === null || data.length === 0)
      await banKv.delete(`bans`);
    else await banKv.put(`bans`, data);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

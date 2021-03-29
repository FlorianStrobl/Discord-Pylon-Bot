import * as Definitions from '../Main/definitions';
import * as Settings from '../Main/settings';
import * as Functions from '../Main/functions';
import * as Database from '../Main/database';

export async function ClearCommand(
  message: discord.Message,
  n: number
): Promise<void> {
  let messages: string[] | undefined = await Definitions.KV.get(
    `messages-${message.channelId}`
  );
  if (messages === undefined) return;

  const channel = await discord.getGuildTextChannel(message.channelId);

  let toDeleteMessages: string[] = [];
  for (
    let i = messages.length - (n <= messages.length ? n : messages.length);
    i < messages.length;
    ++i
  )
    toDeleteMessages.push(messages[i]);

  if (toDeleteMessages.length === 1)
    await (await channel?.getMessage(toDeleteMessages[0]))?.delete();
  else if (toDeleteMessages.length !== 0)
    await channel?.bulkDeleteMessages(toDeleteMessages);

  await Definitions.KV.put(
    `messages-${message.channelId}`,
    messages.filter((mId) => !toDeleteMessages.includes(mId))
  );

  await message.delete();
  const responseMsg = await message?.reply(
    `Deleted the last ${toDeleteMessages.length} messages from this channel.`
  );
  setTimeout(() => responseMsg.delete(), 10000);
}

export async function HelpCommand(
  msg: discord.GuildMemberMessage,
  helpLvlOrName: string | null
): Promise<void> {
  if (!(await OnCmd(msg, Settings.helpCommand))) return;

  await msg?.delete();
  let helpLvl: number = 1;

  if (helpLvlOrName !== null) {
    // it isn't just null
    if (!isNaN(parseInt(helpLvlOrName))) {
      // it is a number
      helpLvl = parseInt(helpLvlOrName);
    } else {
      // NaN so it is a string
      let searchedCmd: Definitions.command | undefined = Settings.cmds.find(
        (c) =>
          c.name.toString().toLowerCase() === helpLvlOrName!.toLowerCase() ||
          c.altNames.some(
            (v) => v.toLowerCase() === helpLvlOrName!.toLowerCase()
          )
      );

      if (searchedCmd !== undefined) {
        // it is a command name so give the help
        await msg?.reply({
          embed: new discord.Embed({
            color: Settings.Color.DEFAULT,
            title: 'Help - ' + searchedCmd.name,
            description: `${searchedCmd.description} Permission: [<@&${
              Settings.RolePerms[searchedCmd.permLvl]
            }>]`
          }),
          allowedMentions: {}
        });
        return;
      } else if (helpLvlOrName.startsWith(`<@&`)) {
        // it is a role
        helpLvlOrName = helpLvlOrName.replace('<@&', '').replace('>', '');

        if (!Settings.RolePerms.includes(helpLvlOrName)) {
          // the role isn't in the permission array
          await msg?.reply(
            new discord.Embed({
              color: Settings.Color.ERROR,
              title: 'Error',
              description: `This role don't has any permissions.`
            })
          );
          return;
        } else {
          // set the permission lvl to the role permission lvl
          helpLvl = Settings.RolePerms.indexOf(helpLvlOrName);
        }
      } else {
        // tried to search for a cmd which doesn't exist
        await msg?.reply(
          new discord.Embed({
            color: Settings.Color.ERROR,
            title: 'Error',
            description: `There is no command or role with this name.`
          })
        );
        return;
      }
    }
  }

  // max size of helpLvl
  if (helpLvl > Settings.RolePerms.length) helpLvl = Settings.RolePerms.length;

  // the help message
  await msg
    ?.reply({
      embed: await Functions.HelpMsg(0, helpLvl),
      allowedMentions: {}
    })
    .then(async (sMsg) => {
      await sMsg?.addReaction(Settings.Emojis.DISAGREE);

      // the right nr of reactions
      const nr: number = Math.ceil(
        Settings.cmds.filter((c) => c.inHelp && c.permLvl <= helpLvl!).length /
          Settings.nrElementsPage
      );
      if (nr > 1)
        for (let i = 0; i < nr; ++i)
          await sMsg?.addReaction(Settings.numberEmojis[i]);

      // helps in KV
      let helps: Array<Definitions.HelpCmd> =
        (await Definitions.KV.get<Array<Definitions.HelpCmd>>(`helps`)) ?? [];
      helps.push({
        msg: sMsg.id.toString(),
        permissionLvl: helpLvl ?? 0,
        language: 'DE'
      });
      await Definitions.KV.put(`helps`, helps);
    });
}

export async function ServerStatsCommand(
  msg: discord.GuildMemberMessage
): Promise<void> {
  if (!(await OnCmd(msg, Settings.serverStatsCommand))) return;

  const guild: discord.Guild = await discord.getGuild();
  let channelCount: number = 0;
  let roleCount: number = 0;
  await guild.getChannels().then(async (c) => {
    channelCount = c.length;
  });
  await guild.getRoles().then(async (r) => {
    roleCount = r.length;
  });
  const owner: discord.GuildMember | null = await guild.getMember(
    guild.ownerId
  );

  await msg?.reply(
    new discord.Embed({
      color: Settings.Color.DEFAULT,
      title: guild.name,
      description: `**ID: ${guild.id}**`,
      thumbnail: { url: guild.getBannerUrl() ?? guild.getIconUrl()! },
      fields: [
        {
          name: 'Verification Level',
          value: guild.verificationLevel.toString(),
          inline: false
        },
        { name: 'Region', value: guild.region, inline: true },
        {
          name: 'Members',
          value: guild.memberCount.toString(),
          inline: true
        },
        {
          name: `Channels`,
          value: `Number of channels: ${channelCount}`,
          inline: false
        },
        {
          name: `Roles`,
          value: `Number of roles: ${roleCount}`,
          inline: false
        },
        {
          name: 'Server Owner',
          value: `${owner!.user.username} [${guild.ownerId}]`,
          inline: false
        },
        {
          name: 'Created On',
          value: new Date(
            Number(
              (BigInt(guild.id) >> BigInt(22)) +
                BigInt(Settings.discordTimeShift)
            )
          ).toLocaleDateString(),
          inline: false
        },
        {
          name: 'Server Boosts',
          value: `Level: ${guild.premiumTier ?? 0}\nNumber of boosts: ${
            guild.premiumSubscriptionCount
          }`
        }
      ]
    })
  );
}

export async function PingCommand(
  msg: discord.GuildMemberMessage
): Promise<void> {
  if (!(await OnCmd(msg, Settings.pingCommand))) return;
  await msg?.reply(
    `The ping is: ${Date.now() -
      Number(
        (BigInt(msg.id) >> BigInt(22)) + BigInt(Settings.discordTimeShift)
      )}ms`
  );
}

export async function InviteCommand(
  msg: discord.GuildMemberMessage
): Promise<void> {
  if (!(await OnCmd(msg, Settings.inviteCommand))) return;

  const guild: discord.Guild | null = await discord.getGuild();
  const inviteLinks: Array<
    discord.GuildInvite
  > | null = await guild?.getInvites();

  await Functions.delMsg(msg, 19000);
  // the first invite
  await Functions.delMsg(await msg?.reply(inviteLinks[0].getUrl()), 19000);
}

export async function ReportCommand(
  message: discord.GuildMemberMessage,
  user: discord.GuildMember,
  reason: string
): Promise<void> {
  if (!(await OnCmd(message, Settings.reportCommand))) return;

  const commandAuthor: discord.GuildMember = message.member;

  if (user.roles.includes(Settings.Roles.BOT)) {
    await message?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: `${commandAuthor.toMention()} du kannst kein Bot reporten.`
      })
    );
    return;
  }

  await discord
    .getGuildTextChannel(
      user.roles.includes(Settings.Roles.GHCTEAM)
        ? Settings.Channels.REPORTGHC
        : Settings.Channels.REPORT
    )
    .then(async (c) => {
      await c?.sendMessage(
        new discord.Embed({
          color: Settings.Color.ORANGE,
          title: 'Report',
          timestamp: new Date().toISOString(),
          thumbnail: { url: user.user.getAvatarUrl() ?? undefined },
          fields: [
            { name: 'Author', value: commandAuthor.toMention(), inline: true },
            { name: 'User', value: user.toMention(), inline: true },
            { name: 'Reason', value: reason, inline: false }
          ]
        })
      );

      await Functions.delMsg(
        await message?.reply(
          new discord.Embed({
            color: Settings.Color.DEFAULT,
            title: 'Report',
            description: `${commandAuthor.toMention()} Dein report wurde an das Team weitergeleitet!`
          })
        ),
        10000
      );

      await Database.UpdateDataValues(
        `user-${user.user.id}`,
        (u) => {
          (u.r as number)++;
          return u;
        },
        'user'
      );

      await message?.delete();
    });
}

export async function SayCommand(
  message: discord.GuildMemberMessage,
  password: string,
  text: string
): Promise<void> {
  if (!(await OnCmd(message, Settings.sayCommand, password))) return;

  await discord.getGuildNewsChannel(Settings.Channels.NEWS).then(
    async (c) =>
      await c?.sendMessage(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          title: 'Announcement',
          description: text
        })
      )
  );

  await message?.delete();
}

export async function SurveyCommand(
  message: discord.GuildMemberMessage,
  password: string,
  survey: string
): Promise<void> {
  if (!(await OnCmd(message, Settings.surveyCommand, password))) return;

  await message?.delete();

  const channelSurvey: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.SURVEYS
  );
  const channelBot: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.BOT
  );

  const theSurveyInTheSurveyChannel:
    | discord.Message
    | undefined = await channelSurvey?.sendMessage(
    new discord.Embed({
      color: Settings.Color.DEFAULT,
      title: 'Serverumfrage',
      timestamp: new Date().toISOString(),
      description: survey
    })
  );

  await theSurveyInTheSurveyChannel?.addReaction(Settings.Emojis.AGREE);
  await theSurveyInTheSurveyChannel?.addReaction(Settings.Emojis.DISAGREE);
  await theSurveyInTheSurveyChannel?.addReaction(Settings.Emojis.QUESTION);

  await channelBot?.sendMessage(
    new discord.Embed({
      color: Settings.Color.DEFAULT,
      title: 'Survey',
      timestamp: new Date().toISOString(),
      description: `${message.member?.toMention()} starts the survey: "*${survey}* "!`
    })
  );

  let surveyIds: Array<string> =
    (await Definitions.KV.get<Array<string>>(`surveyIds`)) ?? [];

  surveyIds.push(theSurveyInTheSurveyChannel!.id);

  await Definitions.KV.put(`surveyIds`, surveyIds);
}

export async function CloseSurveyCommand(
  message: discord.GuildMemberMessage,
  password: string,
  surveyNr: number
): Promise<void> {
  if (!(await OnCmd(message, Settings.closeSurveyCommand, password))) return;

  const commandAuthor: discord.GuildMember = message.member;
  const surveyIds: Array<string> =
    (await Definitions.KV.get<Array<string>>(`surveyIds`)) ?? [];

  if (surveyIds.length === 0) {
    await message?.reply(
      new discord.Embed({
        color: Settings.Color.RED,
        title: 'Error',
        description: `${commandAuthor.toMention()} There are currently no surveys!`
      })
    );
  } else if (surveyIds!.length < surveyNr) {
    await message?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: `${commandAuthor.toMention()} The survey "${surveyNr}" doesn't exist!`
      })
    );
  } else {
    if (await CloseASurveyMsg(commandAuthor, surveyNr)) {
      await message?.reply(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          title: 'Closed survey',
          description: `The survey ${surveyNr} is now closed.`
        })
      );
    } else {
      await message?.reply(
        new discord.Embed({
          color: Settings.Color.ERROR,
          title: 'Error',
          description: `Couldn't close survey ${surveyNr}.`
        })
      );
    }
  }
}

export async function ApplyCommand(
  message: discord.GuildMemberMessage,
  password: string,
  bool: string
): Promise<void> {
  if (!(await OnCmd(message, Settings.applyCommand, password))) return;

  const commandAuthor: discord.GuildMember = message.member;
  const channelApply: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.APPLYS
  );

  if (Settings.optionsTrue.some((o) => o === bool)) {
    await channelApply?.edit({
      permissionOverwrites: [
        {
          type: discord.Channel.PermissionOverwriteType.ROLE,
          id: discord.getGuildId(),
          deny: discord.Permissions.ALL,
          allow: 0x0
        },
        {
          type: discord.Channel.PermissionOverwriteType.ROLE,
          id: Settings.Roles.MEMBER,
          deny: discord.Permissions.ALL,
          allow: 0x00010000 | 0x00000400
        }
      ]
    });

    await Functions.Log(
      Settings.Color.DEFAULT,
      'Apply phase',
      `${commandAuthor.toMention()} starts the apply phase!`
    );
  } else if (Settings.optionsFalse.some((o) => o === bool)) {
    await channelApply?.edit({
      permissionOverwrites: [
        {
          type: discord.Channel.PermissionOverwriteType.ROLE,
          id: discord.getGuildId(),
          deny: discord.Permissions.ALL,
          allow: 0x0
        },
        {
          type: discord.Channel.PermissionOverwriteType.ROLE,
          id: Settings.Roles.MEMBER,
          deny: discord.Permissions.ALL,
          allow: 0x0
        }
      ]
    });

    await Functions.Log(
      Settings.Color.DEFAULT,
      'Apply phase',
      `${commandAuthor.toMention()} stops the apply phase!`
    );
  } else {
    // wrong input
    await message?.reply(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        title: 'Apply phase',
        description: `${commandAuthor.toMention()} wrong argument (0-false/1-true)!`
      })
    );
  }
  await message?.delete();
}

export async function ShowApplicants(
  message: discord.GuildMemberMessage
): Promise<void> {
  if (!(await OnCmd(message, Settings.showApplicantsCommand))) return;

  const guild: discord.Guild | null = await discord.getGuild();
  const commandAuthor: discord.GuildMember = message.member;

  let applicants: Array<string> = [];
  //for await (const usersOfServer of guild?.iterMembers()) {
  //  if (usersOfServer.roles.includes(Settings.Roles.APPLY)) {
  //    applicants.push('\n' + usersOfServer.toMention());
  //  }
  //}

  // TODO

  if (applicants.length === 0) {
    await message?.reply(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        title: 'The applicants',
        description: `${commandAuthor.toMention()} Nobody applied for a role!`
      })
    );
  } else {
    await message?.reply(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        title: 'The applicants',
        description: `${commandAuthor.toMention()} the applicants are: ${applicants.toString()}`
      })
    );
  }

  await message?.delete();
}

export async function UserStatsCommand(
  message: discord.GuildMemberMessage,
  user: discord.GuildMember
): Promise<void> {
  if (!(await OnCmd(message, Settings.userStatsCommand))) return;

  const userData: Definitions.GHC_User | undefined = (await Database.GetData(
    `user-${user.user.id}`,
    'user'
  )) as Definitions.GHC_User | undefined;

  if (userData === undefined) return;

  await message?.reply(
    new discord.Embed({
      color: Settings.Color.DEFAULT,
      title: 'User stats',
      timestamp: new Date().toISOString(),
      thumbnail: { url: user.user.getAvatarUrl() },
      fields: [
        { name: 'User:', value: user.toMention() },
        {
          name: 'Nickname:',
          value: user.nick ?? user.user.username
        },
        {
          name: 'GHC Team member:',
          value: user.roles.includes(Settings.Roles.GHCTEAM) + ''
        },
        {
          name: 'Ban status:',
          value: '' + (userData.s ?? false)
        },
        {
          name: 'Anzal an reports:',
          value: '' + (userData.r ?? 0)
        },
        {
          name: 'Anzal an @gesperrt:',
          value: '' + (userData.g ?? 0)
        },
        {
          name: 'Ist ein Bot:',
          value: '' + user.user.bot
        },
        {
          name: 'Server gejoint am:',
          value: user.joinedAt
        }
      ]
    })
  );

  await message?.delete();
}

export async function ResetKvCommand(
  message: discord.GuildMemberMessage,
  password: string
): Promise<void> {
  if (!(await OnCmd(message, Settings.resetKVCommand, password))) return;

  await message?.delete();

  await Definitions.KV.clear();

  await discord.getGuildTextChannel(Settings.Channels.BOT).then(
    async (c) =>
      await c?.sendMessage(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          title: 'Reset KV',
          description: `${message.member.toMention()} reseted the KV.`,
          timestamp: new Date().toISOString()
        })
      )
  );
}

export async function ShowCaseCommand(
  message: discord.GuildMemberMessage,
  Id: string
): Promise<void> {
  if (!(await OnCmd(message, Settings.showCaseCommand))) return;

  const warnArray: Array<Definitions.WarnCase> =
    (await Definitions.KV.get<Array<Definitions.WarnCase>>(`WarnCases`)) ?? [];

  const warnCase: Definitions.WarnCase | undefined =
    warnArray.find((w) => w.caseId === Id) ?? undefined;

  if (warnCase === undefined) {
    await message?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: `${message.member.toMention()} There is no case with this ID!`
      })
    );
    return;
  }

  const guild: discord.Guild = await discord.getGuild();
  const warnUser: discord.GuildMember | null = await guild.getMember(
    warnCase!.user
  );
  const author: discord.GuildMember | null = await guild.getMember(
    warnCase!.author
  );

  const embed: discord.Embed = new discord.Embed({
    color: Settings.Color.ORANGE,
    title: 'Gesperrt',
    timestamp: warnCase?.date,
    thumbnail: { url: warnUser?.user.getAvatarUrl() },
    footer: { text: 'ID: ' + warnCase!.caseId },
    fields: [
      {
        name: 'Author',
        value: author!.toMention(),
        inline: true
      },
      {
        name: 'User',
        value: warnUser!.toMention(),
        inline: true
      },
      {
        name: 'Reason',
        value: warnCase!.reason,
        inline: true
      },
      {
        name: 'Date',
        value: new Date(warnCase!.date).toDateString(),
        inline: true
      },
      {
        name: 'ID',
        value: warnCase!.caseId,
        inline: true
      }
    ]
  });

  await message?.reply(embed);
}

export async function PardonCommand(
  message: discord.GuildMemberMessage,
  user: discord.GuildMember
): Promise<void> {
  if (!(await OnCmd(message, Settings.pardonCommand))) return;

  const commandAuthor: discord.GuildMember = message.member;
  const channelBot: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.BOT
  );

  if (user.roles.includes(Settings.Roles.BLOCKED) || user.roles.length === 0) {
    await user?.addRole(Settings.Roles.MEMBER);
    await user?.removeRole(Settings.Roles.BLOCKED);

    await Database.UpdateDataValues(
      `user-${user.user.id}`,
      (u) => {
        u.s = true;
        return u;
      },
      'user'
    );

    await channelBot?.sendMessage(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        title: 'Pardon',
        timestamp: new Date().toISOString(),
        thumbnail: {
          url: user.user.getAvatarUrl() ?? undefined
        },
        fields: [
          { name: 'Author', value: commandAuthor.toMention(), inline: true },
          { name: 'User', value: user.toMention(), inline: true }
        ],
        description: `The user is now a member again!`
      })
    );
    await message?.delete();
  } else {
    await message?.reply(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        title: 'Error',
        description: `${commandAuthor.toMention()} the user ${user.toMention()} isn't blocked currently!`
      })
    );

    await message?.delete();
  }
}

export async function SpawnMessageCommand(
  message: discord.GuildMemberMessage,
  password: string,
  MSGNr: number
): Promise<void> {
  if (!(await OnCmd(message, Settings.spawnMSGCommand, password))) return;

  const channelRegeln: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.RULES
  );
  const channelBewerbungen: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.APPLYS
  );
  const channelServerwartungen: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.MAINTENANCE
  );
  const channelFeedback: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.FEEDBACK
  );
  const channelSupporter: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.SUPPORTER
  );
  const channelModerator: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.MODERATOR
  );

  switch (MSGNr) {
    case 0:
      await channelRegeln
        ?.sendMessage(await Functions.GHCEmbed(MSGNr))
        .then(async (msg) => {
          await msg?.addReaction(Settings.Emojis.AGREE);
          await msg?.addReaction(Settings.Emojis.DISAGREE);
        });
      break;
    case 1:
      await channelFeedback?.sendMessage(await Functions.GHCEmbed(MSGNr));
      break;
    case 2:
      await channelBewerbungen
        ?.sendMessage(await Functions.GHCEmbed(MSGNr))
        .then(async (msg) => await msg.addReaction(Settings.Emojis.APPLY));
      break;
    case 3:
      await channelServerwartungen?.sendMessage(
        await Functions.GHCEmbed(MSGNr)
      );
      break;
    case 4:
      await channelSupporter?.sendMessage(await Functions.GHCEmbed(MSGNr));
      break;
    case 5:
      await channelModerator
        ?.sendMessage(await Functions.GHCEmbed(MSGNr))
        .then(async (msg) => {
          await msg?.addReaction('name:720593275203092511');
        });
      break;
  }

  await message?.delete();
}

export async function GifCommand(
  msg: discord.GuildMemberMessage
): Promise<void> {
  if (!(await OnCmd(msg, Settings.gifCommand))) return;

  const req: Response | null = await fetch(
    `https://some-random-api.ml/animu/pat`
  );
  const data: any = await req.json();

  await msg?.reply(
    new discord.Embed({
      title: `A gif!`,
      color: Settings.Color.DEFAULT,
      image: { url: data['link'] ?? undefined }
    })
  );
}

export async function WarnCommand(
  message: discord.interactions.commands.SlashCommandInteraction,
  user: discord.GuildMember,
  reason: string
): Promise<void> {
  //if (!(await OnCmd(message, Settings.warnCommand))) return;

  const commandAuthor: discord.GuildMember | null = message.member;
  const channelBot: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.BOT
  );
  const channelBanGrund: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.BANREASON
  );

  if (
    !(
      user.roles.includes(Settings.Roles.GHCTEAM) ||
      user.roles.includes(Settings.Roles.BOT)
    )
  ) {
    // normal user
    if (!user.roles.includes(Settings.Roles.BLOCKED)) {
      await user.addRole(Settings.Roles.BLOCKED);
      await user.removeRole(Settings.Roles.MEMBER);

      await Database.UpdateDataValues(
        `user-${user.user.id}`,
        (u) => {
          u.s = false; // user is blocked
          u.g = ((u.g as number) ?? 0) + 1; // user was blocked once more
          return u;
        },
        'user'
      );

      let id: string = '';
      for (let i: number = 0; i < Settings.banIdLength; i++) {
        id += Settings.charactersForRandString.charAt(
          Math.floor(Math.random() * Settings.charactersForRandString.length)
        );
      }

      let Warns: Array<Definitions.WarnCase> =
        (await Definitions.KV.get<Array<Definitions.WarnCase>>(`WarnCases`)) ??
        [];
      Warns.push({
        author: commandAuthor.user.id,
        user: user.user.id,
        reason: reason,
        caseId: id,
        date: new Date().toISOString()
      });
      await Definitions.KV.put(`WarnCases`, Warns);

      await channelBanGrund?.sendMessage(
        new discord.Embed({
          color: Settings.Color.RED,
          title: 'Warn',
          timestamp: new Date().toISOString(),
          thumbnail: {
            url: user.user.getAvatarUrl() ?? undefined
          },
          fields: [
            {
              name: 'Author',
              value: commandAuthor.toMention(),
              inline: true
            },
            { name: 'User', value: user.toMention(), inline: true },
            { name: 'Reason', value: reason, inline: false }
          ],
          footer: { text: `ID: ${id}` }
        })
      );

      await channelBot?.sendMessage(
        new discord.Embed({
          color: Settings.Color.RED,
          title: 'Warn',
          timestamp: new Date().toISOString(),
          thumbnail: { url: user.user.getAvatarUrl() },
          fields: [
            {
              name: 'Author',
              value: commandAuthor.toMention(),
              inline: true
            },
            { name: 'User', value: user.toMention(), inline: true },
            { name: 'Reason', value: reason, inline: false }
          ],
          footer: { text: `ID: ${id}` }
        })
      );
    } else {
      await message?.respond({
        embeds: [
          new discord.Embed({
            color: Settings.Color.DEFAULT,
            title: 'Error',
            description: `${commandAuthor.toMention()} The user ${user.toMention()} is already blocked!`
          })
        ]
      });
    }
  } else {
    // try to warn a team member or bot
    await message?.respond({
      embeds: [
        new discord.Embed({
          color: Settings.Color.ERROR,
          title: 'Error',
          description: `${commandAuthor.toMention()} You can't warn a team member/bot!`
        })
      ]
    });

    await channelBot?.sendMessage(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: `${commandAuthor.toMention()} has tried to block ${user.toMention()} for: "*${reason}* "!`
      })
    );
  }
}

// close Survey function
async function CloseASurveyMsg(
  user: discord.GuildMember,
  nr: number
): Promise<void | boolean> {
  const channelSurvey: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.SURVEYS
  );
  const channelBot: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
    Settings.Channels.BOT
  );

  let upVotes: number = 0;
  let downVotes: number = 0;
  let dontKnowVotes: number = 0;

  let surveyIds: Array<string> =
    (await Definitions.KV.get<Array<string>>(`surveyIds`)) ?? [];

  if (surveyIds.length === 0 || surveyIds === undefined) return false;

  if (nr !== 0) {
    // Close a specific survey
    const toDeleteSurvey:
      | discord.Message
      | null
      | undefined = await channelSurvey?.getMessage(surveyIds[nr - 1]);
    toDeleteSurvey?.reactions.forEach(async (reaction) => {
      if (reaction.emoji.name === Settings.Emojis.AGREE) {
        upVotes = reaction.count - 1;
      } else if (reaction.emoji.name === Settings.Emojis.DISAGREE) {
        downVotes = reaction.count - 1;
      } else if (reaction.emoji.name === Settings.Emojis.QUESTION) {
        dontKnowVotes = reaction.count - 1;
      }
    });

    const surveyVotesMSG: discord.Embed = new discord.Embed({
      color: Settings.Color.DEFAULT,
      title: 'Survey closed',
      timestamp: new Date().toISOString()
    });

    if (upVotes + downVotes + dontKnowVotes === 0) {
      surveyVotesMSG.setDescription(
        `${user?.toMention()} closed the survey: "*${toDeleteSurvey?.embeds[0].description?.replace(
          '@everyone ',
          ''
        )}* "! __No members voted!__`
      );
    } else {
      surveyVotesMSG.setDescription(
        `${user?.toMention()} closed the survey: "*${toDeleteSurvey?.embeds[0].description?.replace(
          '@everyone ',
          ''
        )}* "! __${upVotes + downVotes} members voted. ${Math.round(
          (upVotes / (upVotes + downVotes)) * 100
        )}% were in favor and ${Math.round(
          (downVotes / (upVotes + downVotes)) * 100
        )}% were against.__ The rest didn't care.`
      );
    }

    await channelBot?.sendMessage(surveyVotesMSG);
    await toDeleteSurvey?.delete();
    surveyIds.splice(nr - 1, 1);
  } else {
    surveyIds.forEach(async (msg) => {
      const toDeleteSurvey:
        | discord.Message
        | null
        | undefined = await channelSurvey?.getMessage(msg);

      toDeleteSurvey?.reactions.forEach(async (reaction) => {
        if (reaction.emoji.name === Settings.Emojis.AGREE) {
          upVotes = reaction.count - 1;
        } else if (reaction.emoji.name === Settings.Emojis.DISAGREE) {
          downVotes = reaction.count - 1;
        } else if (reaction.emoji.name === Settings.Emojis.QUESTION) {
          dontKnowVotes = reaction.count - 1;
        }
      });

      const surveyVotesMSG: discord.Embed = new discord.Embed({
        color: Settings.Color.DEFAULT,
        title: 'Survey closed',
        timestamp: new Date().toISOString()
      });

      if (upVotes + downVotes + dontKnowVotes === 0) {
        surveyVotesMSG.setDescription(
          user?.toMention() +
            ' closed the survey: "**' +
            toDeleteSurvey?.embeds[0].description?.replace('@everyone ', '') +
            '**"! __No members voted!__'
        );
      } else {
        surveyVotesMSG.setDescription(
          `${user?.toMention()} closed the survey: "*${toDeleteSurvey?.embeds[0].description?.replace(
            '@everyone ',
            ''
          )}* "! __${upVotes + downVotes} members voted. ${Math.round(
            (upVotes / (upVotes + downVotes)) * 100
          )}% were in favor and ${Math.round(
            (downVotes / (upVotes + downVotes)) * 100
          )}% were against.__ The rest didn't care.`
        );
      }

      await channelBot?.sendMessage(surveyVotesMSG);
      await toDeleteSurvey?.delete();
    });

    await Definitions.KV.put(`surveyIds`, []);
  }

  return true;
}

// Check stuff for cmd
async function OnCmd(
  msg: discord.GuildMemberMessage,
  cmd: Definitions.command,
  pwd?: string
): Promise<boolean> {
  // Get user
  const user: Definitions.GHC_User | undefined = (await Database.GetData(
    `user-${msg.member.user.id}`,
    'user'
  )) as Definitions.GHC_User | undefined;

  if (user === undefined) {
    // bot disabled
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: `You are not in the database. Ask @ClashCrafter to add you there.`
      })
    );
    return false;
  }

  // bot enabled
  if (Settings.enabled !== true) {
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

  // command enabled
  if (cmd.enabled !== true) {
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

  // password
  if (
    cmd.password === true &&
    (!(await Functions.getPwd(pwd)) || pwd === undefined)
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

  // cooldown
  if (cmd.cooldown !== 0 && Date.now() < (user.c ?? 0)) {
    // user is in cooldown
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: Settings.botMessages.en.cmdCooldownMsg.replace(
          'x',
          ((user.c - Date.now()) / 1000).toFixed(1)
        )
      })
    );
    return false;
  } else if (cmd.cooldown !== 0) {
    // set cooldown
    await Database.UpdateDataValues(
      `user-${msg.member.user.id}`,
      (u) => {
        u.c = Date.now() + cmd.cooldown * 1000;
        return u;
      },
      'user'
    );
  }

  // blacklists user/roles, were whitelist is over the blacklist
  if (
    (cmd.blacklistUserRolesChannel.includes(msg.member.user.id) ||
      Settings.noCommands.includes(msg.member.user.id) ||
      msg.member.roles.some((r) => cmd.blacklistUserRolesChannel.includes(r)) ||
      msg.member.roles.some((r) => Settings.noCommands.includes(r))) &&
    !cmd.whitelistedUserRoles.includes(msg.member.user.id) &&
    !cmd.whitelistedUserRoles.some((r) => msg.member.roles.includes(r))
  ) {
    // user/role is on global/local blacklist
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

    discord.getGuild().then((guild) => {
      discord.getGuildTextChannel(Settings.Channels.BOT).then((c) => {
        c?.sendMessage(
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

    return false;
  }

  // blacklist channel
  if (
    cmd.blacklistUserRolesChannel.includes(msg.channelId) ||
    Settings.noCommands.includes(msg.channelId) ||
    (cmd.onlyChannels.length !== 0 && !cmd.onlyChannels.includes(msg.channelId))
  ) {
    // channel is on global/local/manual blacklist
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.ERROR,
        title: 'Error',
        description: Settings.botMessages.en.cmdNotChannel
      })
    );
    return false;
  }

  // only #bot
  if (cmd.onlyBotChatMsg === true) {
    await msg
      ?.reply(
        new discord.Embed({
          color: Settings.Color.RED,
          timestamp: new Date().toISOString(),
          title: 'Warnung',
          description: Settings.botMessages.de.cmdOnlyCmdChannel
        })
      )
      .then((m) => setTimeout(() => m?.delete(), 10000));
  }

  if (
    cmd.whitelistedUserRoles.includes(msg.member.user.id) ||
    msg.member.roles.some((r) => cmd.whitelistedUserRoles.includes(r))
  )
    // user/role has permission because whitelist
    return true;

  if (
    Settings.RolePerms.filter(
      (p) => Settings.RolePerms.indexOf(p) >= cmd.permLvl
    ).some((r) => msg.member.roles.includes(r))
  )
    // user has permission because of role
    return true;

  // no true or false filter worked so it is passed as false
  await msg?.reply(
    new discord.Embed({
      color: Settings.Color.ERROR,
      title: '🔒 Error',
      description: Settings.botMessages.en.error
    })
  );
  return false;
}

/*
// kick
Definitions.PunishCmd.register(
  {
    name: Settings.kickCommand.name,
    description: 'Kick a user.',
    showSourceMessage: false,
    options: (args) => ({
      user: args.guildMember({
        name: 'user',
        description: 'The user.',
        required: true
      }),
      reason: args.string({
        name: 'reason',
        description: 'Why you want to punish the user.',
        required: true
      })
    })
  },

  async (message, { user, reason }) => {
    //if (!(await OnCmd(message, Settings.kickCommand, password))) return;

    const commandAuthor: discord.GuildMember = message.member;
    const channelBot: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
      Settings.Channels.BOT
    );

    if (
      !(
        user.roles.includes(Settings.Roles.GHCTEAM) ||
        user.roles.includes(Settings.Roles.BOT)
      )
    ) {
      await user?.kick();

      await channelBot?.sendMessage(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          title: 'Kick',
          timestamp: new Date().toISOString(),
          fields: [
            { name: 'Author', value: commandAuthor.toMention(), inline: true },
            { name: 'User', value: user.toMention(), inline: true },
            { name: 'Reason', value: reason, inline: false }
          ],
          thumbnail: { url: user.user.getAvatarUrl() }
        })
      );
    } else {
      await message.respond({
        embeds: [
          new discord.Embed({
            color: Settings.Color.DEFAULT,
            title: 'Error',
            description: `${commandAuthor.toMention()} You can't kick a team member/bot!`
          })
        ]
      });

      await channelBot?.sendMessage(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          title: 'Error',
          description: `${commandAuthor.toMention()} has tried to kick ${user.toMention()} for: "*${reason}* "!`
        })
      );
    }
  }
);

// ban
Definitions.PunishCmd.register(
  {
    name: Settings.banCommand.name,
    description: 'Ban a user.',
    showSourceMessage: false,
    options: (args) => ({
      user: args.guildMember({
        name: 'user',
        description: 'The user.',
        required: true
      }),
      reason: args.string({
        name: 'reason',
        description: 'Why you want to punish the user.',
        required: true
      })
    })
  },
  async (message, { user, reason }) => {
    //if (!(await OnCmd(message, Settings.banCommand, password))) return;

    const guild: discord.Guild = await discord.getGuild();
    const commandAuthor: discord.GuildMember = message.member;
    const channelBot: discord.GuildTextChannel | null = await discord.getGuildTextChannel(
      Settings.Channels.BOT
    );

    if (
      !(
        user.roles.includes(Settings.Roles.GHCTEAM) ||
        user.roles.includes(Settings.Roles.BOT)
      )
    ) {
      await guild?.createBan(user, { reason: reason });

      await channelBot?.sendMessage(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          title: 'Ban',
          timestamp: new Date().toISOString(),
          thumbnail: { url: user.user.getAvatarUrl() },
          fields: [
            { name: 'Author', value: commandAuthor.toMention(), inline: true },
            { name: 'User', value: user.toMention(), inline: true },
            { name: 'Reason', value: reason, inline: false }
          ]
        })
      );
    } else {
      await message?.respond({
        embeds: [
          new discord.Embed({
            color: Settings.Color.DEFAULT,
            title: 'Error',
            description: `${commandAuthor.toMention()} You can't ban a team member/bot!`
          })
        ]
      });

      await channelBot?.sendMessage(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          title: 'Error',
          description: `${commandAuthor.toMention()} has tried to ban ${user.toMention()} for: "*${reason}* "!`
        })
      );
    }
  }
);
*/

// Reglen+Willkommen+Feedback channel, Befehle nur in #bot-befehle, Bewerber Reaktion

import * as Definitions from '../Main/definitions';
import * as Settings from '../Main/settings';
import * as Functions from '../Main/functions';
import * as Database from '../Main/database';

export async function Help(
  reaction: discord.Event.IMessageReactionAdd
): Promise<void> {
  if (!Settings.enabled) return;

  const msg: discord.Message | null | undefined = await (
    await discord.getGuildTextChannel(reaction.channelId)
  )?.getMessage(reaction.messageId);

  const helps: Array<Definitions.HelpCmd> =
    (await Definitions.KV.get<Array<Definitions.HelpCmd>>(`helps`)) ?? [];
  let help: Definitions.HelpCmd | undefined = helps.find(
    (h) => h.msg === reaction.messageId
  );

  if (help === undefined) return;

  await msg?.deleteReaction(reaction.emoji.name ?? '', reaction.userId);

  if (reaction.emoji.name === Settings.Emojis.DISAGREE) {
    // delete msg
    let i: number | undefined = helps.findIndex((h) => h.msg === help?.msg);
    if (i !== undefined) {
      helps.splice(i, 1);

      if (helps.length !== 0) await Definitions.KV.put('helps', helps);
      else await Definitions.KV.delete('helps');
    }

    await msg?.delete();
    return;
  }

  if (Settings.numberEmojis.includes(reaction.emoji.name ?? '-'))
    // the emoji was a number
    await msg?.edit(
      await Functions.HelpMsg(
        Settings.numberEmojis.indexOf(reaction.emoji.name ?? '-'),
        help.permissionLvl
      )
    );
}

export async function MessageDelete(
  event: discord.Event.IMessageDelete,
  oldMsg: discord.Message.AnyMessage | null
): Promise<void> {
  if (!Settings.enabled) return;

  // msg in #message-delete
  await discord.getGuildTextChannel(Settings.Channels.MESSAGEDELETE).then((c) =>
    c?.sendMessage({
      allowedMentions: {},
      content:
        '`' +
        `[${new Date().getDate() + 1}.${new Date().getMonth() +
          1} - ${new Date().getHours() + 1}:${new Date().getMinutes()}]` +
        '`' +
        ` Message was deleted in <#${event.channelId}>.` +
        (oldMsg !== null ? ` Author: ${oldMsg!.member?.toMention()}.` : '')
    })
  );
}

export async function Rules(
  reaction: discord.Event.IMessageReactionAdd
): Promise<void> {
  if (!Settings.enabled || reaction.channelId !== Settings.Channels.RULES)
    return;

  const user: discord.GuildMember | undefined = reaction.member;
  const msg: discord.Message | null | undefined = await (
    await discord.getGuildTextChannel(Settings.Channels.RULES)
  )?.getMessage(reaction.messageId);

  await msg?.deleteReaction(reaction.emoji.name ?? '-', reaction.userId);

  if (
    reaction.emoji.name !== Settings.Emojis.AGREE ||
    reaction.member?.roles.length !== 0 ||
    user === undefined
  )
    return;

  // TODO complete new user so he isnt in the db

  // @ts-ignore gets the data of the user
  const userdata: Definitions.GHC_User | undefined = await Database.GetData(
    `data-${msg?.member?.user.id ?? '-'}`,
    'user'
  );

  if (!userdata?.c) {
    //  the user accepted the rules so the user gets the member or maintenance role and a welcome msg is throwen in the #welcome channel.
    if (
      (await Definitions.KV.get<boolean>(`serverStatus`)) === true ||
      (await Definitions.KV.get<boolean>(`serverStatus`)) === undefined
    ) {
      // no maintenance work
      await user.addRole(Settings.Roles.MEMBER);
    } else {
      // maintenance work
      await user.addRole(Settings.Roles.MAINTENANCE);
    }

    await discord.getGuildTextChannel(Settings.Channels.WELCOME).then(
      async (c) =>
        await c?.sendMessage(
          new discord.Embed({
            color: Math.random() * 0xffffff,
            author: {
              iconUrl: user.user.getAvatarUrl(),
              name: user.user.username
            },
            timestamp: new Date().toISOString(),
            description: Settings.welcomeMsgs[
              Math.floor(
                Math.random() * Math.floor(Settings.welcomeMsgs.length)
              )
            ].replace('@user', user.toMention())
          })
        )
    );
  } else {
    // user was banned befor rejoining the guild, so he gets the blocked role or maintenance
    if (
      (await Definitions.KV.get<boolean>(`serverStatus`)) === true ||
      (await Definitions.KV.get<boolean>(`serverStatus`)) === undefined
    ) {
      // no maintenance work
      await user?.addRole(Settings.Roles.BLOCKED);
    } else {
      // maintenance work
      await user?.addRole(Settings.Roles.MAINTENANCE);
    }
  }
}

export async function NewApply(
  reaction: discord.Event.IMessageReactionAdd
): Promise<void> {
  if (
    !Settings.enabled ||
    reaction.channelId !== Settings.Channels.APPLYS ||
    reaction.emoji.name !== Settings.Emojis.APPLY
  )
    return;

  // ratelimits: return if user did react in the last X milliseconds and delete his reaction
  if ((await Definitions.KV.get(`applier.${reaction.userId}`)) === undefined) {
    Definitions.KV.put(`applier.${reaction.userId}`, 0, {
      ttl: Settings.applyReactionDelay * 1000
    });
  } else {
    Definitions.KV.put(`applier.${reaction.userId}`, 1, {
      ttl: Settings.applyReactionDelay * 1000
    });
    (
      await (await discord.getGuildTextChannel(reaction.channelId))?.getMessage(
        reaction.messageId
      )
    )?.deleteReaction(Settings.Emojis.APPLY, reaction.userId);
    return;
  }

  // return if the user has a role, which can't apply or is blacklisted
  if (
    Settings.cantApply.some((r) => reaction.member?.roles.includes(r)) ||
    Settings.cantApply.includes(reaction.userId)
  ) {
    await (
      await (await discord.getGuildTextChannel(reaction.channelId))?.getMessage(
        reaction.messageId
      )
    )?.deleteReaction(Settings.Emojis.APPLY, reaction.userId);
    return;
  }

  await reaction.member?.addRole(Settings.Roles.APPLY);

  await discord.getGuildTextChannel(Settings.Channels.BOT).then((c) =>
    c?.sendMessage(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        timestamp: new Date().toISOString(),
        title: 'New applicant!',
        description: `${reaction.member?.toMention()} apply for the moderator role!`
      })
    )
  );
}

export async function AbortApply(
  reaction: discord.Event.IMessageReactionAdd
): Promise<void> {
  if (
    !Settings.enabled ||
    reaction.channelId !== Settings.Channels.APPLYS ||
    reaction.emoji.name !== Settings.Emojis.APPLY ||
    Settings.cantApply.some((r) => reaction.member?.roles.includes(r)) ||
    Settings.cantApply.includes(reaction.userId)
  )
    return;

  await reaction.member?.removeRole(Settings.Roles.APPLY);

  if (((await Definitions.KV.get(`applier.${reaction.userId}`)) ?? 0) > 0)
    return;

  await discord.getGuildTextChannel(Settings.Channels.BOT).then((c) =>
    c?.sendMessage(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        timestamp: new Date().toISOString(),
        title: 'Application removed!',
        description: `${reaction.member?.toMention()} withdraws his application.`
      })
    )
  );
}

export async function Feedback(msg: discord.Message): Promise<void> {
  if (
    !Settings.enabled ||
    msg.channelId !== Settings.Channels.FEEDBACK ||
    msg.member?.user.bot
  )
    return;

  await discord.getGuildTextChannel(Settings.Channels.REPORT).then((c) =>
    c?.sendMessage(
      new discord.Embed({
        color: Settings.Color.GREEN,
        timestamp: new Date().toISOString(),
        author: {
          iconUrl: msg.member?.user.getAvatarUrl() ?? undefined,
          name: msg.member?.user.username
        },
        title: 'Feedback',
        fields: [
          { name: 'User', value: msg.member?.toMention() ?? '-' },
          { name: 'Message', value: msg.content }
        ]
      })
    )
  );

  await Functions.delMsg(
    10000,
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        title: 'Feedback',
        description: `${msg.member?.toMention()} Deine Nachricht wurde an das Team weitergeleitet.`
      })
    )
  );

  await msg?.delete();
}

export async function BlacklistedWords(msg: discord.Message) {
  if (
    !Settings.enabled ||
    Settings.blackListedWords.length === 0 ||
    Settings.blackListedWordsImmune.includes(msg.member!.user.id) ||
    Settings.blackListedWordsImmune.some((role) =>
      msg.member!.roles.includes(role)
    )
  )
    return;

  if (
    !Settings.blackListedWords.some(
      (v) =>
        msg?.content.toLowerCase().includes(v.word.toLowerCase()) &&
        !v.whitelistedChannels.includes(msg.channelId)
    )
  )
    return;

  await Functions.delMsg(
    19000,
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.RED,
        title: 'Böses Wort',
        description: `Nani!? Hüte deine Zunge, ${msg.member?.toMention()}!`,
        timestamp: new Date().toISOString()
      })
    )
  );

  await discord.getGuildTextChannel(Settings.Channels.BOT).then((c) =>
    c?.sendMessage(
      new discord.Embed({
        color: Settings.Color.RED,
        title: 'Blacklisted word',
        timestamp: new Date().toISOString(),
        thumbnail: { url: msg.member?.user.getAvatarUrl() ?? undefined },
        fields: [
          {
            name: 'User',
            value: msg.member?.toMention() ?? 'error',
            inline: true
          },
          { name: 'Channel', value: `<#${msg.channelId}>`, inline: true },
          { name: 'Message', value: msg.content ?? '-' }
        ]
      })
    )
  );

  await msg?.delete();
}

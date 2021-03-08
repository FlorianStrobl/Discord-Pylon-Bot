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

  const member: discord.GuildMember | undefined = reaction.member;
  const msg: discord.Message | null | undefined = await (
    await discord.getGuildTextChannel(Settings.Channels.RULES)
  )?.getMessage(reaction.messageId);

  await msg?.deleteReaction(reaction.emoji.name ?? '-', reaction.userId);

  if (
    reaction.emoji.name !== Settings.Emojis.AGREE ||
    reaction.member?.roles.length !== 0 ||
    member === undefined
  )
    return;

  // @ts-ignore gets the data of the user
  const userdata: Definitions.GHC_User | undefined = await Database.GetData(
    `user-${reaction.userId}`,
    'user'
  );

  if (userdata === undefined)
    await Database.SaveData(
      {
        i: `user-${reaction.userId}`,
        l: 'DE',
        s: true,
        r: 0,
        g: 0,
        c: 0,
        m: 0,
        ac: 0
      },
      'user'
    );

  if ((userdata?.s ?? true) === true) {
    //  the user accepted the rules so the user gets the member or maintenance role and a welcome msg is throwen in the #welcome channel.
    if (
      (await Definitions.KV.get<boolean>(`serverStatus`)) === true ||
      (await Definitions.KV.get<boolean>(`serverStatus`)) === undefined
    )
      // no maintenance work
      await member.addRole(Settings.Roles.MEMBER);
    else await member.addRole(Settings.Roles.MAINTENANCE); // maintenance work

    await discord.getGuildTextChannel(Settings.Channels.WELCOME).then((c) =>
      c?.sendMessage(
        new discord.Embed({
          color: Math.random() * 0xffffff,
          author: {
            iconUrl: member.user.getAvatarUrl(),
            name: member.user.username
          },
          timestamp: new Date().toISOString(),
          description: Settings.welcomeMsgs[
            Math.floor(Math.random() * Math.floor(Settings.welcomeMsgs.length))
          ].replace('@user', member.toMention())
        })
      )
    );
  } else {
    // user was banned befor rejoining the guild, so he gets the blocked role or maintenance
    if (
      (await Definitions.KV.get<boolean>(`serverStatus`)) === true ||
      (await Definitions.KV.get<boolean>(`serverStatus`)) === undefined
    )
      // no maintenance work
      await member?.addRole(Settings.Roles.BLOCKED);
    else await member?.addRole(Settings.Roles.MAINTENANCE); // maintenance work
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

  const message: discord.Message | null | undefined = await (
    await discord.getGuildTextChannel(reaction.channelId)
  )?.getMessage(reaction.messageId);

  // ratelimits: return if user did react in the last X milliseconds and delete his reaction
  if (
    (await Definitions.KV.get<number>(`applier.${reaction.userId}`)) !==
    undefined
  ) {
    // in last two seconds reacted so default return with reaction deletion
    Definitions.KV.put(`applier.${reaction.userId}`, null, {
      ttl: 5000
    });
    await message?.deleteReaction(Settings.Emojis.APPLY, reaction.userId);
    return;
  } else {
    // not in two seconds
    Definitions.KV.put(`applier.${reaction.userId}`, null, {
      ttl: 5000
    });

    if (
      // @ts-ignore
      ((await Database.GetData(`user-${reaction.userId}`, 'user'))['ac'] ?? 0) >
      Date.now()
    ) {
      // but in last 24h
      await message?.deleteReaction(Settings.Emojis.APPLY, reaction.userId);
      return;
    }
  }

  if (
    Settings.cantApply.some((r) => reaction.member?.roles.includes(r)) ||
    Settings.cantApply.includes(reaction.userId)
  ) {
    // user and or role is blacklisted from appling
    await message?.deleteReaction(Settings.Emojis.APPLY, reaction.userId);
    return;
  }

  await Database.UpdateDataValues(
    `user-${reaction.userId}`,
    (u) => {
      u['ac'] = Settings.applyReactionDelay * 1000 + Date.now();
      u['as'] = true;
      return u;
    },
    'user'
  );

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

  if (
    (await Definitions.KV.get<number>(`applier.${reaction.userId}`)) !==
    undefined
  )
    return;

  await Database.UpdateDataValues(
    `user-${reaction.userId}`,
    (u) => {
      u['as'] = false;
      return u;
    },
    'user'
  );

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
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.DEFAULT,
        title: 'Feedback',
        description: `${msg.member?.toMention()} Deine Nachricht wurde an das Team weitergeleitet.`
      })
    ),
    10000
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
    await msg?.reply(
      new discord.Embed({
        color: Settings.Color.RED,
        title: 'Böses Wort',
        description: `Nani!? Hüte deine Zunge, ${msg.member?.toMention()}!`,
        timestamp: new Date().toISOString()
      })
    ),
    19000
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

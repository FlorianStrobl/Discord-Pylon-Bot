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

  try {
    await msg?.deleteReaction(reaction.emoji.name ?? '', reaction.userId);
  } catch (_) {}

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

export async function BulkMessageDelete(
  event: discord.Event.IMessageDeleteBulk
): Promise<void> {
  if (!Settings.enabled) return;

  // msg in #message-delete
  await discord.getGuildTextChannel(Settings.Channels.MESSAGEDELETE).then((c) =>
    c?.sendMessage({
      allowedMentions: {},
      content:
        Functions.TimeString() +
        ' (`Bulkd Message Delete`) 🗑️ messages deleted [`' +
        event.channelId +
        '`] in <#' +
        `${event.channelId}>: ${event.ids.length} deleted messages`
    })
  );
}

export async function MessageCreateClearCmd(
  message: discord.Message
): Promise<void> {
  await Functions.ClearMessages(message.id, message.channelId);
}

export async function MessageDeleteClearCmd(
  message: discord.Event.IMessageDelete,
  oldMsg: discord.Message.AnyMessage | null
) {
  let messages: string[] =
    (await Definitions.KV.get(`messages-${message.channelId}`)) ?? [];

  let index: number | undefined = messages.findIndex((m) => m === message.id);
  if (index === -1) return;

  messages.splice(index, 1);

  if (messages.length !== 0)
    await Definitions.KV.put(`messages-${message.channelId}`, messages);
  else await Definitions.KV.delete(`messages-${message.channelId}`);
}

export async function MessageDelete(
  event: discord.Event.IMessageDelete,
  oldMsg: discord.Message.AnyMessage | null
): Promise<void> {
  if (!Settings.enabled) return;
  if (oldMsg?.author.id === Settings.pylonId) return;

  // msg in #message-delete
  await discord.getGuildTextChannel(Settings.Channels.MESSAGEDELETE).then((c) =>
    c?.sendMessage({
      allowedMentions: {},
      content:
        Functions.TimeString() +
        ' (`Message Delete`) 🗑️ ' +
        oldMsg!.member?.toMention() +
        ' message deleted [`' +
        event.channelId +
        '`] in <#' +
        event.channelId +
        '>: ```' +
        (oldMsg?.content ?? '-') +
        '```'
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

  // gets the data of the user
  const userdata: Definitions.GHC_User | undefined = (await Database.GetData(
    `user-${reaction.userId}`,
    'user'
  )) as Definitions.GHC_User | undefined;

  if (userdata === undefined)
    await Database.SaveData(
      {
        index: `user-${reaction.userId}`,
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
    await member.addRole(Settings.Roles.MEMBER);

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
    await member?.addRole(Settings.Roles.BLOCKED);
  }
}

export async function BlacklistedWords(msg: discord.Message): Promise<void> {
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

import * as Definitions from '../Main/definitions';
import * as Settings from '../Main/settings';
import * as Functions from '../Main/functions';
import * as BetterKV from '../Extra/betterKV';

export async function ChannelDeleteClearCommand(
  channel: discord.Channel.AnyChannel
): Promise<void> {
  if (!Settings.enabled) return;

  await BetterKV.del(`messages-${channel.id}`, 'clearcmd');
}

export async function CloseSupportTicket(msg: discord.Message): Promise<void> {
  if (!Settings.enabled) return;

  const channel:
    | discord.GuildTextChannel
    | discord.GuildNewsChannel = (await msg.getChannel()) as any;

  if (
    channel?.parentId === Settings.Channels.SUPPORTPARENT &&
    msg.content === 'close'
  )
    await channel?.delete();
}

export async function VerificationStart(
  userId: discord.Snowflake
): Promise<void> {
  if (!Settings.enabled) return;

  const guild = await discord.getGuild();

  await guild
    .createChannel({
      type: discord.Channel.Type.GUILD_TEXT,
      name: `CAPTCHA-${userId}`,
      parentId: Settings.Channels.VERIFICATIONPARENT,
      permissionOverwrites: [
        {
          type: discord.Channel.PermissionOverwriteType.ROLE,
          id: guild.id,
          allow: 0,
          deny: 0x400
        },
        {
          type: discord.Channel.PermissionOverwriteType.MEMBER,
          id: userId,
          allow: 0x400 | 0x10000 | 0x800,
          deny: 0
        }
      ]
    })
    .then(async (c) => {
      const captcha: {
        msg: string;
        value: string;
      } = Functions.GenerateCaptcha();

      await Functions.SendMessage(
        c as discord.GuildTextChannel,
        new discord.Embed({
          title: 'Captcha',
          color: Settings.Color.DEFAULT,
          description: `To gain acces to all the channels, answer with this captcha text: ${'`' +
            captcha.msg +
            '`'}. You have three tries! If you can't read the captcha write ${'`retry`'} to generate a new captcha.`,
          footer: { text: 'Time left until invalid: ' },
          timestamp: new Date(
            Date.now() + Settings.verificationAccepTime
          ).toISOString()
        })
      );

      await BetterKV.save(
        `u-${userId}`,
        {
          captcha: captcha,
          userId: userId,
          channelId: c.id,
          trys: 0,
          ttl: Date.now() + Settings.verificationAccepTime
        },
        'captcha'
      );
    });
}

export async function VerificationSubmit(msg: discord.Message): Promise<void> {
  if (!Settings.enabled) return;

  let captcha: Definitions.Captcha | undefined = await BetterKV.get<any>(
    `u-${msg.author.id}`,
    'captcha'
  );

  if (
    captcha === undefined ||
    msg.channelId !== captcha.channelId ||
    msg.author.id !== captcha.userId
  )
    return;

  if (msg.content === 'retry') {
    // generate new captcha
    captcha.captcha = Functions.GenerateCaptcha();
    await BetterKV.save(`u-${msg.author.id}`, captcha as any, 'captcha');

    await msg?.reply(
      new discord.Embed({
        title: 'New Captcha',
        color: Settings.Color.DEFAULT,
        description: `To gain acces to all the channels, answer with this captcha text: ${'`' +
          captcha.captcha.msg +
          '`'}. You have three tries! If you can't read the captcha write ${'`retry`'} to generate a new captcha.`,
        footer: { text: 'Time left until invalid: ' },
        timestamp: new Date(captcha.ttl).toISOString()
      })
    );
  } else if (msg.content === captcha.captcha.value) {
    // right
    await msg?.reply(
      `The process was successfull! This channel will get deleted in 20 seconds.`
    );

    // give the role
    await msg.member?.addRole(Settings.Roles.MEMBER);

    await Functions.SendMessage(
      Settings.Channels.WELCOME,
      new discord.Embed({
        color: Math.random() * 0xffffff,
        author: {
          iconUrl: msg.member?.user.getAvatarUrl(),
          name: msg.member?.user.username
        },
        timestamp: new Date().toISOString(),
        description: Settings.welcomeMsgs[
          Math.floor(Math.random() * Math.floor(Settings.welcomeMsgs.length))
        ].replace('@user', msg.member?.toMention() ?? '')
      })
    );

    // deletes the data
    await BetterKV.del(`u-${captcha.userId}`, 'captcha');
    try {
      // deletes the channel
      setTimeout(
        async () =>
          (await discord.getGuildTextChannel(msg.channelId))?.delete(),
        20000
      );
    } catch (_) {}
  } else if (captcha.trys >= 3) {
    // too many tries
    await msg?.reply(
      `You did it three times wrong! Restart the whole process in 20 seconds please.`
    );
    // deletes the data
    await BetterKV.del(`u-${captcha.userId}`, 'captcha');
    try {
      // deletes the channel
      setTimeout(
        async () =>
          (await discord.getGuildTextChannel(msg.channelId))?.delete(),
        20000
      );
    } catch (_) {}
  } else {
    // increase the trys
    captcha.trys++;
    await BetterKV.save(`u-${captcha.userId}`, captcha as any, 'captcha');
    await msg?.reply(
      `Wrong captcha, try it again! Trys left: ${4 - captcha.trys}`
    );
  }
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

  try {
    await msg?.deleteReaction(reaction.emoji.name ?? '-', reaction.userId);
  } catch (_) {}

  if (
    reaction.emoji.name !== Settings.Emojis.AGREE ||
    reaction.member?.roles.length !== 0 ||
    member === undefined
  )
    return;

  // gets the data of the user
  const userdata: Definitions.GHC_User | undefined = await BetterKV.get<any>(
    `user-${reaction.userId}`,
    'user'
  );

  // gets the data of the user
  const runningCaptcha: Definitions.Captcha | undefined = await BetterKV.get<
    any
  >(`u-${reaction.userId}`, 'captcha');

  if (runningCaptcha === undefined) await VerificationStart(reaction.userId);

  // save user in database
  if (userdata === undefined)
    await BetterKV.save(
      `user-${reaction.userId}`,
      {
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

  return;
  if ((userdata?.s ?? true) === true) {
    //  the user accepted the rules so the user gets the member or maintenance role and a welcome msg is throwen in the #welcome channel.
    await member?.addRole(Settings.Roles.MEMBER);
  } else {
    // user was banned befor rejoining the guild, so he gets the blocked role or maintenance
    await member?.addRole(Settings.Roles.BLOCKED);
  }
}

export async function Help(
  reaction: discord.Event.IMessageReactionAdd
): Promise<void> {
  if (!Settings.enabled) return;

  const message: discord.Message | null | undefined = await (
    await discord.getGuildTextChannel(reaction.channelId)
  )?.getMessage(reaction.messageId);

  if (message === null || message === undefined) return;

  const helps: Definitions.HelpCmd[] =
    (await BetterKV.get<Definitions.HelpCmd[]>(`helps`, 'helpcmd')) ?? [];

  const help: Definitions.HelpCmd | undefined = helps.find(
    (h) => h.msg === reaction.messageId
  );

  if (help === undefined) return;

  try {
    await message?.deleteReaction(reaction.emoji.name ?? '', reaction.userId);
  } catch (_) {}

  if (reaction.emoji.name === Settings.Emojis.DISAGREE) {
    // delete msg
    const i: number = helps.findIndex((h) => h.msg === help?.msg);

    if (i !== -1) {
      helps.splice(i, 1);

      if (helps.length !== 0) await BetterKV.save('helps', helps, 'helpcmd');
      else await BetterKV.del('helps', 'helpcmd');
    }

    await message?.delete();
    return;
  }

  if (Settings.numberEmojis.includes(reaction.emoji.name ?? '-'))
    // the emoji was a number
    await Functions.EditMessage(
      message,
      await Functions.HelpMsg(
        Settings.numberEmojis.indexOf(reaction.emoji.name ?? '-'),
        help.permissionLvl
      )
    );
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

  await Functions.SendMessage(
    msg,
    new discord.Embed({
      color: Settings.Color.RED,
      title: 'Böses Wort',
      description: `Nani!? Hüte deine Zunge, ${msg.member?.toMention()}!`,
      timestamp: new Date().toISOString()
    }),
    28000
  );

  await Functions.SendMessage(
    Settings.Channels.BOT,
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
  );

  await msg?.delete();
}

export async function MessageDelete(
  event: discord.Event.IMessageDelete,
  oldMsg: discord.Message.AnyMessage | null
): Promise<void> {
  if (!Settings.enabled || oldMsg?.author.id === Settings.pylonId) return;

  // msg in #message-delete
  Functions.SendMessage(Settings.Channels.MESSAGEDELETE, {
    allowedMentions: {},
    content:
      Functions.TimeString() +
      ' (`Message Delete`) 🗑️ ' +
      (oldMsg?.member?.toMention() ?? 'no saved member') +
      ' message deleted [`' +
      event.channelId +
      '`] in <#' +
      event.channelId +
      '>: ```' +
      (oldMsg?.content ?? '-') +
      '```'
  });
}

export async function BulkMessageDelete(
  event: discord.Event.IMessageDeleteBulk
): Promise<void> {
  if (!Settings.enabled) return;

  // msg in #message-delete
  await Functions.SendMessage(Settings.Channels.MESSAGEDELETE, {
    allowedMentions: {},
    content:
      Functions.TimeString() +
      ' (`Bulkd Message Delete`) 🗑️ messages deleted [`' +
      event.channelId +
      '`] in <#' +
      `${event.channelId}>: ${event.ids.length} deleted messages`
  });
}

export async function MessageDeleteClearCmd(
  message: discord.Event.IMessageDelete,
  oldMsg: discord.Message.AnyMessage | null
): Promise<void> {
  if (!Settings.enabled) return;

  let messages: discord.Snowflake[] | undefined =
    (await BetterKV.get<discord.Snowflake[]>(
      `messages-${message.channelId}`,
      'clearcmd'
    )) ?? [];

  let index: number = messages.findIndex((m) => m === message.id);
  if (index === -1) return;

  messages.splice(index, 1);

  if (messages.length !== 0)
    await BetterKV.save(`messages-${message.channelId}`, messages, 'clearcmd');
  else await BetterKV.del(`messages-${message.channelId}`, 'clearcmd');
}

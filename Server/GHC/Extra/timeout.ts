// Florian Crafter - March 2021 - Version 1.0

// everything has +- 5min delay

export enum ActionType {
  EDIT_GUILD,
  SEND_MESSAGE,
  DELETE_MESSAGE,
  BULK_DELETE_MESSAGES,
  EDIT_MESSAGE,
  PIN_MESSAGE,
  UNPIN_MESSAGE,
  START_TYPING,
  ADD_REACTION,
  REMOVE_REACTION,
  DELETE_ALL_REACTIONS,
  EDIT_CHANNEL,
  CREATE_CHANNEL,
  DELETE_CHANNEL,
  MEMBER_EDIT,
  MEMBER_ADD_ROLE,
  MEMBER_REMOVE_ROLE,
  MEMBER_KICK,
  MEMBER_BAN,
  MEMBER_UNBAN,
  EDIT_ROLE,
  CREATE_ROLE,
  DELETE_ROLE,
  EDIT_EMOJI,
  CREATE_EMOJI,
  DELETE_EMOJI,
  SET_KV_ITEM,
  DELETE_KV_ITEM,
  CLEAR_KV
}

const params: { [key: number]: IActionInfosOp } = {
  [ActionType.EDIT_GUILD]: {
    guildProperties: {}
  },
  [ActionType.SEND_MESSAGE]: {
    messageText: '',
    channelId: ''
  },
  [ActionType.DELETE_MESSAGE]: {
    channelId: '',
    messageId: ''
  },
  [ActionType.BULK_DELETE_MESSAGES]: {
    channelId: '',
    messageIds: ['']
  },
  [ActionType.EDIT_MESSAGE]: {
    messageText: '',
    channelId: '',
    messageId: ''
  },
  [ActionType.PIN_MESSAGE]: {
    channelId: '',
    messageId: ''
  },
  [ActionType.UNPIN_MESSAGE]: {
    channelId: '',
    messageId: ''
  },
  [ActionType.START_TYPING]: {
    channelId: ''
  },
  [ActionType.ADD_REACTION]: {
    channelId: '',
    messageId: '',
    emoji: ''
  },
  [ActionType.REMOVE_REACTION]: {
    channelId: '',
    messageId: '',
    emoji: '',
    userId: ''
  },
  [ActionType.DELETE_ALL_REACTIONS]: {
    channelId: '',
    messageId: ''
  },
  [ActionType.EDIT_CHANNEL]: {
    channelId: '',
    channelProperties: {}
  },
  [ActionType.CREATE_CHANNEL]: {
    channelProperties: {}
  },
  [ActionType.DELETE_CHANNEL]: {
    channelId: ''
  },
  [ActionType.MEMBER_EDIT]: {
    userId: '',
    memberProperties: {}
  },
  [ActionType.MEMBER_ADD_ROLE]: {
    userId: '',
    roleId: ''
  },
  [ActionType.MEMBER_REMOVE_ROLE]: {
    userId: '',
    roleId: ''
  },
  [ActionType.MEMBER_KICK]: {
    userId: ''
  },
  [ActionType.MEMBER_BAN]: {
    userId: '',
    banReason: 'F'
  },
  [ActionType.MEMBER_UNBAN]: {
    userId: ''
  },
  [ActionType.EDIT_ROLE]: {
    roleId: '',
    roleProperties: {}
  },
  [ActionType.CREATE_ROLE]: {
    roleProperties: {}
  },
  [ActionType.DELETE_ROLE]: {
    roleId: ''
  },
  [ActionType.EDIT_EMOJI]: {
    emoji: '',
    emojiProperties: {}
  },
  [ActionType.CREATE_EMOJI]: {
    emojiProperties: {}
  },
  [ActionType.DELETE_EMOJI]: {
    emoji: ''
  },
  [ActionType.SET_KV_ITEM]: {
    key: '',
    value: '',
    namespace: ''
  },
  [ActionType.DELETE_KV_ITEM]: {
    key: '',
    namespace: ''
  },
  [ActionType.CLEAR_KV]: {
    namespace: ''
  }
};

interface IActionInfos extends IActionInfosOp {
  type: ActionType;
  time: number;
  id?: string;
}

interface IActionInfosOp {
  userId?: discord.Snowflake;
  roleId?: discord.Snowflake;
  messageId?: discord.Snowflake;
  messageIds?: discord.Snowflake[];
  channelId?: discord.Snowflake;
  banReason?: string;
  messageText?: string | discord.Embed;
  emoji?: string | discord.Emoji.IEmoji;
  key?: string;
  value?: pylon.Json;
  namespace?: string;
  memberProperties?: discord.GuildMember.IGuildMemberOptions;
  roleProperties?: discord.Role.IRoleOptions;
  guildProperties?: discord.Guild.IGuildOptions;
  emojiProperties?:
    | discord.Emoji.IEditEmojiOptions
    | discord.Guild.ICreateEmojiOptions;
  channelProperties?:
    | discord.Guild.CreateChannelOptions
    | discord.GuildChannel.IGuildChannelOptions
    | discord.GuildTextChannel.IGuildTextChannelOptions
    | discord.GuildVoiceChannel.IGuildVoiceChannelOptions
    | discord.GuildCategory.IGuildCategoryOptions
    | discord.GuildNewsChannel.IGuildNewsChannelOptions
    | discord.GuildStoreChannel.IGuildStoreChannelOptions
    | discord.GuildStageVoiceChannel.IGuildStageVoiceChannelOptions;
}

const KV = new pylon.KVNamespace('timeout');

//pylon.tasks.cron('actionTimeout', '0 0/5 * * * * *', Cron);

// #region external functions
export async function ActionTimeout(
  type: ActionType,
  time: number,
  infos: IActionInfosOp,
  id?: string
): Promise<string | 'ERROR'> {
  if (time < 0) return 'ERROR';

  let currentData: IActionInfos[] = await GetActions();

  // create the action
  let values: IActionInfos = {
    type: type,
    time: Date.now() + time
  };

  let usedId: string | undefined = id!;
  // add id
  if (id === undefined) {
    usedId = Math.random()
      .toString(36)
      .substring(7);
    values.id = usedId;
  } else values.id = id;

  for await (const param of Object.keys(params[type])) {
    if (
      ((infos as any)[param] === undefined && type !== ActionType.MEMBER_BAN) ||
      ((infos as any)[param] === undefined &&
        param !== 'banReason' &&
        type === ActionType.MEMBER_BAN)
    )
      return 'ERROR';

    (values as any)[param] = (infos as any)[param];
  }

  currentData.push(values);
  await SaveActions(currentData);

  return usedId;
}

export async function GetAction(id: string): Promise<IActionInfos | undefined> {
  const currentData: IActionInfos[] = await GetActions();
  const index = currentData.findIndex((d) => d.id === id);

  if (index === -1) return;
  else return currentData[index];
}

export async function CancelAction(id: string): Promise<boolean> {
  let currentData: IActionInfos[] = await GetActions();

  const index = currentData.findIndex((d) => d.id === id);

  if (index === -1) return false;
  else {
    currentData.splice(index, 1);
    return await SaveActions(currentData);
  }
}
// #endregion

// #region internal functions
async function Cron(): Promise<void> {
  let data: IActionInfos[] = await GetActions();
  let dataCopy: IActionInfos[] = data.map((x) => x);

  if (data.length === 0) return;

  for (let i: number = 0; i < data.length; ++i)
    if (data[i].time < Date.now()) {
      await ExecuteAction(data[i]);
      dataCopy.splice(i, 1); // copy gets spliced and not the real data
    }

  await SaveActions(dataCopy);
}

async function SaveActions(data: IActionInfos[]): Promise<boolean> {
  if (data.length === 0) await KV.delete('actions');
  else await KV.put('actions', data as any);
  return true;
}

async function SaveAction(data: IActionInfos): Promise<boolean> {
  let cData: IActionInfos[] = (((await KV.get('actions')) ??
    []) as unknown) as IActionInfos[];
  cData.push(data);
  await KV.put('actions', data as any);
  return true;
}

async function GetActions(): Promise<IActionInfos[]> {
  let data: IActionInfos[] | undefined = (await KV.get('actions')) as any;
  if (data === undefined) return [];
  else return data;
}

async function ExecuteAction(infos: IActionInfos): Promise<void> {
  try {
    const guild = await discord.getGuild();

    switch (infos.type) {
      case ActionType.SEND_MESSAGE:
        discord
          .getGuildTextChannel(infos.channelId!)
          .then(
            async (channel) =>
              await channel?.sendMessage(infos.messageText! as any)
          );

        break;
      case ActionType.EDIT_MESSAGE:
        discord
          .getGuildTextChannel(infos.channelId!)
          .then(async (channel) =>
            channel
              ?.getMessage(infos.messageId!)
              .then(
                async (message) =>
                  await message?.edit(infos.messageText! as any)
              )
          );

        break;
      case ActionType.DELETE_MESSAGE:
        discord
          .getGuildTextChannel(infos.channelId!)
          .then(async (channel) =>
            channel
              ?.getMessage(infos.messageId!)
              .then(async (message) => await message?.delete())
          );

        break;
      case ActionType.MEMBER_ADD_ROLE:
        await guild
          .getMember(infos.userId!)
          .then(async (member) => await member?.addRole(infos.roleId!));

        break;
      case ActionType.MEMBER_REMOVE_ROLE:
        await guild
          .getMember(infos.userId!)
          .then(async (member) => await member?.removeRole(infos.roleId!));

        break;
      case ActionType.DELETE_ROLE:
        await guild
          .getRole(infos.roleId!)
          .then(async (role) => await role?.delete());

        break;
      case ActionType.DELETE_CHANNEL:
        await guild
          .getChannel(infos.channelId!)
          .then(async (channel) => await channel?.delete());

        break;
      case ActionType.EDIT_CHANNEL:
        await guild
          .getChannel(infos.channelId!)
          .then(
            async (channel) =>
              await (channel as any)?.edit(infos.channelProperties!)
          );

        break;
      case ActionType.MEMBER_KICK:
        await guild
          .getMember(infos.userId!)
          .then(async (member) => await member?.kick());

        break;
      case ActionType.MEMBER_BAN:
        await guild
          .getMember(infos.userId!)
          .then(
            async (member) => await member?.ban({ reason: infos.banReason })
          );

        break;
      case ActionType.MEMBER_EDIT:
        await guild
          .getMember(infos.userId!)
          .then(async (member) => await member?.edit(infos.memberProperties!));

        break;
      case ActionType.EDIT_ROLE:
        await guild
          .getRole(infos.roleId!)
          .then(async (role) => await role?.edit(infos.roleProperties!));

        break;
      case ActionType.CREATE_CHANNEL:
        await guild.createChannel(
          infos.channelProperties! as discord.Guild.CreateChannelOptions
        );

        break;
    }
  } catch (e) {
    console.log(e);
  }
}
// #endregion

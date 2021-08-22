// Florian Strobl - ClashCrafter#0001 - March 2021 - Version 1.1
// You can combine this with my !clear command if you uncomment the lines where EDIT is

export async function sendMessage(
  where:
    | string // channel id
    | discord.Message // reply to message
    | discord.GuildMemberMessage // reply to message
    | discord.GuildTextChannel // channel object
    | null
    | undefined,
  message:
    | string
    | discord.Embed
    | discord.Message.IOutgoingMessageOptions
    | null
    | undefined,
  deleteTime?: number
): Promise<discord.Message | undefined> {
  if (
    where === undefined ||
    where === null ||
    message === undefined ||
    message == null
  )
    return undefined;

  let sendMessageChannel: discord.GuildTextChannel | undefined;
  if (where instanceof discord.GuildTextChannel) {
    sendMessageChannel = where;
  } else if (
    where instanceof discord.GuildMemberMessage ||
    where instanceof discord.Message
  ) {
    sendMessageChannel = (await where.getChannel()) as discord.GuildTextChannel;
  } else {
    await discord
      .getGuildTextChannel(where as string)
      .then(async (c) => (sendMessageChannel = c as discord.GuildTextChannel));
  }

  const msg:
    | discord.Message
    | undefined = await sendMessageChannel?.sendMessage(
    (message as unknown) as discord.Message.OutgoingMessageArgument<
      discord.Message.OutgoingMessageOptions
    >
  );

  // EDIT
  // await SaveClearMessages(sendMessageChannel?.id, msg?.id);

  if (deleteTime !== undefined)
    setTimeout(() => msg?.delete(), deleteTime > 30000 ? 28500 : deleteTime);

  return msg;
}

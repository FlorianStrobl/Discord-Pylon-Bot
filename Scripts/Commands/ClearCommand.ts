// Florian Crafter - Clash Crafter#7370 March 2021

// Save the last 350 messages (it's about 350) from a channel and delete them with !clear n. The code DOESN'T save the messages from Pylon itself so these can't be deleted :(

const KV = new pylon.KVNamespace('clear');

discord.on(
  discord.Event.MESSAGE_CREATE,
  async (message) => await SaveMessageIds(message.id, message.channelId)
);

async function SaveMessageIds(messageId: string, channelId: string) {
  let messages: string[] = (await KV.get(`messages-${channelId}`)) ?? [];
  messages.push(messageId);

  while (JSON.stringify(messages).length > 8192) messages.splice(0, 1);

  await KV.put(`messages-${channelId}`, messages);
}

discord.on(discord.Event.MESSAGE_DELETE, async (message) => {
  let messages: string[] =
    (await KV.get(`messages-${message.channelId}`)) ?? [];

  let index: number | undefined = messages.findIndex((m) => m === message.id);
  if (index === -1) return;

  messages.splice(index, 1);

  if (messages.length !== 0)
    await KV.put(`messages-${message.channelId}`, messages);
  else await KV.delete(`messages-${message.channelId}`);
});

Commands.on(
  {
    name: 'clear'
  },
  (args) => ({
    n: args.number()
  }),
  async (message, { n }) => {
    const func: number | undefined = await deleteMessages(message.channelId, n);

    await message.delete();

    let responseMsg: discord.Message;
    if (func === undefined)
      responseMsg = await message?.reply(
        `Deleted no messages from this channel.`
      );
    else
      responseMsg = await message?.reply(
        `Deleted the last ${func} messages from this channel.`
      );

    setTimeout(() => responseMsg.delete(), 10000);
  }
);

async function deleteMessages(
  channelId: string,
  nr: number
): Promise<number | undefined> {
  let messages: string[] | undefined = await KV.get(`messages-${channelId}`);
  if (messages === undefined) return undefined;

  const channel = await discord.getGuildTextChannel(channelId);

  let toDeleteMessages: string[] = [];
  for (
    let i = messages.length - (nr < messages.length ? nr : messages.length);
    i < messages.length;
    ++i
  )
    toDeleteMessages.push(messages[i]);

  if (toDeleteMessages.length === 1)
    await (await channel?.getMessage(toDeleteMessages[0]))?.delete();
  else if (toDeleteMessages.length !== 0)
    await channel?.bulkDeleteMessages(toDeleteMessages);

  await KV.put(
    `messages-${channelId}`,
    messages.filter((mId) => !toDeleteMessages.includes(mId))
  );

  return toDeleteMessages.length;
}

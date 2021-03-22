// Florian Crafter - Clash Crafter#7370 March 2021

const KV = new pylon.KVNamespace('clear');

discord.on(
  discord.Event.MESSAGE_CREATE,
  async (message) => await ClearMessages(message.id, message.channelId)
);

async function ClearMessages(messageId: string, channelId: string) {
  let messages: string[] = (await KV.get(`messages-${channelId}`)) ?? [];
  messages.push(messageId);

  while (JSON.stringify(messages).length > 8192) messages.splice(0, 1);

  await KV.put(`messages-${messageId}`, messages);
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

Definitions.Commands.on(
  {
    name: 'clear'
  },
  (args) => ({
    n: args.number()
  }),
  async (message, { n }) => {
    let messages: string[] | undefined = await KV.get(
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

    await KV.put(
      `messages-${message.channelId}`,
      messages.filter((mId) => !toDeleteMessages.includes(mId))
    );

    await message.delete();
    const responseMsg = await message?.reply(
      `Deleted the last ${toDeleteMessages.length} messages from this channel.`
    );
    setTimeout(() => responseMsg.delete(), 10000);
  }
);

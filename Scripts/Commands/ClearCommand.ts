// Florian Crafter - Clash Crafter#7370 - March 2021 - Version 1.4

// Save the last 350 messages (it's about 350) from a channel and delete them with !clear n. The code DOESN'T save the messages from Pylon itself so these can't be deleted :(
// To delete the messages of the bot itself, you can use my SendMessage() function, which saves the ids of the bot ids too
// (https://gist.github.com/FlorianStrobl/8c606ce857eb6c6d422fc47263e9446f)

const KV = new pylon.KVNamespace('clear');
const Commands = new discord.command.CommandGroup();

Commands.on(
  {
    name: 'clear'
  },
  (args) => ({
    number: args.number()
  }),
  async (message, { number }) => {
    const numberOfDeletedMessages: number = await DeleteClearMessages(
      message.channelId,
      number
    );

    let response: discord.Message;
    if (numberOfDeletedMessages === 0)
      response = await message?.reply(`No messages deleted.`);
    else
      response = await message?.reply(
        `Deleted the last ${numberOfDeletedMessages} message(s) from this channel.`
      );

    setTimeout(() => response?.delete(), 10000);

    await message?.delete();
  }
);

discord.on(discord.Event.MESSAGE_CREATE, (message) =>
  SaveClearMessages(message.channelId, message.id)
);

discord.on(discord.Event.MESSAGE_DELETE, async (message) => {
  let messages: string[] =
    (await KV.get(`messages-${message.channelId}`)) ?? [];

  let index: number = messages.findIndex((m) => m === message.id);
  if (index === -1) return;

  messages.splice(index, 1);

  if (messages.length !== 0)
    await KV.put(`messages-${message.channelId}`, messages);
  else await KV.delete(`messages-${message.channelId}`);
});

discord.on(discord.Event.CHANNEL_DELETE, async (channel) => {
  await Database.DeleteData(`messages-${channel.id}`, 'clear');
});

async function DeleteClearMessages(
  channelId: string,
  nr: number
): Promise<number> {
  let messages: string[] | undefined = await KV.get(`messages-${channelId}`);
  if (messages === undefined) return 0;

  const channel = await discord.getGuildTextChannel(channelId);

  let toDeleteMessages: string[] = [];
  for (
    let i = messages.length - (nr < messages.length ? nr : messages.length);
    i < messages.length;
    ++i
  )
    toDeleteMessages.push(messages[i]);

  if (toDeleteMessages.length === 1) {
    try {
      await (await channel?.getMessage(toDeleteMessages[0]))?.delete();
    } catch (_) {}
  } else if (toDeleteMessages.length !== 0) {
    try {
      await channel?.bulkDeleteMessages(toDeleteMessages);
    } catch (_) {}
  }

  const currentMessages: string[] = messages.filter(
    (m) => !toDeleteMessages.includes(m)
  );

  if (currentMessages.length === 0)
    try {
      await KV.delete(`messages-${channelId}`);
    } catch (_) {}
  else {
    await KV.put(`messages-${channelId}`, currentMessages);
  }

  return toDeleteMessages.length;
}

export async function SaveClearMessages(
  channelId: string | undefined,
  messageId: string | undefined
): Promise<void> {
  if (messageId === undefined || channelId === undefined) return;

  let messages: string[] = (await KV.get(`messages-${channelId}`)) ?? [];
  messages.push(messageId);
  while (JSON.stringify(messages).length > 8192) messages.splice(0, 1);

  await KV.put(`messages-${channelId}`, messages);
}

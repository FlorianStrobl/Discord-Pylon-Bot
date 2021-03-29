// Florian Crafter - Clash Crafter#7370 - March 2021 - Version 1.2a

// Save the last 350 messages (it's about 350) from a channel and delete them with !clear n. The code DOESN'T save the messages from Pylon itself so these can't be deleted :(
// To delete the messages of the bot itself, you can use my SendMessage() function, which saves the ids of the bot ids too
// (https://gist.github.com/FlorianStrobl/8c606ce857eb6c6d422fc47263e9446f)

const KV = new pylon.KVNamespace('clear');

Commands.on(
  {
    name: 'clear'
  },
  (args) => ({
    n: args.number()
  }),
  async (message, { n }) => {
    await message.delete();
    
    const func: number | undefined = await DeleteClearMessages(message.channelId, n);

    let responseMsg: discord.Message;
    if (func === undefined)
      responseMsg = await message?.reply(
        `Deleted no messages from this channel.`
      );
    else
      responseMsg = await message?.reply(
        `Deleted the last ${func} message(s) from this channel.`
      );

    setTimeout(() => responseMsg?.delete(), 10000);
  }
);

discord.on(
  discord.Event.MESSAGE_CREATE,
  async (message) => await SaveClearMessages(message.channelId, message.id)
);

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

async function DeleteClearMessages(
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

  if (toDeleteMessages.length !== 0)
    await KV.put(
      `messages-${channelId}`,
      messages.filter((mId) => !toDeleteMessages.includes(mId))
    );
  else {
    try {
      await KV.delete(`messages-${channelId}`);
    } catch (_) { }
  }

  return toDeleteMessages.length;
}

export async function SaveClearMessages(
  channelId: string | undefined,
  messageId: string | undefined
): Promise<void> {
  if (messageId === undefined || channelId === undefined) return;
  
  let messages: string[] =
    (await KV.get(`messages-${channelId}`)) ?? [];
  messages.push(messageId);
  while (JSON.stringify(messages).length > 8192) messages.splice(0, 1);

  await KV.put(`messages-${channelId}`, messages);
}

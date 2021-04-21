import * as Functions from '../Main/functions';
import * as Handler from '../Functions/handler';

discord.on(discord.Event.MESSAGE_REACTION_ADD, Handler.Rules); // rules read and the welcome msg / the kick
discord.on(discord.Event.MESSAGE_REACTION_ADD, Handler.Help); // help msg
discord.on(discord.Event.MESSAGE_CREATE, Handler.BlacklistedWords); // word blacklist
discord.on(discord.Event.MESSAGE_DELETE, Handler.MessageDelete); // save deleted messages
discord.on(discord.Event.MESSAGE_DELETE_BULK, Handler.BulkMessageDelete); // save deleted messages
discord.on(discord.Event.MESSAGE_CREATE, (message) =>
  Functions.SaveClearMessages(message.channelId, message.id)
); // save message ids for !clear
discord.on(discord.Event.MESSAGE_DELETE, Handler.MessageDeleteClearCmd); // delete saved message ids for !clear
discord.on(discord.Event.CHANNEL_DELETE, Handler.ChannelDeleteClearCommand); // !clear
discord.on(discord.Event.MESSAGE_CREATE, Handler.VerificationSubmit); // in verification process
discord.on(discord.Event.MESSAGE_CREATE, Handler.CloseSupportTicket); // close open support tickets

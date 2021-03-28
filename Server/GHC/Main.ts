// Beta - Coder: Florian Crafter

import * as Definitions from './Main/definitions';
import * as Settings from './Main/settings';
import * as Functions from './Main/functions';
import * as Database from './Main/database';
import * as Cron from './Extra/cron';
import * as Handler from './Extra/handlers';
import * as Command from './Main/commands';
import * as SlashCommand from './Main/slashCommands';
import './Extra/logging';

new discord.command.CommandGroup().raw('t', async function(m) {
  await m.delete();
});

// #region pylon.task.cron
pylon.tasks.cron('password', '0 0 0 * * Mon *', Cron.NewPassword); // password one per week
pylon.tasks.cron('stats', '0 0/5 * * * * *', Cron.StatsChannels); // #stats
pylon.tasks.cron('news', '0 0 0-23 * * * *', Cron.NewsMessages); // #news auto messages
// #endregion

// #region discord.on
discord.on(discord.Event.MESSAGE_CREATE, Handler.BlacklistedWords); // word blacklist
discord.on(discord.Event.MESSAGE_DELETE, Handler.MessageDelete); // save deleted messages
discord.on(discord.Event.MESSAGE_DELETE_BULK, Handler.BulkMessageDelete); // save deleted messages
discord.on(discord.Event.MESSAGE_REACTION_ADD, Handler.Rules); // rules read and the welcome msg / the kick
discord.on(discord.Event.MESSAGE_REACTION_ADD, Handler.Help); // help msg
discord.on(discord.Event.MESSAGE_CREATE, Handler.MessageCreateClearCmd);
discord.on(discord.Event.MESSAGE_DELETE, Handler.MessageDeleteClearCmd);
// #endregion

// #region cmds
// help
Definitions.Commands.on(
  {
    name: Settings.helpCommand.name,
    aliases: Settings.helpCommand.altNames,
    description: Settings.helpCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ helpLvlOrName: args.stringOptional() }),
  (msg, { helpLvlOrName }) => Command.HelpCommand(msg, helpLvlOrName)
);

// role
discord.interactions.commands.register(
  {
    name: Settings.roleCommand.name,
    description: Settings.roleCommand.description,
    showSourceMessage: false,
    options: (args) => ({
      role: args.string({
        name: 'role',
        description: 'The role you want.',
        required: true,
        choices: (Settings.roleCommand.roles as string[][]).map((e) => e[0])
      })
    })
  },
  async (cmd, { role }) => SlashCommand.RoleSlashCommand(cmd, role)
);

// warn
Definitions.PunishCmd.register(
  {
    name: Settings.warnCommand.name,
    description: 'Warn a user.',
    showSourceMessage: false,
    options: (args) => ({
      user: args.guildMember({
        name: 'user',
        description: 'The user.',
        required: true
      }),
      reason: args.string({
        name: 'reason',
        description: 'Why you want to punish the user.',
        required: true
      })
    })
  },
  (message, { user, reason }) => Command.WarnCommand(message, user, reason)
);

// clear
Definitions.Commands.on(
  {
    name: Settings.clearCommand.name,
    aliases: Settings.clearCommand.altNames,
    description: Settings.clearCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({
    n: args.number()
  }),
  async (message, { n }) => Command.ClearCommand(message, n)
);

// serverStats
Definitions.Commands.raw(
  {
    name: Settings.serverStatsCommand.name,
    aliases: Settings.serverStatsCommand.altNames,
    description: Settings.serverStatsCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  Command.ServerStatsCommand
);

// invite
Definitions.Commands.raw(
  {
    name: Settings.inviteCommand.name,
    aliases: Settings.inviteCommand.altNames,
    description: Settings.inviteCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  Command.InviteCommand
);

// ping
Definitions.Commands.raw(
  {
    name: Settings.pingCommand.name,
    aliases: Settings.pingCommand.altNames,
    description: Settings.pingCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  Command.PingCommand
);

// report
Definitions.Commands.on(
  {
    name: Settings.reportCommand.name,
    aliases: Settings.reportCommand.altNames,
    description: Settings.reportCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ user: args.guildMember(), reason: args.text() }),
  (msg, { user, reason }) => Command.ReportCommand(msg, user, reason)
);

// say
Definitions.Commands.on(
  {
    name: Settings.sayCommand.name,
    aliases: Settings.sayCommand.altNames,
    description: Settings.sayCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string(), msg: args.text() }),
  (message, { password, msg }) => Command.SayCommand(message, password, msg)
);

// survey
Definitions.Commands.on(
  {
    name: Settings.surveyCommand.name,
    aliases: Settings.surveyCommand.altNames,
    description: Settings.surveyCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string(), survey: args.text() }),
  (message, { password, survey }) =>
    Command.SurveyCommand(message, password, survey)
);

// closeSurvey - To edit with .iterMessages() - To do
Definitions.Commands.on(
  {
    name: Settings.closeSurveyCommand.name,
    aliases: Settings.closeSurveyCommand.altNames,
    description: Settings.closeSurveyCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string(), surveyNr: args.integer() }),
  (message, { password, surveyNr }) =>
    Command.CloseSurveyCommand(message, password, surveyNr)
);

// apply
Definitions.Commands.on(
  {
    name: Settings.applyCommand.name,
    aliases: Settings.applyCommand.altNames,
    description: Settings.applyCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({
    password: args.string(),
    bool: args.string({
      choices: Settings.optionsTrue.concat(Settings.optionsFalse)
    })
  }),
  (message, { password, bool }) => Command.ApplyCommand(message, password, bool)
);

// showApplicants
Definitions.Commands.raw(
  {
    name: Settings.showApplicantsCommand.name,
    aliases: Settings.showApplicantsCommand.altNames,
    description: Settings.showApplicantsCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  Command.ShowApplicants
);

// userStats - to do Rechte
Definitions.Commands.on(
  {
    name: Settings.userStatsCommand.name,
    aliases: Settings.userStatsCommand.altNames,
    description: Settings.userStatsCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ user: args.guildMember() }),
  (message, { user }) => Command.UserStatsCommand(message, user)
);

// ResetKV
Definitions.Commands.on(
  {
    name: Settings.resetKVCommand.name,
    aliases: Settings.resetKVCommand.altNames,
    description: Settings.resetKVCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string() }),
  (message, { password }) => Command.ResetKvCommand(message, password)
);

// showCase - to do
Definitions.Commands.on(
  {
    name: Settings.showCaseCommand.name,
    aliases: Settings.showCaseCommand.altNames,
    description: Settings.showCaseCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ Id: args.string() }),
  (message, { Id }) => Command.ShowCaseCommand(message, Id)
);

// pardon
Definitions.Commands.on(
  {
    name: Settings.pardonCommand.name,
    aliases: Settings.pardonCommand.altNames,
    description: Settings.pardonCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ user: args.guildMember() }),
  (message, { user }) => Command.PardonCommand(message, user)
);

// spawnMSG
Definitions.Commands.on(
  {
    name: Settings.spawnMSGCommand.name,
    aliases: Settings.spawnMSGCommand.altNames,
    description: Settings.spawnMSGCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string(), MSGNr: args.integer() }),
  (message, { password, MSGNr }) =>
    Command.SpawnMessageCommand(message, password, MSGNr)
);

// gif TO DO
Definitions.Commands.raw(
  {
    name: Settings.gifCommand.name,
    aliases: Settings.gifCommand.altNames,
    description: Settings.gifCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  Command.GifCommand
);
// #endregion


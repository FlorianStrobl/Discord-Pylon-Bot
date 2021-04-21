import * as Definitions from '../Main/definitions';
import * as Settings from '../Main/settings';
import * as Functions from '../Main/functions';
import * as Command from '../Functions/commands';
import * as SlashCommand from '../Functions/slashCommands';

// #region slashcmds
// role
discord.interactions.commands.register(
  {
    name: Settings.roleCommand.name,
    description: Settings.roleCommand.description,
    ackBehavior: discord.interactions.commands.AckBehavior.AUTO_DEFAULT,
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

// support
discord.interactions.commands.register(
  {
    name: Settings.supportCommand.name,
    description: Settings.supportCommand.description,
    ackBehavior: discord.interactions.commands.AckBehavior.AUTO_EPHEMERAL,
    options: (args) => ({
      topic: args.string({
        required: false,
        name: 'topic',
        description: 'A short description of your problem.'
      })
    })
  },
  async (cmd, { topic }) => Command.SupportCommand(cmd, topic!)
);

// warn
Definitions.PunishCmd.register(
  {
    name: Settings.warnCommand.name,
    description: 'Warn a user.',
    ackBehavior: discord.interactions.commands.AckBehavior.AUTO_DEFAULT,
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
// #endregion

// #region cmds
// slowmode
Definitions.Commands.on(
  {
    name: Settings.slowmodeCommand.name,
    aliases: Settings.slowmodeCommand.altNames,
    description: Settings.slowmodeCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ time: args.string(), channel: args.guildTextChannelOptional() }),
  async (msg, { time, channel }) => Command.SlowdownCommand(msg, time, channel)
);

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

// eval
Definitions.Commands.on(
  {
    name: Settings.evalCommand.name,
    aliases: Settings.evalCommand.altNames,
    description: Settings.evalCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ code: args.string() }),
  (msg, { code }) => Command.EvalCommand(msg, code)
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
  (message, { password, msg }) => Command.SayCommand(message, msg, password)
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
    Command.SurveyCommand(message, survey, password)
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
    Command.CloseSurveyCommand(message, surveyNr, password)
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
  (message, { password, bool }) => Command.ApplyCommand(message, bool, password)
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
    Command.SpawnMessageCommand(message, MSGNr, password)
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

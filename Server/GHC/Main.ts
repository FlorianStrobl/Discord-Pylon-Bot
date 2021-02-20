// Beta
// Coder: Florian Crafter

/* 
Commands.defaultRaw(async (msg) => {
  await msg?.reply(`That command doesn't even exist wtf are you doing`);
});
*/

// check if msg starts with prefix
// if (Settings.prefixes.includes(msg.content.split('')[0])) return;
// !banList - shows all the bans

// #bewerber slow mode for apply

// @ts-ignore
import './Extra/handlers';
//import './Extra/pic';
//import './Games/Minesweeper'; //TO DO

import { Commands } from '../Main/definitions';

import * as Definitions from './Main/definitions';
import * as Settings from './Main/settings';
import * as Functions from './Main/functions';
import * as Command from './Main/commands';
import * as Database from './Main/database';
import * as Cron from './Extra/cron';
import * as Handler from './Extra/handlers';

// delete user => changeOrder() but now user.1 and user.2 are the same while size is 1
// user.s = true / false bedeutung
// delete help msgs after X time
// tuple for apply max

// if new role -> settings for @dj groovy

// use for testing stuff
Definitions.Commands.raw('t', async (msg) => {
  await msg.delete();

  let n = Date.now();

  await Database.SaveData({ index: '0', data: 'my data' });
  await Database.SaveData({ index: '0', data: 'my data 2' });
  await Database.ChangeDataValues('0', (d) => {
    d.data = 'my data 3';
    return d;
  });
  await Database.GetData('0');
  await Database.GetAllData();
  await Database.DeleteData('0');
  await Database.ResetDatabase(true);

  console.log(Date.now() - n);

  console.log(await Definitions.KV.items());

  /*
  let start = Date.now();
  await Definitions.KV.put(`key`, 0);
  let put = Date.now();
  await Definitions.KV.get('key');
  let get = Date.now();
  await Definitions.KV.delete(`key`);
  let deletet = Date.now();

  console.log(
    `Total time: ${Date.now() - start}ms\nput: ${put - start}ms, get: ${get -
      put}ms, delete: ${deletet - get}ms`
  );

  new discord.Embed({
    description: 'Test',
    footer: { text: 'text' + ' '.repeat(173) + '.' }
  });

    await msg.reply(
    new discord.Embed({
      title: 'Help: stop',
      timestamp: new Date().toISOString(),
      description: 'A command',
      fields: [
        {
          name: '*Description:*',
          value: `Shutdown the server by giving everyone only the <@&${Settings.Roles.MAINTENANCE}> role.`
        },
        {
          name: '~~Permission:~~',
          value:
            `<@&${Settings.Roles.ADMINPLUS}> -` +
            '`[' +
            Settings.Roles.ADMINPLUS +
            ']`',
          inline: true
        },
        { name: '__Arguments__', value: '`[<password>]`', inline: true }
      ],
      thumbnail: {
        url:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Italian_traffic_signs_-_fermarsi_e_dare_precedenza_-_stop.svg/1200px-Italian_traffic_signs_-_fermarsi_e_dare_precedenza_-_stop.svg.png'
      },
      color: 0xff0000
    })
  );
    */
});

pylon.tasks.cron('password', '0 0 0 * * Mon *', Cron.NewPassword); // passwort one per week
pylon.tasks.cron('stats', '0 0/5 * * * * *', Cron.StatsChannels); // #stats update every 5 min
pylon.tasks.cron('news', '0 0 0-23 * * * *', Cron.NewsMessages); // calls the code once per hour

discord.on(discord.Event.MESSAGE_REACTION_ADD, Handler.Rules); // rules read and the welcome msg / the kick
discord.on(discord.Event.MESSAGE_REACTION_ADD, Handler.NewApply); // new apply
discord.on(discord.Event.MESSAGE_REACTION_REMOVE, Handler.AbortApply); // abort apply
discord.on(discord.Event.MESSAGE_CREATE, Handler.Feedback); // feedback channel
discord.on(discord.Event.MESSAGE_CREATE, Handler.BlacklistedWords); // word blacklist
//discord.on(discord.Event.MESSAGE_DELETE, Handler.MessageDelete); // save deleted messages
discord.on(discord.Event.MESSAGE_REACTION_ADD, Handler.Help); // help msg

// TODO kick voice

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
  async (message, { user, reason }) =>
    await Command.WarnCommand(message, user, reason)
);

// help
Commands.on(
  {
    name: Settings.helpCommand.name,
    aliases: Settings.helpCommand.altNames,
    description: Settings.helpCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ helpLvlOrName: args.stringOptional() }),
  async (msg, { helpLvlOrName }) =>
    await Command.HelpCommand(msg, helpLvlOrName ?? null)
);

// serverStats
Commands.raw(
  {
    name: Settings.serverStatsCommand.name,
    aliases: Settings.serverStatsCommand.altNames,
    description: Settings.serverStatsCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  Command.ServerStatsCommand
);

// invite
Commands.raw(
  {
    name: Settings.inviteCommand.name,
    aliases: Settings.inviteCommand.altNames,
    description: Settings.inviteCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  Command.InviteCommand
);

// ping
Commands.raw(
  {
    name: Settings.pingCommand.name,
    aliases: Settings.pingCommand.altNames,
    description: Settings.pingCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  Command.PingCommand
);

// report
Commands.on(
  {
    name: Settings.reportCommand.name,
    aliases: Settings.reportCommand.altNames,
    description: Settings.reportCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ user: args.guildMember(), reason: args.text() }),
  async (msg, { user, reason }) =>
    await Command.ReportCommand(msg, user, reason)
);

// start
Commands.on(
  {
    name: Settings.startCommand.name,
    aliases: Settings.startCommand.altNames,
    description: Settings.startCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string() }),
  async (message, { password }) => await Command.StartCommand(message, password)
);

// stop
Commands.on(
  {
    name: Settings.stopCommand.name,
    aliases: Settings.stopCommand.altNames,
    description: Settings.stopCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string() }),
  async (message, { password }) => await Command.StopCommand(message, password)
);

// say
Commands.on(
  {
    name: Settings.sayCommand.name,
    aliases: Settings.sayCommand.altNames,
    description: Settings.sayCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string(), msg: args.text() }),
  async (message, { password, msg }) =>
    await Command.SayCommand(message, password, msg)
);

// survey
Commands.on(
  {
    name: Settings.surveyCommand.name,
    aliases: Settings.surveyCommand.altNames,
    description: Settings.surveyCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string(), survey: args.text() }),
  async (message, { password, survey }) =>
    await Command.SayCommand(message, password, survey)
);

// closeSurvey - To edit with .iterMessages() - To do
Commands.on(
  {
    name: Settings.closeSurveyCommand.name,
    aliases: Settings.closeSurveyCommand.altNames,
    description: Settings.closeSurveyCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ surveyNr: args.integer() }),
  async (message, { surveyNr }) =>
    await Command.CloseSurveyCommand(message, surveyNr)
);

// apply
Commands.on(
  {
    name: Settings.applyCommand.name,
    aliases: Settings.applyCommand.altNames,
    description: Settings.applyCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({
    password: args.string(),
    bool: args.string({
      choices: Settings.optionsTrue.concat(Settings.optionsFalse)
    })
  }),
  async (message, { password, bool }) =>
    await Command.ApplyCommand(message, password, bool)
);

// showApplicants
Commands.raw(
  {
    name: Settings.showApplicantsCommand.name,
    aliases: Settings.showApplicantsCommand.altNames,
    description: Settings.showApplicantsCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  Command.ShowApplicants
);

// userStats - to do Rechte
Commands.on(
  {
    name: Settings.userStatsCommand.name,
    aliases: Settings.userStatsCommand.altNames,
    description: Settings.userStatsCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ user: args.guildMember() }),
  async (message, { user }) => await Command.UserStatsCommand(message, user)
);

// ResetKV
Commands.on(
  {
    name: Settings.resetKVCommand.name,
    aliases: Settings.resetKVCommand.altNames,
    description: Settings.resetKVCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string() }),
  async (message, { password }) =>
    await Command.ResetKvCommand(message, password)
);

// showCase - to do
Commands.on(
  {
    name: Settings.showCaseCommand.name,
    aliases: Settings.showCaseCommand.altNames,
    description: Settings.showCaseCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ Id: args.string() }),
  async (message, { Id }) => await Command.ShowCaseCommand(message, Id)
);

// pardon
Commands.on(
  {
    name: Settings.pardonCommand.name,
    aliases: Settings.pardonCommand.altNames,
    description: Settings.pardonCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ user: args.guildMember() }),
  async (message, { user }) => await Command.PardonCommand(message, user)
);

// spawnMSG
Commands.on(
  {
    name: Settings.spawnMSGCommand.name,
    aliases: Settings.spawnMSGCommand.altNames,
    description: Settings.spawnMSGCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string(), MSGNr: args.integer() }),
  async (message, { password, MSGNr }) =>
    await Command.SpawnMessageCommand(message, password, MSGNr)
);

// gif TO DO
Commands.raw(
  {
    name: Settings.gifCommand.name,
    aliases: Settings.gifCommand.altNames,
    description: Settings.gifCommand.description,
    onError: async (ctx, e) => await Functions.OnError(ctx, e)
  },
  Command.GifCommand
);

// cooldown per user for cmds
// punish with / as like normal cmd
// key index, for KV
// snake game
// de / en
// commands argument error
// warn, unwarn, (start, stop <= msgs) -> server status in KV beachten
// nur author bei bestätigungs reactionen
// function with Confirmation that works!
// color: blue, orange (for errors and warning), red (for warn, kick and bans)
// await c?.sendMessage({attachments: [{ name: 'SPOILER_file.png', data: await img.arrayBuffer() }]});
// voice kick with punish
// trivia game
// weihnachts Sontage + Jubiläum in #news
// dontKnowVotes on survey
// help lvl with Roles
// spawn msg with a function rather then command
// anzahl an gesperrt gewesen bei #gesperrt
// userStatsCommand - Rechte
// showCaseCommand - rechte (ab ) - fehlermeldung bei ungültiger ID
// use Log()
// close survey command all/0

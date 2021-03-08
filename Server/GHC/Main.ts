// Beta - Coder: Florian Crafter

import * as Definitions from './Main/definitions';
import * as Settings from './Main/settings';
import * as Functions from './Main/functions';
import * as Command from './Main/commands';
import * as Database from './Main/database';
import * as Cron from './Extra/cron';
import * as Handler from './Extra/handlers';

// use for testing stuff
Definitions.Commands.raw('t', async (msg) => {
  await msg.delete();

  for (let i = 0; i < 10; i++) {
    //await Definitions.KV.put(`key.${i}`, '.'.repeat(8194));
    //await Definitions.KV.delete(`key.${i}`);
  }

  //console.log(await Definitions.KV.items());

  const u = (d: Database.DataStructure) => {
    d.data = '#'.repeat(8000);
    return d;
  };
  const u2 = (d: Database.DataStructure) => {
    d.data = '+'.repeat(8000);
    return d;
  };

  const test = Date.now();
  console.log(test);

  const delay: number = 1000 * 60 * 60 * 2;

  //await new pylon.KVNamespace('t').clear();

  const t = Date.now();

  for (let i = 0; i < 0; i++) {
    console.log(
      await Database.SaveData(
        [
          { index: i, data: '.'.repeat(8000) },
          { index: i + 1, data: '.'.repeat(8000) },
          { index: i + 2, data: '.'.repeat(8000) },
          { index: i + 3, data: '.'.repeat(8000) },
          { index: i + 4, data: '.'.repeat(8000) },
          { index: i + 5, data: '.'.repeat(8000) }
        ],
        't'
      )
    );
    console.log(await Database.UpdateDataValues(i, u, 't'));
    console.log(await Database.GetData(i + 6, 't'));
    console.log(await Database.DuplicateData(i, (i + 1) * 10, 't', u2));
    console.log(await Database.ChangeIndex(i, (i + 1) * 100, 't'));
    console.log(await Database.IndexExist(i + 1, 't'));
    console.log(await Database.GetAllData('t', (d) => d.data !== undefined));
    console.log(await Database.AllIndexes('t', (d) => d.data !== undefined));
    console.log(await Database.DeleteData(i + 1, 't'));
    console.log(await Database.ResetDatabase(true, 't'));
  }

  console.log('time: ' + (Date.now() - t));
  console.log(await new pylon.KVNamespace('t').items());

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

// help
Definitions.Commands.on(
  {
    name: Settings.helpCommand.name,
    aliases: Settings.helpCommand.altNames,
    description: Settings.helpCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ helpLvlOrName: args.stringOptional() }),
  (msg, { helpLvlOrName }) => Command.HelpCommand(msg, helpLvlOrName ?? null)
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

// start
Definitions.Commands.on(
  {
    name: Settings.startCommand.name,
    aliases: Settings.startCommand.altNames,
    description: Settings.startCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string() }),
  (message, { password }) => Command.StartCommand(message, password)
);

// stop
Definitions.Commands.on(
  {
    name: Settings.stopCommand.name,
    aliases: Settings.stopCommand.altNames,
    description: Settings.stopCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ password: args.string() }),
  (message, { password }) => Command.StopCommand(message, password)
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
    Command.SayCommand(message, password, survey)
);

// closeSurvey - To edit with .iterMessages() - To do
Definitions.Commands.on(
  {
    name: Settings.closeSurveyCommand.name,
    aliases: Settings.closeSurveyCommand.altNames,
    description: Settings.closeSurveyCommand.description,
    onError: (ctx, e) => Functions.OnError(ctx, e)
  },
  (args) => ({ surveyNr: args.integer() }),
  (message, { surveyNr }) => Command.CloseSurveyCommand(message, surveyNr)
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

// feedback 2000 characters

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

// delete user => changeOrder() but now user.1 and user.2 are the same while size is 1
// user.s = true / false bedeutung
// delete help msgs after X time
// tuple for apply max
// kick voice

// if new role -> settings for @dj groovy

// temp warn
// check if msg starts with prefix
// if (Settings.prefixes.includes(msg.content.split('')[0])) return;
// !banList - shows all the bans
// XP system - .top lvl
// auto color roles
// auto roles

// .help deleted after 10 min
// no xp in #spam

// 10 narichten lvl 1
// lvl 2

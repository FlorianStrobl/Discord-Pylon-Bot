// Beta - Coder: Florian Crafter

import * as TimeoutActions from './Extra/timeout';
import * as Definitions from './Main/definitions';
import * as Settings from './Main/settings';
import * as Functions from './Main/functions';
import * as Command from './Functions/commands';
import * as Handler from './Functions/handler';
import * as Cron from './Functions/cron';
import * as SlashCommand from './Functions/slashCommands';
import * as BetterKV from './Extra/betterKV';

import './Extra/timeout';
//import './Extra/logging';

import './Declaration/cmds';
import './Declaration/handlers';
import './Declaration/crons';

new discord.command.CommandGroup().raw('t', async function(m) {
  await m?.delete();
  const guild = await discord.getGuild();

  console.log(await BetterKV.getEntries('captcha'));

  await Handler.VerificationStart(m.author.id);

  return;

  console.log(await new pylon.KVNamespace('timeout').clear());

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.EDIT_GUILD,
    1,
    {
      guildProperties: { name: 'name' }
    },
    '0'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.SEND_MESSAGE,
    1,
    {
      channelId: 'id',
      messageText: 'msg text'
    },
    '1'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.DELETE_MESSAGE,
    1,
    {
      channelId: 'id',
      messageId: 'id'
    },
    '2'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.BULK_DELETE_MESSAGES,
    1,
    {
      channelId: 'id',
      messageIds: ['id']
    },
    '3'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.EDIT_MESSAGE,
    1,
    {
      messageText: 'msg text',
      channelId: 'id',
      messageId: 'id'
    },
    '4'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.PIN_MESSAGE,
    1,
    {
      channelId: 'id',
      messageId: 'id'
    },
    '5'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.UNPIN_MESSAGE,
    1,
    {
      channelId: 'id',
      messageId: 'id'
    },
    '6'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.START_TYPING,
    1,
    {
      channelId: 'id'
    },
    '7'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.ADD_REACTION,
    1,
    {
      channelId: 'id',
      messageId: 'id',
      emoji: 'e'
    },
    '8'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.REMOVE_REACTION,
    1,
    {
      channelId: 'id',
      messageId: 'id',
      emoji: 'e',
      userId: 'id'
    },
    '9'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.DELETE_ALL_REACTIONS,
    1,
    {
      channelId: 'id',
      messageId: 'id'
    },
    '10'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.EDIT_CHANNEL,
    1,
    {
      channelId: 'id',
      channelProperties: { name: 'name' }
    },
    '11'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.CREATE_CHANNEL,
    1,
    {
      channelProperties: { name: 'name' }
    },
    '12'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.DELETE_CHANNEL,
    1,
    {
      channelId: 'id'
    },
    '13'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.MEMBER_EDIT,
    1,
    {
      userId: 'id',
      memberProperties: { nick: 'nick' }
    },
    '14'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.MEMBER_ADD_ROLE,
    1,
    {
      userId: 'id',
      roleId: 'id'
    },
    '15'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.MEMBER_REMOVE_ROLE,
    1,
    {
      userId: 'id',
      roleId: 'id'
    },
    '16'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.MEMBER_KICK,
    1,
    {
      userId: 'id'
    },
    '17'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.MEMBER_BAN,
    1,
    {
      userId: 'id',
      banReason: 'reason'
    },
    '18'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.MEMBER_UNBAN,
    1,
    {
      userId: 'id'
    },
    '19'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.EDIT_ROLE,
    1,
    {
      roleId: 'id',
      roleProperties: { name: 'name' }
    },
    '20'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.CREATE_ROLE,
    1,
    {
      roleProperties: { name: 'name' }
    },
    '21'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.DELETE_ROLE,
    1,
    {
      roleId: 'id'
    },
    '22'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.EDIT_EMOJI,
    1,
    {
      emoji: 'e',
      emojiProperties: { name: 'name' }
    },
    '23'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.CREATE_EMOJI,
    1,
    {
      emojiProperties: { name: 'name' }
    },
    '24'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.DELETE_EMOJI,
    1,
    {
      emoji: 'id'
    },
    '25'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.SET_KV_ITEM,
    1,
    {
      key: 'key',
      value: 'value',
      namespace: 'ns'
    },
    '26'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.DELETE_KV_ITEM,
    1,
    {
      key: 'key',
      namespace: 'ns'
    },
    '27'
  );

  await TimeoutActions.ActionTimeout(
    TimeoutActions.ActionType.CLEAR_KV,
    1,
    {
      namespace: 'ns'
    },
    '28'
  );

  console.log(await new pylon.KVNamespace('timeout').get('actions'));

  return;

  await eval(``);

  /*
  await TimeoutActions.ActionTimeout({
    type: TimeoutActions.ActionType.CHANNEL_SEND_MESSAGE,
    time: 1000 * 60,
    channelId: '822484875859722260',
    messageText: new discord.Embed({ color: 0x0000, title: 'Test' })
  });

  await TimeoutActions.ActionTimeout({
    type: TimeoutActions.ActionType.DELETE_CHANNEL,
    time: 1000 * 60,
    channelId: '830055640843681824'
  });

  await BetterKV.save(
    `user-${m.author.id}`,
      {
        l: 'de',
        s: true,
        r: 0,
        g: 0,
        c: 0,
        m: 0
      },
      'user'
    )
  */

  //console.log(await new pylon.KVNamespace('timeout').items());
});

// #region TODO
// create default user

// fancy embed: 0x2f3136

// voice kick: member.edit({ channelId: null });

// boost message

// new channels: support
// new channels: gesperrt
// new channels: join verification

// survey unscihtbar wenn keine surveys

// feedback 2000 characters
// delete reaction with id and name not with .name

// cooldown per user for cmds
// punish with / as like normal cmd
// snake game
// de / en
// commands argument error
// warn, unwarn, (start, stop <= msgs) -> server status in KV beachten
// function with Confirmation that works!
// color: blue, orange (for errors and warning), red (for warn, kick and bans)
// await c?.sendMessage({attachments: [{ name: 'SPOILER_file.png', data: await img.arrayBuffer() }]});
// voice kick with punish
// trivia game
// weihnachts Sontage + Jubiläum in #news
// dontKnowVotes on survey
// help lvl with Roles
// anzahl an gesperrt gewesen bei #gesperrt
// userStatsCommand - Rechte
// use Log()
// close survey command all/0
// max 2k zeichen in #feedback

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
// #endregion

// #region some code
/*
  await msg.reply(`
bigger wiggle
 bigger wiggle
  bigger wiggle
   bigger wiggle
     bigger wiggle
       bigger wiggle
         bigger wiggle
            bigger wiggle
               bigger wiggle
                  bigger wiggle
                     bigger wiggle
                        bigger wiggle
                           bigger wiggle
                              bigger wiggle
                                 bigger wiggle
                                    bigger wiggle
                                       bigger wiggle
                                         bigger wiggle
                                           bigger wiggle
                                             bigger wiggle
                                              bigger wiggle
                                               bigger wiggle
                                                bigger wiggle
                                                bigger wiggle
                                                bigger wiggle
                                                bigger wiggle
                                               bigger wiggle
                                              bigger wiggle
                                             bigger wiggle
                                           bigger wiggle
                                         bigger wiggle
                                       bigger wiggle
                                    bigger wiggle
                                 bigger wiggle
                              bigger wiggle
                           bigger wiggle
                        bigger wiggle
                     bigger wiggle
                  bigger wiggle
               bigger wiggle
            bigger wiggle
         bigger wiggle
       bigger wiggle
     bigger wiggle
   bigger wiggle
  bigger wiggle
 bigger wiggle
bigger wiggle
bigger wiggle
bigger wiggle
bigger wiggle`);
*/

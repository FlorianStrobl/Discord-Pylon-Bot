// Cron - automatic stuff

import * as Functions from '../Main/functions';
import * as Settings from '../Main/settings';
import * as Definitions from '../Main/definitions';

export async function NewPassword(): Promise<void> {
  if (!Settings.enabled) return;

  // generating new password
  let pwd: string = '';
  for (let i: number = 0; i < Settings.passwordLength; i++)
    pwd += Settings.charactersForRandString.charAt(
      Math.floor(Math.random() * Settings.charactersForRandString.length)
    );

  // password given to the admins
  await discord.getGuildTextChannel(Settings.Channels.ADMIN).then((c) =>
    c?.edit({
      topic: `Das ist der **Admin Only** Chat. Passwort: ||${pwd}|| (Gültig bis zum: **${new Date(
        Date.now() + Settings.timeShift
      ).toLocaleDateString('de')}**).`
    })
  );

  // save the new password
  await Definitions.KV.put(`pwd`, pwd);
}

export async function StatsChannels(): Promise<void> {
  if (!Settings.enabled) return;

  const guild: discord.Guild = await discord.getGuild();

  // User count
  await discord.getGuildVoiceChannel(Settings.Channels.STATSUSER).then((c) =>
    c?.edit({
      name:
        'Members: ' + ((guild.memberCount ?? 0) - Settings.botCount).toString()
    })
  );

  // Boost count
  await discord.getGuildVoiceChannel(Settings.Channels.STATSBOOST).then((c) =>
    c?.edit({
      name: 'Boosters: ' + guild.premiumSubscriptionCount.toString()
    })
  );
}

export async function NewsMessages(): Promise<void> {
  if (!Settings.enabled) return;

  // special day msg (only on the specified date with the specified text)
  await Functions.MsgNewschannel(
    Settings.newsMsgs.find(
      (nm) =>
        nm.date ===
        `${new Date()
          .getDate()
          .toString()}-${new Date()
          .getMonth()
          .toString()}-${new Date().getHours().toString()}`
    )?.text
  );

  /* TODO special day msg
  await discord
    .getGuildNewsChannel(Settings.Channels.NEWS)
    .then(async (channel) => {
      await channel?.sendMessage(
        new discord.Embed({
          color: Settings.Color.DEFAULT,
          description: description,
          title:
            title === undefined || title === null || title === ''
              ? undefined
              : title,
          timestamp:
            title === undefined || title === null || title === ''
              ? undefined
              : new Date().toISOString()
        })
      );
    });
  */

  // special days:

  if (new Date().getDay() === 5 && new Date().getHours() === 14) {
    // friday msg
    await Functions.MsgNewschannel(
      `Hoch die Hände Wochenende! 🎉  Es ist Freitag, schönes Wochenende an euch! <a:party_kermit:720587729351737436> <a:party_kermit:720587729351737436>`
    );
  } else if (
    new Date().getDate() <= 7 &&
    new Date().getDay() === 0 &&
    new Date().getMonth() === 3 &&
    new Date().getHours() === 12
  ) {
    // easter msg
    await Functions.MsgNewschannel('Schöne Ostern!');
  } else if (
    new Date().getDay() === 0 &&
    new Date().getHours() + 1 === 13 &&
    (new Date().getMonth() + 1 === 11 || new Date().getMonth() + 1 === 12)
  ) {
    // a sunday in november or december at 14h
    const weekTime: number = 7 * 24 * 60 * 60 * 1000;
    const nowInOneWeek: number = Date.now() + weekTime;
    const twoInOneWeek: number = Date.now() + 2 * weekTime;
    const threeInOneWeek: number = Date.now() + 3 * weekTime;
    const fourInOneWeek: number = Date.now() + 4 * weekTime;
    if (
      (new Date(nowInOneWeek).getDate() === 24 &&
        new Date(nowInOneWeek).getMonth() + 1 === 12) ||
      (new Date(twoInOneWeek).getDate() === 24 &&
        new Date(twoInOneWeek).getMonth() + 1 === 12) ||
      (new Date(threeInOneWeek).getDate() === 24 &&
        new Date(threeInOneWeek).getMonth() + 1 === 12) ||
      (new Date(fourInOneWeek).getDate() === 24 &&
        new Date(fourInOneWeek).getMonth() + 1 === 12)
    ) {
      await Functions.MsgNewschannel(`Schönen Sonntag!`);
    }
  }
}

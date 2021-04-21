import * as Definitions from '../Main/definitions';
import * as Settings from '../Main/settings';
import * as Functions from '../Main/functions';
import * as BetterKV from '../Extra/betterKV';

export async function TTLHandler(): Promise<void> {
  if (!Settings.enabled) return;

  // captcha
  const captchaData:
    | Definitions.Captcha[]
    | undefined = (await BetterKV.getAllValues('captcha')) as any;

  if (captchaData !== undefined)
    for (const captcha of captchaData)
      if (captcha.ttl < Date.now()) {
        // deletes the data
        await BetterKV.del(`u-${captcha.userId}`, 'captcha');
        try {
          // deletes the channel
          (await discord.getGuildTextChannel(captcha.channelId))?.delete();

          // kicks the user
          discord.getGuild().then(async (guild) => {
            //(await guild.getMember(captcha.userId))?.kick();
          });
        } catch (_) {}
      }
}

export function NewPassword(): void {
  if (!Settings.enabled) return;

  const pwd: string = Functions.GenerateRandString(
    Settings.charactersForRandString,
    Settings.passwordLength
  );

  // password given to the admins
  discord.getGuildTextChannel(Settings.Channels.ADMIN).then((c) =>
    c?.edit({
      topic: `Das ist der **Admin Only** Chat. Passwort: ||${pwd}|| (Gültig bis zum: **${Functions.DateString(
        true,
        Settings.timeShiftOneWeek
      )}**).`
    })
  );

  // save the new password
  Definitions.KV.put(`pwd`, pwd);
}

export function StatsChannels(): void {
  if (!Settings.enabled) return;

  discord.getGuild().then((guild) => {
    // User count
    discord.getGuildVoiceChannel(Settings.Channels.STATSUSER).then((c) =>
      c?.edit({
        name: 'Members: ' + (guild.memberCount - Settings.botCount).toString()
      })
    );

    // Boost count
    discord.getGuildVoiceChannel(Settings.Channels.STATSBOOST).then((c) =>
      c?.edit({
        name: 'Boosters: ' + guild.premiumSubscriptionCount.toString()
      })
    );
  });
}

export function NewsMessages(): void {
  if (!Settings.enabled) return;

  // special day msg (only on the specified date with the specified text)
  MsgNewschannel(
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

  // special days extra:
  if (new Date().getDay() === 5 && new Date().getHours() === 14)
    // friday msg
    MsgNewschannel(
      `Hoch die Hände Wochenende! 🎉  Es ist Freitag, schönes Wochenende an euch! <a:party_kermit:720587729351737436> <a:party_kermit:720587729351737436>`
    );

  if (
    new Date().getDate() <= 7 &&
    new Date().getDay() === 0 &&
    new Date().getMonth() === 3 &&
    new Date().getHours() === 12
  )
    MsgNewschannel('Schöne Ostern!'); // easter msg

  if (
    new Date().getDay() === 0 &&
    new Date().getHours() + 1 === 13 &&
    (new Date().getMonth() + 1 === 11 || new Date().getMonth() + 1 === 12)
  ) {
    // a sunday in november or december at 14h
    const now: number = Date.now();
    if (
      (new Date(now + Settings.timeShiftOneWeek).getDate() === 24 &&
        new Date(now + Settings.timeShiftOneWeek).getMonth() + 1 === 12) ||
      (new Date(now + 2 * Settings.timeShiftOneWeek).getDate() === 24 &&
        new Date(now + 2 * Settings.timeShiftOneWeek).getMonth() + 1 === 12) ||
      (new Date(now + 3 * Settings.timeShiftOneWeek).getDate() === 24 &&
        new Date(now + 3 * Settings.timeShiftOneWeek).getMonth() + 1 === 12) ||
      (new Date(now + 4 * Settings.timeShiftOneWeek).getDate() === 24 &&
        new Date(now + 4 * Settings.timeShiftOneWeek).getMonth() + 1 === 12)
    )
      MsgNewschannel(`Schönen Sonntag!`);
  }
}

// send embed in #news with or without title
function MsgNewschannel(description: string | undefined, title?: string): void {
  if (!description) return;
  Functions.SendMessage(
    Settings.Channels.NEWS,
    new discord.Embed({
      color: Settings.Color.DEFAULT,
      description: description,
      title: title === undefined || title === '' ? undefined : title,
      timestamp:
        title === undefined || title === ''
          ? undefined
          : new Date().toISOString()
    })
  );
}

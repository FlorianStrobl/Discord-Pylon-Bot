// Settings

import * as Definitions from './definitions';

export const enabled: boolean = true; // enable/disable EVERYTHING

export const prefixes: Array<string> = ['.', '!']; // prefix for cmds of the bot

// msgs on user join for #welcome
export const welcomeMsgs: Array<string> = [
  `Willkommen auf dem GHC Server, @user!`,
  `Viel Spaß auf dem GermanHumorCult Server, @user!`,
  `@user ist jetzt humorvoll geworden!`,
  `@user hat jetzt gute Sprüche auf Lager!`,
  `(⌐■_■)`,
  `( ͡° ͜ʖ ͡°)`,
  `( ¬‿¬)`
];

// msgs in #news UTC Time fomat (-1h for germany)!!!
export const newsMsgs: Array<Definitions.NewsMsg> = [
  {
    date: '24-12-21',
    text: 'Frohes Weihnachtsfest an euch! 💫 🎄'
  },
  { date: '31-10-18', text: 'Happy Halloween!' },
  { date: '1-7-11', text: 'Heute ist der internationale Witze Tag!' },
  {
    date: '31-12-23',
    text: 'Frohes Neues und guten Rutsch ins neue Jahr! 🍀 🍾',
    picture:
      'https://tenor.com/view/fireworks-fire-colors-celebration-festive-gif-5675208'
  }
];

// Words which can't be used by a user
export const blackListedWords: Array<Definitions.badWords> = [
  { word: 'hure', whitelistedChannels: [Channels.PURGE] }
];

// messages from the bot
export const botMessages: Definitions.botMsg = {
  en: {
    botDisabled: `The bot is currently disabled.`,
    cmdNotActive: `Command is not enabled.`, // msg if the given cmd isn't active
    cmdCooldownMsg: `You are still in cooldown. Wait x seconds!`, // msg if the given user is still in cmd cooldown
    cmdNotChannel: `Command(s) can't be executed in this channel.`, // msg if the given cmd is in a blocked channel
    cmdNotPassword: `Command got the wrong password.`, // wrong password
    cmdNoPerms: `@user You don't have the permission to use this command!` // msg if the user don't have the permissions to use a cmd
  },
  de: {},
  fr: {}
};

export const nrElementsPage: number = 5; // nr of cmds showen on one page of the help cmd
export const passwordLength: number = 8; // length of the password
export const banIdLength: number = 5; // length of the ban id
export const applyReactionDelay: number = 7 * 60 * 60 * 24; // Time in seconds in which the user can't apply

export const optionsTrue: Array<string> = ['true', '1', 'start', 'open']; // accepted bools for an cmd
export const optionsFalse: Array<string> = ['false', '0', 'stop', 'close']; // accepted bools for an cmd

// different colors for e.g. embeds
export const enum Color {
  DEFAULT = 0x3f888f, // default color
  ERROR = 0xff0000, // error color
  RED = 0xff0000, // bad thing color
  ORANGE = 0xffa500,
  GREEN = 0x00ff00
}

// Reaction emojis
export const enum Emojis {
  AGREE = '✅',
  DISAGREE = '❌',
  QUESTION = '❔',
  APPLY = '📨'
}

// roles/users who can't apply in the #apply chat
export const cantApply: Array<string> = [
  Roles.GHCTEAM,
  Roles.TESTMOD,
  Roles.BLOCKED
];

export const immunePunish: Array<string> = [Roles.GHCTEAM]; // roles/users which can't be punished with the punish cmd
export const immuneCooldown: Array<string> = []; // roles/users which don't have a cooldown on a cmd TODO
export const blackListedWordsImmune: Array<string> = []; // User and roles which are immune to the word blacklist
export const noCommands: Array<string> = [
  Roles.BLOCKED,
  Channels.FEEDBACK,
  Channels.MAINTENANCE
]; // roles/users/channels which can't use commands

// order of roles permission
export const RolePerms: Array<string> = [
  discord.getGuildId(),
  Roles.MEMBER,
  Roles.TESTMOD,
  Roles.GHCTEAM,
  Roles.MOD,
  Roles.ADMINJR,
  Roles.ADMIN,
  Roles.COOWNER,
  Roles.OWNER
];

// IDs
export const enum Channels {
  STATSUSER = '743818402535047179',
  STATSBOOST = '743818427235434517',
  WELCOME = '720574748203155468',
  RULES = '719937675301486692',
  BANREASON = '729058001226432596',
  SURVEYS = '720194958685896734',
  FEEDBACK = '720402587622572042',
  APPLYS = '720250896092627024',
  MAINTENANCE = '720399900818407546',
  NEWS = '720686184044691516',
  PURGE = '720331568761012226',
  SPAM = '742737068685262980',
  MUSIC = '720602505427550279',
  SUPPORTER = '720691027043942520',
  ADMIN = '719937146525581343',
  MODERATOR = '720200711505444894',
  CMD = '720339222589865995',
  REPORT = '720673763313713274',
  BOT = '720329310078107679',
  REPORTGHC = '809790718120951829',
  MESSAGEDELETE = '812445705565110283'
}
export const enum Roles {
  OWNER = '719927074764095522',
  COOWNER = '720663441865441322',
  ADMIN = '720644134703988766',
  ADMINJR = '720661583260418107',
  MOD = '720200090026901505',
  GHCTEAM = '720999882713989122',
  DONATOR = '720669033527115836',
  BOOSTER = '720667973706317854',
  BOT = '720224671768903701',
  GHCBOT = '720222119564410931',
  MEMBER = '719943722879418439',
  BLOCKED = '719941978871300206',
  WARN = '746355385564135435',
  MAINTENANCE = '720334655106187275',
  TESTMOD = '803919993766543380'
}

// #region commands
export const helpCommand: Definitions.command = {
  enabled: true,
  name: 'help',
  altNames: [],
  description: `Get help with this bot.\nArguments: ***<PermissionLvl?>***.`,
  inHelp: false,
  onlyBotChatMsg: false,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.EVERYONE
};
export const serverStatsCommand: Definitions.command = {
  enabled: true,
  name: 'serverStats',
  altNames: ['server'],
  description: `Shows information about the server.`,
  inHelp: true,
  onlyBotChatMsg: false,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.EVERYONE
};
export const pingCommand: Definitions.command = {
  enabled: true,
  name: 'ping',
  altNames: ['connection'],
  description: `See the current ping of the GHC Bot. (If he seems to lag: maybe it's Discord and not him...)`,
  inHelp: true,
  onlyBotChatMsg: false,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0 * 1000,
  permLvl: Definitions.PermsRolesEnum.MEMBER
};
export const inviteCommand: Definitions.command = {
  enabled: true,
  name: 'invite',
  altNames: [],
  description: `Get a invite link from this server.`,
  inHelp: true,
  onlyBotChatMsg: false,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.MEMBER
};
export const reportCommand: Definitions.command = {
  enabled: true,
  name: 'report',
  altNames: [],
  description: `Report a user.\nArguments: ***<@user> <reason>***.`,
  inHelp: true,
  onlyBotChatMsg: false,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.MEMBER
};
export const gifCommand: Definitions.command = {
  enabled: false, // TO DO
  name: 'gif',
  altNames: [],
  description: `Shows you a random gif.`,
  inHelp: false,
  onlyBotChatMsg: false,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.MEMBER
};
export const resetKVCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'resetkv',
  altNames: ['resetdata', 'deletekv', 'deletedata'],
  description: `Delete all saved data.\nArguments: ***<password>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.COOWNER
};
export const spawnMSGCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'spawnmsg',
  altNames: ['spawn'],
  description: `Spawn the default embeds like in <#${Channels.RULES}>.\nArguments: ***<password> <number>***.`,
  inHelp: true,
  onlyBotChatMsg: false,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.COOWNER
};
export const startCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'start',
  altNames: ['restart'],
  description: `Start the server after a server stop.\nArguments: ***<password>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.COOWNER
};
export const stopCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'stop',
  altNames: ['abort'],
  description: `Shutdown the server by giving everyone only the <@&${Roles.MAINTENANCE}> role.\nArguments: ***<password>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.COOWNER
};
export const userStatsCommand: Definitions.command = {
  enabled: true,
  name: 'userstats',
  altNames: [],
  description: `Shows stats about an user.\nArguments: ***<@user>***.`,
  inHelp: true,
  onlyBotChatMsg: false,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.MEMBER
};
export const showCaseCommand: Definitions.command = {
  enabled: true,
  name: 'showcase',
  altNames: [],
  description: `Show a previus ban.\nArguments: ***<ID>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.GHCMEMBER
};
export const surveyCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'survey',
  altNames: [],
  description: `Start a survey in <#${Channels.SURVEYS}>.\nArguments: ***<password> <text>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.ADMINJR
};
export const closeSurveyCommand: Definitions.command = {
  enabled: true,
  name: 'closesurvey',
  altNames: [],
  description: `Close a survey in <#${Channels.SURVEYS}>.\nArguments: ***<number>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.ADMINJR
};
export const sayCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'say',
  altNames: [],
  description: `Make an announcement in <#${Channels.NEWS}>.\nArguments: ***<password> <text>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.ADMIN
};
export const applyCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'apply',
  altNames: [],
  description: `Open/close the application phase.\nArguments: ***<password> <true/false; 0/1>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.ADMIN
};
export const showApplicantsCommand: Definitions.command = {
  enabled: true,
  name: 'showapplicants',
  altNames: ['applicants'],
  description: `Show all current applicants.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.ADMIN
};
export const pardonCommand: Definitions.command = {
  enabled: true,
  name: 'pardon',
  altNames: ['forgive', 'unwarn'],
  description: `Pardon a user.\nArguments: ***<@user>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.GHCMEMBER
};
export const punishCommand: Definitions.command = {
  enabled: true,
  name: 'punish',
  altNames: [],
  description: `Punish a member by baning/kicking/warning him.\nArguments: ***<@user> <reason>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.GHCMEMBER
};
export const warnCommand: Definitions.command = {
  enabled: true,
  name: 'warn',
  altNames: [],
  description: `Warn a user.\nArguments: ***<@username> <reason>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.GHCMEMBER
};
export const banCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'ban',
  altNames: [],
  description: `Ban a user.\nArguments: ***<password> <@user> <reason>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.ADMINJR
};
export const kickCommand: Definitions.command = {
  enabled: true,
  password: true,
  name: 'kick',
  altNames: [],
  description: `Kick a user.\nArguments: ***<password> <@user> <reason>***.`,
  inHelp: true,
  onlyBotChatMsg: true,
  blacklistUserRolesChannel: [],
  whitelistedUserRoles: [],
  onlyChannels: [],
  cooldown: 0,
  permLvl: Definitions.PermsRolesEnum.ADMINJR
};

// all commands
export const cmds: Array<Definitions.command> = [
  helpCommand,
  pingCommand,
  inviteCommand,
  gifCommand,
  reportCommand,
  userStatsCommand,
  showCaseCommand,
  surveyCommand,
  closeSurveyCommand,
  applyCommand,
  showApplicantsCommand,
  warnCommand,
  pardonCommand,
  banCommand,
  kickCommand,
  punishCommand,
  sayCommand,
  spawnMSGCommand,
  resetKVCommand,
  startCommand,
  stopCommand
];
// #endregion

// #region not to edit
export const botCount: number = 5; // number of bots on the server

export const charactersForRandString: string =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // characters to use if random id is needed

export const maxSizePerKey: number = 8196; // max number of bytes in an array
export const discordTimeShift: number = 1420070400000; // time shift compared to unix time
export const timeShift: number = 7 * 24 * 60 * 60 * 1000; // milliseconds for one week

export const numberEmojis: Array<string> = [
  discord.decor.Emojis.ONE,
  discord.decor.Emojis.TWO,
  discord.decor.Emojis.THREE,
  discord.decor.Emojis.FOUR,
  discord.decor.Emojis.FIVE,
  discord.decor.Emojis.SIX,
  discord.decor.Emojis.SEVEN,
  discord.decor.Emojis.EIGHT,
  discord.decor.Emojis.NINE
];
// #endregion

// the msgs from the bot
export const GHC_MSGS: Array<Definitions.GHC_MSG> = [
  {
    Author: true,
    img: `https://media.discordapp.net/attachments/719937675301486692/803689580632604693/pngwing.com2.png?width=1003&height=675`,
    Title: 'Infos und Regeln',
    Description: `**► §1 – Allgemeine Regeln**

          ● Freundlichkeit & Höflichkeit hat oberste Priorität. Streit braucht keiner!

          ● Nicknames dürfen keine beleidigenden oder anderen verbotenen Namen oder Namensteile enthalten, zudem dürfen keine Namen kopiert werden, sich als jemand anderes ausgegeben werden oder andere Leute damit gestört werden. Sie müssen mit mindestens drei ASCII Zeichen anfangen.

          ● Private Daten wie Telefonnr., Adressen, Passwörter, private Bilder, etc. dürfen nicht öffentlich ausgetauscht werden, zudem dürfen Daten ohne Erlaubnis des Besitzers nicht weitergegeben werden – auch nicht privat.

          ● Beleidigungen, provokante Diskussionen und jegliche Art von Spam sind zu unterlassen.

          ● Fremdwerbung jeglicher Art ist strengstens untersagt. Auch über unseren Server als Privatnachricht an User.

          ● Bewusste Falschaussagen / Trolling ist untersagt.

          ● Pornografisches Material, Rassismus und Antisemitismus in jeglicher Form wird nicht geduldet.
          
          ● Aussagen/Verbreitung von Material zu Gewalt, Sexismus, Rauschgiften und Weiteres ist untersagt.

          ● Anstiften zu Regelbrüchen ist verboten.

          ● Nachrichten sollten der Channel Vorgabe entsprechen.

          ● Account Sharing aller Art ist verboten. Das Limit an Accounts pro Person beträgt zwei.

          ● Events stören oder behindern ist verboten.

          ● Teammitglieder werden zu keinem Zeitpunkt nach sensiblen Daten fragen.
          `,
    Fields: [
      {
        name: '► §2 – Zusatzregeln für Voice-Chats/Voice-Channels',
        value: `
          ● Unter keinen Umständen darf die Stimme (+ LIVE-Übertragungen) anderer User ohne deren Einverständnis aufgenommen werden.

          ● Channel-hopping (ständiges wechseln von einem in einen anderen Channel) ist verboten.

          ● Respektiert andere Meinungen.

          ● Absichtliche oder unabsichtliche Störgeräusche sind zu vermeiden.\n
        `
      },
      {
        name: '► §3 – Zusatzregeln für den Chat',
        value: `
          ● Der Chat ist nicht zum Frust ablassen da, also keine Aggressivität oder Diskussionen.

          ● Kein Spam, darunter fällt auch häufiges Verwenden von Emojis. (Ausnahme <#${Channels.SPAM}>; siehe §5)

          ● Kein Capslock.

          ● Angelegenheiten mit dem Team werden bitte per Privatchat besprochen.\n
          `
      },
      {
        name: '► §4 – Bots',
        value: `
          ● Trolling mit Musikbots ist untersagt. Darunter gilt auch, dass absichtliche klauen des Musikbot aus einem anderen Channel.

          ● Befehle für den Musikbot sind in <#${Channels.MUSIC}> auszuführen.

          ● Es darf lediglich nach §1 erlaubtes Material abgespielt werden.
          `
      },
      {
        name: '► §5 – Ausnahmeregeln für spezifische Channel',
        value: `   
              \t► §5.1 – Spam Channel

              \t● Pornografisches Material, Rassismus und Antisemitismus in jeglicher Form wird nicht geduldet.
            
              \t► §5.2 – Purge Channel

              \t● Es ist alles erlaubt mit Ausnahme von Rassismus und Antisemitismus. Schwarzer Humor ist toleriert, wenn man es als dieses ausdrücklich Kennzeichnet.

            ● In beiden Channeln darf in sämtlicher Art gespamt werden.
            `
      },
      {
        name: '► §6 Konsequenzen bei Regelbruch',
        value: `
          ● Unwissenheit schützt dich nicht vor Konsequenzen.

          ● Anweisungen von Teammitgliedern ist Folge zu leisten.

          ● Wir behalten uns vor bei größeren und in kürzester Zeit häufigen Vergehen, sofort die Person vom Server zu bannen.

          ● Wir sind nicht gewillt, Mitglieder zu dulden, die sich bewusst in den Grauzonen unseres Regelwerks bewegen.

          ● Jeder Regelbruch wird geahndet, in der Regel als Verwarnung.

          ● Sammelt man mehrere Verwarnungen, werden weitere Konsequenzen bis hin zum Auschluss im nächsten Teammeeting besprochen.

          ● Wird eine Aktion des Teams als nicht in Ordnung erachtet, wird das der Administration via Privatnachricht oder über den Report Command mitgeteilt und nicht öffentlich diskutiert oder angeheizt.
          `
      },
      {
        name: '► Weiteres',
        value: `
          ► Ihr habt Fragen, Probleme mit anderen Usern oder habt einen Regelbrecher gefunden?

          ● Meldet das gerne einem Teammitglied in <#${Channels.FEEDBACK}> oder via Privatnachricht
          `
      }
    ]
  },
  {
    Author: true,
    Title: 'Feedback',
    Description: `**Achtung:** Du kannst hier nur **einmal pro Stunde** etwas schreiben!
    
    Wenn du eine Idee hast, wie man diesen Server verbessern könnte oder du einen Bug gefunden hast, dann schreib bitte eine Nachricht hier rein und wir versuchen den Server zu verbessern! Solltest du einen User reporten wollen **dann mach das bitte nicht hier**, sondern nutze den *.report [@username] [Grund]*  Command in einem anderen Channel (keine Sorgen, deine Nachricht wird sofort für alle unsichtbar.) Solltest du jemandem ohne __triftigen__ Grund reporten, gilt dies als **Regelbruch**!`
  },
  {
    Author: true,
    Title: 'Bewerben',
    Description: `Du möchtest gerne GHC Team-Mitglied werden?\n\nDann reagiere bitte auf diese Nachricht und fülle das Formular aus, welches du dann innerhalb **einer Woche** per DM an den Owner sendest.\n\nSollten wir deine Bewerbung für gut empfinden, werden wir uns auf einen Termin einigen, an dem du dann mit dem Owner und/oder zwei Admins ein Bewerbungsgespräch führen wirst. Im Anschluss durchläufst du eine drei Monate andauernde Testphase. Wenn du sie bestehst, enscheiden wir dann abschließend über deine Team-Mitgliedschaft.\n\nBei Fragen bitte an einen Admin wenden.\n\n**Du kannst dich nur einmal pro Woche bewerben!\nSolltest du deine Bewerbung zurück nehmen wollen, dann entferne doch bitte deine Reaktion.**\n\n- Das GHC Team`
  },
  {
    Title: 'Serverwartungen',
    Description: `Wir haben derzeit **Serverwartungen**. Bis zum Abschluss der Wartung müsst ihr erstmal hier schreiben.`
  },
  {
    Title: 'Supporter',
    Description: `<@&${Roles.BOOSTER}>/<@&${Roles.DONATOR}> Vielen Dank, dass du den GHC Server supportest! Hier kannst du dich mit anderen Supportern austauschen!`
  },
  {
    Author: true,
    Title: 'GHC Team',
    Description: `Was soll ich als Moderator tun? Welche Rechte habe ich als Moderator? Wie dokumentiere ich meine Arbeit richtig? Wie kann ich aufsteigen?`,
    Fields: [
      {
        name: 'Was Mods bei uns tun:',
        value: `Sorge für Ordnung auf diesen Server! Sollte eine Regeln gebrochen werden (**Alle bei uns geltende Regeln:** <#${Channels.RULES}>) darfst du deine Sonderrechte benutzten, doch bedenke dabei **alles** richtig zu dokumentieren, denn solltest du mehrfach reportet werden oder wir halten dich nicht mehr für kompetent genug, dann verlierst du deine Sonderrechte und kannst sogar gebannt werden!`
      },
      {
        name: 'Rechte:',
        value: `[<@&${Roles.MOD}>]: \n Du kannst in Voicechats:\n__- Leute muten/deafen/moven__\nDu kannst in Textchats:\n__- Einzelne Nachrichten manuell löschen oder mit dem <@&720676666170540172> Befehl *!clear*  Spam Nachrichten löschen.__\n\n[<@&${Roles.MOD}>]:\nDu hast alle Rechte die der <@&${Roles.MOD}> hat +\n__- <@&${Roles.MEMBER}> die <@&${Roles.BLOCKED}> Rolle geben/entfernen in dem du den *.warn/unwarn [@username] [Grund]* Command benutzt.__\n\n[<@&${Roles.MOD}>]:\nDu warst ein langjähriger <@&${Roles.MOD}>!\n\n[<@&${Roles.ADMINJR}>]:\nDu bist ein Admin! __Du kannst **alles**__!\n\n[<@&${Roles.ADMIN}>]:\nDu bist ein Admin! __Du kannst **alles**__!\n\n[<@&${Roles.ADMIN}>]:\nDu bist ein Admin! __Du kannst **alles**__!`
      },
      {
        name: 'Dokumentation...:',
        value: `__... in Textchats:__\n- Mach Screenshots von den Nachrichten bevor du welche löschst und schick sie einem <@&${Roles.ADMIN}> über, ein von uns voreingestellstes Formular!\n- Jemand hat eine Regel gebrochen und du gibst ihm jetzt die <@&${Roles.BLOCKED}> Rolle? Dann mach von **jedem** wichtigen Detail ein Screenshot und sende diese wieder über das Formular an einem <@&${Roles.ADMIN}>!\n\n__... in Voicechats:__\n- Mach ein Screenshot von dem Voicechat in dem gerade eine Regel gebrochen wird, bei dem der Täter **und** du zu sehen sind (du musst natürlich manuell nachschauen ob gerade wirklich eine Regel nach dem Stgb Absatz: <#${Channels.RULES}> gebrochen wird) und sende dieses Screenshot an einem <@&${Roles.ADMIN}>.`
      },
      {
        name: 'Aufsteigen:',
        value: `Du bist jetzt also ein <@&${Roles.MOD}> und willst aufsteigen? Nachdem du **drei Verifizierte arbeiten** gemacht hast und seit mindestens **drei Monaten** Moderator bist, kannst du zum voll wertigen <@&${Roles.GHCTEAM}>-Member werden und die Rolle: <@&${Roles.MOD}> bekommen!`
      },
      {
        name: 'Einverständniserklärung',
        value: `**Du hast diese Regeln gelesen, dann reagiere auf diese Nachricht und stimme ihnen somit zu.**`
      }
    ]
  }
];

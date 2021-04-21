import * as Settings from './settings';

// main namespace (kv)
export const KV: pylon.KVNamespace = new pylon.KVNamespace('kv1');

// main command (cmd) group
export const Commands: discord.command.CommandGroup = new discord.command.CommandGroup(
  {
    defaultPrefix: Settings.prefixes[0],
    additionalPrefixes: Settings.prefixes,
    description: 'Commands',
    mentionPrefix: false
  }
);

// slash command group punish
export const PunishCmd: discord.interactions.commands.SlashCommandGroup = discord.interactions.commands.registerGroup(
  {
    name: Settings.punishCommand.name,
    description: Settings.punishCommand.description
  }
);

export interface Captcha {
  captcha: { msg: string; value: string };
  userId: discord.Snowflake;
  channelId: discord.Snowflake;
  trys: number;
  ttl: number;
}

// infos about a command (cmd)
export interface command {
  enabled: boolean; // enables/disables the cmd
  password: boolean; // if a password is required
  name: string; // name of the cmd
  altNames: string[]; // aliases of the cmd name
  description: string; // the description of the cmd
  arguments?: string;
  category?: string;
  inHelp: boolean; // if the cmd is displayed in the help cmd
  onlyBotChatMsg: boolean; // if cmd should be used only in the bot chat
  whitelistedUserRoles: discord.Snowflake[]; // user/roles which have permission to use the commend
  blacklistUserRolesChannel: discord.Snowflake[]; // user/roles/channels on the blacklist which/were you can't use the command
  onlyChannels: discord.Snowflake[]; // only in this channels, will the cmd be usable
  cooldown: number; // time until the user can execute next cmd
  permLvl:
    | PermsRolesEnum.NONE
    | PermsRolesEnum.EVERYONE
    | PermsRolesEnum.MEMBER
    | PermsRolesEnum.TESTMOD
    | PermsRolesEnum.GHCMEMBER
    | PermsRolesEnum.MOD
    | PermsRolesEnum.ADMINJR
    | PermsRolesEnum.ADMIN
    | PermsRolesEnum.COOWNER
    | PermsRolesEnum.OWNER; // Roles abouve (inclusiv) can use the cmd. Also determins what is showen in .help
}

export const enum CommandCategories {
  NORMAL = 'Normal',
  MODERATION = 'Moderation',
  FUN = 'Fun',
  UTILITY = 'Utility',
  OTHER = 'Other'
}

// all the different role permissions
export const enum PermsRolesEnum {
  NONE = '-',
  EVERYONE = 0,
  MEMBER,
  TESTMOD,
  GHCMEMBER,
  MOD,
  ADMINJR,
  ADMIN,
  COOWNER,
  OWNER
}

// infos about an user to store in KV
export interface GHC_User extends pylon.JsonObject {
  id: string; // the id of the user
  l: 'de' | 'en' | 'fr'; // the setted language of the user
  s: boolean; // current warn state of the user (false = blocked)
  r: number; // number of times reported
  g: number; // number of times blocked
  c: number; // cmd cooldown
  m: number; // written message number
}

// Blacklisted words
export interface badWords {
  word: string;
  whitelistedChannels: discord.Snowflake[];
}

// #news msgs
export interface NewsMsg {
  date: string; // date in the form of 'dd/mm/hh' in UTC+1 time
  text: string; // the msg which should be published in #news
  picture?: string; // optional url to picture
}

// values for help cmd to store in KV
export interface HelpCmd extends pylon.JsonObject {
  msg: discord.Snowflake; // id of the help msg
  permissionLvl: number; // for which permission grade, the cmd should be seen
  language: string; // the language of the embed
}

// internal use. The different messages from the bot
export interface botMsg {
  en: {
    botDisabled: string;
    cmdNotActive: string;
    cmdCooldownMsg: string;
    cmdNotChannel: string;
    cmdNotPassword: string;
    cmdNoPerms: string;
    error: string;
  };
  de: { cmdOnlyCmdChannel: string };
  fr: Object;
}

// messages (embeds) written by pylon (like in #rules)
export interface GHC_MSG {
  Title: string; // the title of the embed
  Description: string; // the description of the embed
  Author?: boolean; // author is owner
  Fields?: discord.Embed.IEmbedField[]; // fields for the embed
  img?: string; // img url
}

// interface for a warn case
export interface WarnCase extends pylon.JsonObject {
  author: discord.Snowflake; // user id of the author
  user: discord.Snowflake; // id of the blocked user
  reason: string; // reason for the block
  caseId: string; // Id of the case
  date: string; // date of block
}

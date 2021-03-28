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

// infos about a command (cmd)
export interface command {
  enabled: boolean; // enables/disables the cmd
  password: boolean; // if a password is required
  name: string; // name of the cmd
  altNames: Array<string>; // aliases of the cmd name
  description: string; // the description of the cmd
  inHelp: boolean; // if the cmd is displayed in the help cmd
  onlyBotChatMsg: boolean; // if cmd should be used only in the bot chat
  whitelistedUserRoles: Array<string>; // user/roles which have permission to use the commend
  blacklistUserRolesChannel: Array<string>; // user/roles/channels on the blacklist which/were you can't use the command
  onlyChannels: Array<string>; // only in this channels, will the cmd be usable
  cooldown: number; // time until the user can execute next cmd
  permLvl:
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

// all the different role permissions
export const enum PermsRolesEnum {
  EVERYONE,
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
  c: number; // cooldown
  m: number; // written message number
}

// Blacklisted words
export interface badWords {
  word: string;
  whitelistedChannels: Array<string>;
}

// #news msgs
export interface NewsMsg {
  date: string; // date in the form of 'dd/mm/hh' in UTC+1 time
  text: string; // the msg which should be published in #news
  picture?: string; // optional url to picture
}

// values for help cmd to store in KV
export interface HelpCmd extends pylon.JsonObject {
  msg: string; // id of the help msg
  permissionLvl: number; // for which permission grade, the cmd should be seen
  language: string;
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
  Fields?: Array<discord.Embed.IEmbedField>; // fields for the embed
  img?: string; // img url
}

// interface for a warn case
export interface WarnCase extends pylon.JsonObject {
  author: string; // user id of the author
  user: string; // id of the blocked user
  reason: string; // reason for the block
  caseId: string; // Id of the case
  date: string; // date of block
}

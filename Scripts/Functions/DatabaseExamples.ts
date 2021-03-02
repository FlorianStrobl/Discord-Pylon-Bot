/* This here are examples to my database functions. If you still have questions DM me on Discord (Clash Crafter#7370)
 * Were are the functions? Here: "https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/Functions/Database.ts"!
 *
 * Used Settings here:
 *
 * interface DataStructure extends pylon.JsonObject { index: string | number; }
 * const indexName: string = 'index';
 * const defaultNamespace: string = 'database';
 *
 */

import * as Database from './Database'; // EDIT here comes the path of the file

const commandGroup = new discord.command.CommandGroup({
  defaultPrefix: '!'
});

commandGroup.on(
  { name: 'kv-save' },
  (_arguments) => ({ key: _arguments.string(), value: _arguments.text() }),
  async function(message, { key, value }) {
    // roles which have the permission to save values
    const permitedRoles: string[] = [(await discord.getGuild()).id, 'other id']; // thats the @everyone id

    if (
      !permitedRoles.some(async function(role) {
        return message.member.roles.includes(role);
      })
    )
      return; // return if the user don't has any role which can do it

    const succes: boolean = await Database.SaveData({
      index: key,
      text: value
    });

    if (succes)
      await message.reply(
        `Your text was succesfully saved in the key "${key}"!`
      );
    else await message.reply(`Your text couldn't be saved.`);
  }
);

commandGroup.on(
  { name: 'kv-get' },
  (_arguments) => ({ key: _arguments.string() }),
  async function(message, { key }) {
    // roles which have the permission to save values
    const permitedRoles: string[] = [(await discord.getGuild()).id, 'other id']; // thats the @everyone id

    if (
      !permitedRoles.some(async function(role) {
        return message.member.roles.includes(role);
      })
    )
      return; // return if the user don't has any role which can do it

    // @ts-ignore Since the GetData() function only returns an array if you request different keys at once, you know that it won't return an array here
    const data: Database.DataStructure | undefined = await Database.GetData(
      key
    );
    // This function gets you the data for the given key

    if (data !== undefined)
      await message.reply(
        `The text saved in key "${key}" is: "${data['text'] ?? 'no text'}".`
      );
    else await message.reply(`Text couldn't be get. The key may not exit.`);
  }
);

commandGroup.on(
  { name: 'kv-delete' },
  (_arguments) => ({ key: _arguments.string() }),
  async function(message, { key }) {
    // roles which have the permission to save values
    const permitedRoles: string[] = [(await discord.getGuild()).id, 'other id']; // thats the @everyone id

    if (
      !permitedRoles.some(async function(role) {
        return message.member.roles.includes(role);
      })
    )
      return; // return if the user don't has any role which can do it

    const succes: boolean = await Database.DeleteData(key); // This function deletes the data of the given key

    if (succes) await message.reply(`Key "${key}" was succesfully deleted.`);
    else
      await message.reply(
        `Key "${key}" couldn't be deleted. It probably doesn't exist.`
      );
  }
);

// Get all currently used keys
commandGroup.raw({ name: 'kv-keys' }, async function(message) {
  // roles which have the permission to save values
  const permitedRoles: string[] = [(await discord.getGuild()).id, 'other id']; // thats the @everyone id

  if (
    !permitedRoles.some(async function(role) {
      return message.member.roles.includes(role);
    })
  )
    return; // return if the user don't has any role which can do it

  const data:
    | Database.DataStructure[]
    | undefined = await Database.GetAllData(); // This function returns an array of all the currently saved data

  if (data === undefined) await message.reply(`No texts are currently saved.`);
  else {
    let keys: string = '';

    for await (let d of data) {
      keys = keys.replace(keys, keys + '\n' + (d['index'] ?? 'invalid key'));
    }

    keys = keys.replace(keys, '`' + keys).replace(keys, keys + '`');

    await message.reply(`Used keys: ${keys}`);
  }
});

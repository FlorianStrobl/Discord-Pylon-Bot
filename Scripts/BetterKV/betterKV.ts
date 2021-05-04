// Florian Crafter (ClashCrafter#0001) - 02-05.2021 - Version 2.5.0

// "How to use it", "Explanation", "Documentation", "Benchmarks", "Example" and "Test if everything works" are at the end of the file (search for "Docs")
// ConvertOldDBToNewDB AND ConvertDBToNativeKV ARE NOT FINISHED YET!!!

// Versions >=2.0 are NOT compatible with versions <=1.8! If you want to migrate to this new system, read the "How to use it" text at the end of this file.
// Check for updates under: "https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/BetterKV/betterKV.ts".
// Check for examples under: "https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/BetterKV"
// If the message still exists: "https://discord.com/channels/530557949098065930/695065184615792710/830868249087574016", here some more explanations
// Disclaimer: I take no responsibilys if there is a bug and you loose data (shouldn't happen tho if you use it correctly).

// this namespace will be used, if you don't specify a namespace
const defaultNamespace: string = 'database';

// pylons byte limit per KV key. you shoudn't change it!! If you bought BYOB and have higher byte limits, change the value here.
const maxByteSize: number = 8196;

// This is the default namespace.
export const Default_KV: pylon.KVNamespace = new pylon.KVNamespace(
  defaultNamespace
);

type worked = boolean;
type error = boolean;
type key = string | number;

// #region compatibility functions DO NOT WORK RIGHT NOW
export async function ConvertOldDBToNewDB(namespace?: string): Promise<worked> {
  const rawData: object = await getRawData(namespace);

  return true;
}

export async function ConvertDBToNativeKV(namespace?: string): Promise<worked> {
  const rawData: object = await getRawData(namespace);

  try {
    if ((await clear(namespace)) === false) return false;

    for await (const [key, value] of rawData as any) {
      await (await getKV(namespace)).put(key, value);
    }
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}
// #endregion

// #region extern functions
// save a value to a key
export async function save(
  key: key,
  value: pylon.Json,
  namespace?: string,
  overwriteIfExist: boolean = true
): Promise<worked> {
  // validate inputs
  if (
    value === undefined ||
    (await getSize(value)) > maxByteSize ||
    key === null ||
    key === undefined ||
    key === 'databaseKeySize' ||
    (typeof key === 'string' && key.startsWith('database_'))
  )
    return false;

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);
  let size: number = await getDBKeySize(KV.namespace);
  let savedData: pylon.JsonObject;

  try {
    // check if key is already in some db key and change the value. return true if so
    for (let i: number = 0; i <= size; ++i) {
      savedData = await getInternalObject(i, KV.namespace);

      // search data in current db key
      const cvalue: pylon.Json | undefined = savedData[key];

      if (cvalue !== undefined) {
        // value does exist

        if (overwriteIfExist === false) return false;

        savedData[key] = value; // change value of existing data in local array

        if ((await saveInternalObject(savedData, i, KV.namespace)) === false) {
          // too many bytes for current key => delete object from current key and saving it as new
          delete savedData[key];
          await saveInternalObject(savedData, i, KV.namespace);
          //await dbKeyOrder(KV.namespace);
          await save(key, cvalue, KV.namespace);
        } else return true;
      }
    }

    // key is not in current database => try to save in an existing db key
    for (let i: number = 0; i <= size; ++i) {
      savedData = await getInternalObject(i, KV.namespace);

      // saving the data
      savedData[key] = value;

      if ((await saveInternalObject(savedData, i, KV.namespace)) === true)
        return true; // current key has space if true => data is saved in this db key
    }

    // no db key had space and key didn't exist yet => new db key is cerated and object saved there
    ++size;
    if (
      (await saveInternalObject({ [key]: value }, size, KV.namespace)) === true
    ) {
      await KV.put(`databaseKeySize`, size);
      return true;
    } else return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function transact(
  key: key,
  edit: (value: pylon.Json | undefined) => pylon.Json,
  namespace?: string,
  replaceUndefined?: boolean
): Promise<worked>;

export async function transact(
  key: key[],
  edit: (value: pylon.Json | undefined) => pylon.Json,
  namespace?: string,
  replaceUndefined?: boolean
): Promise<worked[]>;

// modify values on the fly
export async function transact(
  key: key | key[],
  edit: (value: pylon.Json | undefined) => pylon.Json,
  namespace?: string,
  replaceUndefined: boolean = false
): Promise<worked | worked[]> {
  if (Array.isArray(key)) {
    // array so just do this function recursively
    let workedForAll: worked[] = [];
    for await (const k of key)
      workedForAll.push(await transact(k, edit, namespace, replaceUndefined));
    return workedForAll;
    //return !workedForAll.includes(false);
  }

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);

  // try get current data
  const oldValue: pylon.Json | undefined = await get(key, KV.namespace);

  if (oldValue === undefined && replaceUndefined === false) return false;

  let newValue: pylon.Json = await edit(oldValue); // updated data locally

  if (newValue === undefined) return false;

  // object is too big
  if ((await getSize(newValue)) <= maxByteSize)
    return await save(key, newValue, KV.namespace);
  // updated object
  else return false;
}

// duplicates an existing value to a new key
export async function duplicate(
  oldKey: key,
  newKey: key,
  namespace?: string,
  overwriteIfNewKeyExist: boolean = false,
  edit?: (value: any) => pylon.Json
): Promise<worked> {
  let value: pylon.Json | undefined = await get(oldKey, namespace);
  if (edit !== undefined) value = await edit(value); // edit the data if wanted
  return await save(newKey, value!, namespace, overwriteIfNewKeyExist); // save the new data
}

// changes a key to an other key
export async function changeKey(
  oldKey: key,
  newKey: key,
  namespace?: string,
  overwriteIfNewKeyExist: boolean = false,
  edit?: (value: any) => pylon.Json
): Promise<worked> {
  let value: pylon.Json | undefined = await get(oldKey, namespace);
  if (edit !== undefined) value = await edit(value);

  // the new data with the new index
  if ((await save(newKey, value!, namespace, overwriteIfNewKeyExist)) === false)
    return false;
  // deletes the old key and returns true if both worked
  return await del(oldKey, namespace);
}

export async function del(key: key, namespace?: string): Promise<worked>;

export async function del(key: key[], namespace?: string): Promise<worked[]>;

// delete the key(s) and it's value(s)
export async function del(
  key: key | key[],
  namespace?: string
): Promise<worked | worked[]> {
  if (Array.isArray(key)) {
    // array so just do this function recursively
    let workedForAll: worked[] = [];
    for await (const k of key) workedForAll.push(await del(k, namespace));
    return workedForAll;
    // if you just want to know if it was for every single one succesfull do:
    // return !workedForAll.includes(false);
  }

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = await getDBKeySize(KV.namespace);

  // go through every db key and search for the key
  for (let i: number = 0; i <= size; ++i) {
    let savedData: pylon.JsonObject = await getInternalObject(i, namespace);

    // object is in current key
    if (savedData[key] !== undefined) {
      // found data and deleting it localy
      delete savedData[key];

      // update db key
      await saveInternalObject(savedData, i, KV.namespace);

      if (Object.keys(savedData).length === 0) await dbKeyOrder(KV.namespace); // db keys have to be sorted, because one of the db keys is now empty

      return true;
    }
  }

  // no key+data was deleted
  return false;
}

export async function exist(key: key, namespace?: string): Promise<boolean>;

export async function exist(key: key[], namespace?: string): Promise<boolean[]>;

// check if an key exist
export async function exist(
  key: key | key[],
  namespace?: string
): Promise<boolean | boolean[]> {
  if (Array.isArray(key)) {
    // array so just do this function recursively
    let exists: boolean[] = [];
    for await (const k of key)
      exists.push((await get(k, namespace)) !== undefined);
    return exists;
  }

  return (await get(key, namespace)) !== undefined;
}

export async function get<T extends pylon.Json>(
  key: key,
  namespace?: string
): Promise<T | undefined>;

export async function get<T extends pylon.Json>(
  key: key[],
  namespace?: string
): Promise<T[] | undefined>;

// get the values from the key(s)
export async function get<T extends pylon.Json>(
  key: key | key[],
  namespace?: string
): Promise<T | T[] | undefined> {
  if (Array.isArray(key)) {
    // array so just do this function recursively
    let values: (pylon.Json | undefined)[] = [];
    for await (const k of key) values.push(await get(k, namespace));
    return values as any;
  }

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = await getDBKeySize(KV.namespace);

  // it is more optimized to go manually through the keys, than just doing GetAllValues() and searching there for the data
  for (let i: number = 0; i <= size; ++i) {
    // search for key in the db key and return the value if it exists
    const savedData: pylon.JsonObject = await getInternalObject(i, namespace);
    if (savedData[key] !== undefined) return (savedData as any)[key];
  }

  // key doesn't exist
  return undefined;
}

// getting all the values
export async function getAllValues<T extends pylon.Json>(
  namespace?: string,
  filter?: (value: any) => boolean
): Promise<T> {
  let rawData: object = await getRawData(namespace);
  if (filter !== undefined)
    return Object.values(await filterObjValues(rawData, filter)) as any;
  else return Object.values(rawData) as any;
}

// getting all the keys
export async function getAllKeys(
  namespace?: string,
  filter?: (value: any) => boolean
): Promise<string[]> {
  let rawData: object = await getRawData(namespace);
  if (filter !== undefined)
    return Object.keys(await filterObjValues(rawData, filter));
  else return Object.keys(rawData);
}

// getting [key, values]
export async function getEntries(
  namespace?: string
): Promise<[string, pylon.Json][]> {
  return Object.entries(await getRawData(namespace));
}

// getting the raw data
export async function getRawData(namespace?: string): Promise<object> {
  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = await getDBKeySize(KV.namespace);

  let data: pylon.JsonObject[] = [];
  for (let i: number = 0; i <= size; ++i)
    data = data.concat(await getInternalObject(i, namespace));

  return await objArrToObj(data);
}

// the number of keys saved
export async function count(
  namespace?: string,
  filter?: (value: any) => boolean
): Promise<number> {
  return (await getAllKeys(namespace, filter)).length;
}

// clears all the values from a namespace
export async function clear(namespace?: string): Promise<worked> {
  await (await getKV(namespace)).clear();
  return true;
}

// transfer one namespace to an other namespace (new ns has to be empty and the old one valid)
export async function namespaceToOtherNamespace(
  oldNamespace: string,
  newNamespace: string
): Promise<worked> {
  const oldKV: pylon.KVNamespace = await getKV(oldNamespace);
  const newKV: pylon.KVNamespace = await getKV(newNamespace);
  const oldSize: number = await getDBKeySize(oldKV.namespace);

  if (
    (await oldKV.list()).length === 0 ||
    (await newKV.list()).length !== 0 ||
    (await errorChecking(oldKV.namespace)) === true
  )
    return false;

  let worked: worked[] = [];
  for (let i: number = 0; i <= oldSize; ++i)
    if (
      (await saveInternalObject(
        await getInternalObject(i, oldKV.namespace),
        i,
        newKV.namespace
      )) === true
    ) {
      worked.push(true);
      await delInternalObject(i, oldKV.namespace);
    } else worked.push(false);

  if (oldSize !== 0) await newKV.put('databaseKeySize', oldSize);

  try {
    await oldKV.delete('databaseKeySize');
  } catch (_) {}

  return !worked.includes(false);
}

export async function errorChecking(namespace?: string): Promise<error> {
  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = await getDBKeySize(KV.namespace);

  if (Object.keys(await getInternalObject(size + 1, KV.namespace)).length !== 0)
    return true;

  for (let i: number = 0; i <= size; ++i)
    if (
      (await getInternalObject(i, KV.namespace)) === undefined &&
      (i !== 0 || size !== 0)
    )
      return true;

  for await (const key of await KV.list())
    if (!key.startsWith('database_') && key !== 'databaseKeySize') return true;

  return false;
}
// #endregion

// #region intern functions
// get the KV for the namespace
async function getKV(namespace?: string): Promise<pylon.KVNamespace> {
  if (namespace !== undefined && namespace !== null)
    return new pylon.KVNamespace(namespace);
  else return Default_KV;
}

// get number of db keys in this namespace
async function getDBKeySize(namespace: string): Promise<number> {
  return (await (await getKV(namespace)).get<number>(`databaseKeySize`)) ?? 0;
}

async function getInternalObject(
  index: number,
  namespace?: string
): Promise<pylon.JsonObject> {
  const KV: pylon.KVNamespace = await getKV(namespace);
  return (await KV.get(`database_${index}`)) ?? {};
}

async function saveInternalObject(
  value: pylon.Json,
  index: number,
  namespace?: string
): Promise<boolean> {
  const KV: pylon.KVNamespace = await getKV(namespace);

  if ((await getSize(value)) <= maxByteSize) {
    await KV.put(`database_${index}`, value);
    return true;
  } else return false;
}

async function delInternalObject(
  index: key,
  namespace?: string
): Promise<boolean> {
  const KV: pylon.KVNamespace = await getKV(namespace);
  try {
    await KV.delete(`database_${index}`);
    return true;
  } catch (_) {
    return false;
  }
}

// correct empty db keys
async function dbKeyOrder(namespace: string): Promise<boolean> {
  const KV: pylon.KVNamespace = await getKV(namespace);
  let size: number =
    (await getDBKeySize(namespace)) === 0 ? -1 : await getDBKeySize(namespace);

  for (let i: number = 0; i <= size; ++i) {
    const data: pylon.JsonObject | undefined = await getInternalObject(
      i,
      namespace
    );

    if (data === undefined || Object.keys(data).length === 0) {
      // current key is empty

      // puts data from key x+1 in key x
      for (let y: number = i; y < size; ++y)
        await KV.put(
          `database_${y}`,
          (await KV.get(`database_${y + 1}`)) ?? {}
        );

      try {
        // deletes empty key which is now the last one
        await KV.delete(`database_${size}`);
      } catch (_) {}

      // decreases the size
      --size;

      // In theory one more key if database is empty, but doesn't work right now. TODO
      if (size === 0 || size === -1)
        try {
          await KV.delete(`databaseKeySize`);
        } catch (_) {}
      else await KV.put(`databaseKeySize`, size); // update size

      await dbKeyOrder(KV.namespace); // restart the whole process to check for a second empty key

      return true;
    }
  }

  return false; // changed nothing
}

// get the size in bytes of an object saved as JSON string
async function getSize(data: any): Promise<number> {
  return new TextEncoder().encode(JSON.stringify(data)).length;
}

// converts an one dimensional object array to an object
async function objArrToObj(objectArray: object[]): Promise<object> {
  let nObject: { [key: string]: any } = {};

  for await (const obj of objectArray)
    for await (const [key, value] of Object.entries(obj)) nObject[key] = value;

  return nObject;
}

async function filterObjValues(
  obj: object,
  filter: (value: any) => boolean
): Promise<object> {
  for await (const [key, value] of Object.entries(obj))
    if (filter(value) === false) delete (obj as any)[key];

  return obj;
}
// #endregion

//#region Docs
/* How to use it:
 * Step 1:
 * First, you have to copy this file. Create a new file called e.g. betterKV.ts and copy/paste this code.
 *
 * Step 2:
 * To use the better KV, you have to import the functions:
 * You go in the file, where you want the database and write: import * as betterKV from './betterKV';
 * If your relative path is not './betterKV', do './FOLDER_NAME/betterKV' or '../FOLDER_NAME/betterKV'
 *
 * Step 3:
 * Use it! Write "await BetterKV." to see what you can do,
 * and after choosing one (e.g. BetterKV.save()) hover with your mouse over the function to see which arguments the function takes!
 * If it is red, you have some wrong input or just write (yourInput as any) to remove the red lines.
 * Same with the output (await theFunction as any) to remove red lines
 *
 * Step 4:
 * If you have already used my old database scripts (scripts with version 1.8 or older), you can convert your existing database to the new one!
 * To do this, you use the ConvertOldDBToNewDB() function. I would recommend you to do this namespace per namespace and not all at once!
 *
 * Step 5:
 * If you want to go back to the normal KV system, use the ConvertDBToNativeKV() function.
 * Again, I recommend you to do this namespace per namespace and not all at once!
 *
 * What are the namespaces? If you use getAllValues("my user namespace") for example, you will only get the values for this namespace!
 * This way, you can code more easily! And it makes the whole database faster! That means you can access faster values from namespaces with only a few values,
 * than access values from namespaces with much data.
 * DON'T use namespaces which you use outside of the db tho!
 *
 * DON'Ts:
 * Looping over any function.
 */

/* Explanation:
 * The native Key-Value storage from pylon works (figuratively) like this:
 *
 * NORMAL WAY:
 * {
 * "key 1": "value 1",
 * "key 2": "value 2",
 * "key 3": "value 3" ,
 * // ...
 * "key 256": "value 256"
 * }
 *
 * You have in total 256 keys and only 8196 bytes (~ 8kb) per key
 *
 * ///////////////////////////////////////////////////////////////////////////////
 *
 * This file uses this simple principle, to extend the 256 keys to much more keys:
 *
 * THIS WAY:
 * {
 * "internal key 1":
 *  { "key 1": "value 1", "key 2": "value 2", ..., "key a": "value a" },
 * "internal key 2":
 *  { "key a+1": "value a+1", "key a+2": "value a+2", ..., "key b": "value b" },
 * "internal key 3":
 *  { "key b+1": "value b+1", "key b+2": "value b+2", ..., "key c": "value c" },
 * // ...
 * "internal key 256":
 *  { "key y": "value y+1", "key y+2": "value y+2", ..., "key z": "value z" }
 * }
 *
 * You still have only 8196 bytes per key (and size(value) + size(key) have to be calculated together per key!),
 * but in practice much more than just 256 keys!
 *
 * Furthermore you have now simple possibilities to change some key, to duplicate values or to get every values which have some propertie!
 */

/* Documentation:
 * The functions are:
 *
 * type key = string | number;
 * type worked = boolean;
 * type error = boolean;
 *
 * save(key: key, value: pylon.Json, namespace?: string, saveIfNotExist: boolean = true): Promise<worked>;
 * transact(key: key | key[], edit: (value: pylon.Json | undefined) => pylon.Json, namespace?: string, replaceUndefined: boolean = false): Promise<worked | worked[]>;
 * duplicate(oldKey: key, newKey: key, namespace?: string, edit?: (value: any) => pylon.Json, overwriteIfNewKeyExist: boolean = false, edit?: (value: any) => pylon.Json): Promise<worked>;
 * changeKey(oldKey: key, newKey: key, namespace?: string, edit?: (value: any) => pylon.Json): Promise<worked>;
 * del(key: key | key[], namespace?: string): Promise<worked| worked[]>;
 * exist(key: key | key[], namespace?: string): Promise<boolean | boolean[]>;
 * get<T extends pylon.Json>(key: key | key[], namespace?: string): Promise<T | undefined>;
 * getAllValues<T extends pylon.Json>(namespace?: string, filter?: (value: any) => boolean): Promise<T>;
 * getAllKeys(namespace?: string, filter?: (value: any) => boolean): Promise<string[]>;
 * getEntries(namespace?: string): Promise<[string, pylon.Json][]>;
 * getRawData(namespace?: string): Promise<object>;
 * count(namespace?: string, filter?: (value: any) => boolean): Promise<number>;
 * clear(namespace?: string): Promise<worked>;
 * namespaceToOtherNamespace(oldNamespace: string, newNamespace: string): Promise<worked>;
 * errorChecking(namespace?: string): Promise<error>;
 *
 * ConvertOldDBToNewDB(namespace?: string | string[]): Promise<boolean | boolean[]>;
 * ConvertDBToNativeKV(namespace?: string | string[]): Promise<boolean | boolean[]>;
 *
 * Most of the functions return a boolen to show you if they did their job successful:
 * If everything was successful, it returns true, if something got wrong (couldn't delete some keys+values for example) it returns false.
 * You should check if it returns false, and if so, handle the problem.
 *
 * Every namespace needs a "databaseKeySize" key so that the functions can work properly. You should nevertheless use a new namespace for each new action.
 */

/* Benchmarks:
 // DO NOT SAVE ANYTHING IN THE NAMESPACE "benchmark ns" OR ELSE EVERYTHING IN THERE WILL BE DELETED

 import * as BetterKV from './Extra/betterKV';
 new discord.command.CommandGroup().raw('PerfTest', async (m) => {
  let time = Date.now();
  const startTime = time;
  await BetterKV.clear('benchmark ns');
  console.log('clear', Date.now() - time + 'ms');

  await BetterKV.save('key 1', '.'.repeat(8000), 'benchmark ns');
  await BetterKV.save('key 2', '.'.repeat(8000), 'benchmark ns');
  await BetterKV.save('key 3', '.'.repeat(8000), 'benchmark ns');
  await BetterKV.save('key 4', '.'.repeat(8000), 'benchmark ns');
  await BetterKV.save('key 5', '.'.repeat(8000), 'benchmark ns');
  console.log('save', Date.now() - time + 'ms');

  time = Date.now();
  await BetterKV.get(
    ['key 1', 'key 2', 'key 3', 'key 4', 'key 5'],
    'benchmark ns'
  );
  console.log('get', Date.now() - time + 'ms');

  time = Date.now();
  await BetterKV.getAllKeys('benchmark ns', (x) => x);
  await BetterKV.getAllValues('benchmark ns', (x) => x);
  await BetterKV.getEntries('benchmark ns');
  await BetterKV.count('benchmark ns');
  await BetterKV.getRawData('benchmark ns');
  console.log('get all', Date.now() - time + 'ms');

  time = Date.now();
  await BetterKV.del(
    ['key 1', 'key 2', 'key 3', 'key 4', 'key 5'],
    'benchmark ns'
  );
  console.log('del', Date.now() - time + 'ms');

  time = Date.now();
  await BetterKV.clear('benchmark ns');
  console.log('clear', Date.now() - time + 'ms');

  console.log(
    `All Benchmarks are done. Total time: ${Date.now() - startTime}ms`
  );
 });

 * Output: 
 * clear ~ 7ms 
 * save ~ 310ms 
 * get ~ 125ms 
 * get all ~ 230ms 
 * del ~ 550ms 
 * clear ~ 7ms 
 * All Benchmarks are done. Total time: ~ 1250ms 
 */

/* Test if everything works:
 * Use the command !WorkTest, it could hit the 100ms limit, so just do it a few times
  
 // DO NOT SAVE ANYTHING IN THE NAMESPACE "test ns" OR ELSE EVERYTHING IN THERE WILL BE DELETED
 import * as BetterKV from './Extra/betterKV';
 new discord.command.CommandGroup().raw('WorkTest', async (m) => {
  console.log(
    'Starting test!',
    'If control is false, or at least one of the save() test return false, the other results will be meaningless.'
  );

  let results: any;
  const startTime: number = Date.now();

  // #region clear
  console.log(
    'CONTROL | TEST clear() 1:',
    (await BetterKV.clear('test ns')) &&
      (await new pylon.KVNamespace('test ns').items()).length === 0
  );
  // #endregion

  // #region save
  console.log(
    'TEST save() 1:',
    await BetterKV.save('a key', 'a value', 'test ns', true)
  );
  console.log(
    'TEST save() 2:',
    (await BetterKV.save('a key', 'a second value', 'test ns', false)) === false
  );
  console.log(
    'TEST save() 3:',
    await BetterKV.save('a key', 'a second value', 'test ns', true)
  );
  console.log(
    'TEST save() 4:',
    (await BetterKV.save(null!, 'a value', 'test ns')) === false
  );
  try {
    await BetterKV.save('a key', undefined!, 'test ns');
  } catch (_) {
    console.log('TEST save() 5:', true);
  }
  console.log(
    'TEST save() 6:',
    await BetterKV.save(1, 'a value', 'test ns', true)
  );
  console.log(
    'TEST save() 7:',
    await BetterKV.save('a third key', '.'.repeat(8000), 'test ns', true)
  );
  console.log(
    'TEST save() 8:',
    await BetterKV.save('a fourth key', '.'.repeat(8000), 'test ns', true)
  );
  // #endregion

  // #region transact
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value', 'test ns'))
  );

  console.log(
    'TEST transact() 1:',
    (await BetterKV.transact(
      'not existing key',
      (x) => x as any,
      'test ns',
      false
    )) === false
  );
  console.log(
    'TEST transact() 2:',
    await BetterKV.transact(
      'not existing key',
      (x) => 'a value',
      'test ns',
      true
    )
  );
  console.log(
    'TEST transact() 3:',
    await BetterKV.transact('a key', (x) => x + '.', 'test ns', true)
  );
  results = (await BetterKV.transact(
    ['a key', 'a second key'],
    (x) => x + ',',
    'test ns',
    true
  )) as boolean[];
  console.log('TEST transact() 4:', results[0] && results[1]);
  console.log(
    'TEST transact() 5:',
    await BetterKV.transact('a key', (x) => '.'.repeat(8000), 'test ns', true)
  );
  // #endregion

  // #region duplicate
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns'))
  );

  console.log(
    'TEST duplicate() 1:',
    (await BetterKV.duplicate('not existing key', 'new key', 'test ns')) ===
      false
  );
  console.log(
    'TEST duplicate() 2:',
    await BetterKV.duplicate('a key', 'new key', 'test ns')
  );
  console.log(
    'TEST duplicate() 3:', // @ts-ignore
    await BetterKV.duplicate('a key', 'new key 2', 'test ns', (x) => '.' + x)
  );
  // #endregion

  // #region get
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns'))
  );

  console.log(
    'TEST get() 1:',
    (await BetterKV.get('not existing key', 'test ns')) === undefined
  );
  console.log(
    'TEST get() 2:',
    (await BetterKV.get('a key', 'test ns')) !== undefined
  );
  console.log(
    'TEST get() 3:',
    (await BetterKV.get<string>(
      ['a key', 'not existing key'],
      'test ns'
    ))![0] === 'a value' &&
      (await BetterKV.get<string>(
        ['a key', 'not existing key'],
        'test ns'
      ))![1] === undefined
  );
  // #endregion

  // #region changeKey
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns'))
  );

  console.log(
    'TEST changeKey() 1:',
    (await BetterKV.changeKey('not existing key', 'new key', 'test ns')) ===
      false
  );
  console.log(
    'TEST changeKey() 2:',
    await BetterKV.changeKey('a key', 'new key', 'test ns')
  );
  console.log(
    'TEST changeKey() 3:', // @ts-ignore
    await BetterKV.changeKey('new key', 'a key', 'test ns', (x) => '.' + x)
  );
  // #endregion

  // #region del
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value', 'test ns')) &&
      (await BetterKV.save('a third key', 'a value', 'test ns'))
  );

  console.log(
    'TEST del() 1:',
    (await BetterKV.del('not existing key', 'test ns')) === false
  );
  console.log('TEST del() 2:', await BetterKV.del('a key', 'test ns'));
  results = (await BetterKV.del(
    ['a second key', 'a third key'],
    'test ns'
  )) as boolean[];
  console.log('TEST del() 3:', results[0] && results[1]);
  // #endregion

  // #region exist
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value', 'test ns'))
  );

  console.log(
    'TEST exist() 1:',
    (await BetterKV.exist('not existing key', 'test ns')) === false
  );
  console.log('TEST exist() 2:', await BetterKV.exist('a key', 'test ns'));
  results = (await BetterKV.exist(
    ['a key', 'a second key'],
    'test ns'
  )) as boolean[];
  console.log('TEST exist() 3:', results[0] && results[1]);
  // #endregion

  // #region get
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value 2', 'test ns'))
  );

  console.log(
    'TEST get() 1:',
    (await BetterKV.get('not existing key', 'test ns')) === undefined
  );
  console.log(
    'TEST get() 2:',
    (await BetterKV.get<string>('a key', 'test ns')) === 'a value'
  );
  results = await BetterKV.get<string[]>(['a key', 'a second key'], 'test ns');
  console.log(
    'TEST get() 3:',
    results[0] === 'a value' && results[1] === 'a value 2'
  );
  // #endregion

  // #region getAllValues
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value 2', 'test ns'))
  );

  results = await BetterKV.getAllValues<string[]>('test ns');
  console.log(
    'TEST getAllValues() 1:',
    results[0] === 'a value' && results[1] === 'a value 2'
  );
  results = await BetterKV.getAllValues<string[]>(
    'test ns',
    (x) => typeof x === 'string'
  );
  console.log(
    'TEST getAllValues() 2:',
    results[0] === 'a value' && results[1] === 'a value 2'
  );
  console.log(
    'TEST getAllValues() 3:',
    (
      await BetterKV.getAllValues<string[]>(
        'test ns',
        (x) => typeof x !== 'string'
      )
    ).length === 0
  );
  // #endregion

  // #region getAllKeys
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value 2', 'test ns'))
  );

  results = await BetterKV.getAllKeys('test ns');
  console.log(
    'TEST getAllKeys() 1:',
    results[0] === 'a key' && results[1] === 'a second key'
  );
  results = await BetterKV.getAllKeys('test ns', (x) => typeof x === 'string');
  console.log(
    'TEST getAllKeys() 2:',
    results[0] === 'a key' && results[1] === 'a second key'
  );
  console.log(
    'TEST getAllKeys() 3:',
    (await BetterKV.getAllKeys('test ns', (x) => typeof x !== 'string'))
      .length === 0
  );
  // #endregion

  // #region getEntries
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value 2', 'test ns'))
  );

  results = await BetterKV.getEntries('test ns');
  console.log(
    'TEST getEntries() 1:',
    results[0][0] === 'a key' && results[1][0] === 'a second key'
  );
  console.log(
    'TEST getEntries() 2:',
    results[0][1] === 'a value' && results[1][1] === 'a value 2'
  );
  console.log('TEST getEntries() 3:', results.length === 2);
  // #endregion

  // #region getRawData
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value 2', 'test ns'))
  );

  console.log(
    'TEST getRawData() 1:',
    JSON.stringify(await BetterKV.getRawData('test ns')) ===
      `{"a key":"a value","a second key":"a value 2"}`
  );
  // #endregion

  // #region count
  console.log(
    'CONTROL:',
    (await BetterKV.clear('test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value 2', 'test ns'))
  );

  console.log('TEST count() 1:', (await BetterKV.count('test ns')) === 2);
  console.log(
    'TEST count() 2:',
    (await BetterKV.count('test ns', (x) => typeof x === 'string')) === 2
  );
  console.log(
    'TEST count() 3:',
    (await BetterKV.count('test ns', (x) => typeof x !== 'string')) === 0
  );
  // #endregion

  console.log('Duration', Date.now() - startTime + 'ms'); // Should be ~ 2000ms

  await BetterKV.clear('test ns');
 });
 */

/* Example:
 * thats how it should look like: "https://media.discordapp.net/attachments/691250517820571649/830824466916573204/unknown.png"
 * Commands: !save <key> <value>; !get <key>; !reset

 * !save <key> <value>
 new discord.command.CommandGroup().on(
  { name: 'save' },
  (args) => ({ key: args.string(), value: args.text() }),
  async (message, { key, value }) => {
    await BetterKV.save(key, value, 'user namespace');
    await message.reply(
      `You saved ${'`' + value + '`'} in the key ${'`' + key + '`'}.`
    );
  }
 );

 * !get <key>
 new discord.command.CommandGroup().on(
  { name: 'get' },
  (args) => ({ key: args.string() }),
  async (message, { key }) => {
    const value: string | undefined = await BetterKV.get<string>(
      key,
      'user namespace'
    );

    if (value === undefined)
      await message.reply(
        `The key ${'`' + key + '`'} has no value associated to it!`
      );
    else
      await message.reply(
        `${'`' + value + '`'} was saved in the key ${'`' + key + '`'}.`
      );
  }
 );

 * !reset
 new discord.command.CommandGroup().raw({ name: 'reset' }, async (message) => {
  if (!message.member.can(discord.Permissions.ADMINISTRATOR))
    return await message.reply(
      `You don't have the permission for that command!`
    );

  await BetterKV.clear(true, 'user namespace');

  await message.reply(`Reseted the KV.`);
 });
*/
// #endregion

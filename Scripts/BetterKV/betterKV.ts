// Florian Crafter (ClashCrafter#0001) - 02-04.2021 - Version 2.0

// "How to use it", "Explanation", "Documentation", "Benchmarks" and "Examples" are at the end of the file (search for "Docs")

// Versions >=2.0 are NOT compatible with versions <=1.8! If you want to migrate to this new system, read the "How to use it" text at the end of this file.
// Check for updates under: "https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/Functions/Database.ts".
// Disclaimer: I take no responsibilys if there is a bug and you loose data (shouldn't happen tho if you use it correctly).

// this namespace will be used, if you don't specify a namespace
const defaultNamespace: string = 'database'; // EDIT

// pylons byte limit per KV key. you shoudn't change it!! If you bought BYOB and have higher byte limits, change the value here.
const maxByteSize: number = 8196;

export const Default_KV: pylon.KVNamespace = new pylon.KVNamespace(
  defaultNamespace
); // This is the default namespace.

// #region compatibility functions
async function ConvertOldDBToNewDB(
  namespace?: string | string[]
): Promise<boolean | boolean[]> {
  return true;
}

async function ConvertDBToNativeKV(
  namespace?: string | string[]
): Promise<boolean | boolean[]> {
  if (Array.isArray(namespace)) {
    // array so just do this function recursively
    let workedForAll: boolean[] = [];
    for await (const ns of namespace)
      workedForAll.push((await ConvertDBToNativeKV(ns)) as boolean);
    return workedForAll;
  }

  const rawData: object = await getRawData(namespace);

  return true;
}
// #endregion

// #region extern functions
// save a value to a key
export async function save(
  key: string | number,
  value: pylon.Json,
  namespace?: string,
  ifNotExist?: boolean
): Promise<boolean> {
  // validate inputs
  if ((await getSize(value)) > maxByteSize || key == null) return false;

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);
  let size: number = (await getDBKeySize(KV.namespace)) as number;
  let savedData: object;

  // check if key is already in some db key and change the value. return true if so
  for (let i: number = 0; i <= size; ++i) {
    savedData = ((await KV.get(`database_${i}`)) ?? {}) as object;

    // search data in current db key
    const _value: pylon.Json = (savedData as any)[key];

    if (_value !== undefined) {
      if (ifNotExist === true) return false;

      (savedData as any)[key] = value; // change value of existing data in local array

      if ((await getSize(savedData)) <= maxByteSize) {
        await KV.put(`database_${i}`, savedData as any); // total size is under 8196 so save in current key
      } else {
        // too big for current key => delete object from current key and saving it as new
        delete (savedData as any)[key];
        await KV.put(`database_${i}`, savedData as any);
        //await dbKeyOrder(KV.namespace);
        await save(key, _value, KV.namespace); // ~~this should be pretty rare so no real performance lost~~
      }

      return true;
    }
  }

  // key is not in current database => try to save in an existing db key
  for (let i: number = 0; i <= size; ++i) {
    savedData = ((await KV.get(`database_${i}`)) ?? {}) as any;

    // saving the data
    (savedData as any)[key] = value;

    if ((await getSize(savedData)) <= maxByteSize) {
      // size check for current key
      await KV.put(`database_${i}`, savedData as any); // current key has space => data is saved in this db key
      return true;
    }
  }

  // no db key had space and key didn't exist yet => new db key is cerated and object saved there
  await KV.put(`databaseKeySize`, ++size);
  await KV.put(`database_${size}`, { key: value });
  return true;
}

// modify values on the fly
export async function transact(
  key: string | number | (string | number)[],
  edit: (value: any) => pylon.Json,
  namespace?: string
): Promise<boolean | boolean[]> {
  if (Array.isArray(key)) {
    // array so just do this function recursively
    let workedForAll: boolean[] = [];
    for await (const k of key)
      workedForAll.push((await transact(k, edit, namespace)) as boolean);
    return workedForAll;
    //return !workedForAll.includes(false);
  }

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);

  // try get current data
  const oldValue: pylon.Json | undefined = (await get(key, KV.namespace)) as
    | pylon.Json
    | undefined;
  if (oldValue === undefined) return false;

  const newValue: pylon.Json = await edit(oldValue); // updated data locally

  // object is too big
  if ((await getSize(newValue)) > maxByteSize) return false;
  else return (await save(key, newValue, KV.namespace)) as boolean; // updated object
}

// duplicates an existing value
export async function duplicate(
  oldKey: string | number,
  newKey: string | number,
  namespace?: string,
  edit?: (value: any) => pylon.Json
): Promise<boolean> {
  const KV: pylon.KVNamespace = await getKV(namespace);

  oldKey = oldKey.toString();
  newKey = newKey.toString();

  // it won't return a array
  let value: pylon.Json | undefined = (await get(oldKey, KV.namespace)) as
    | pylon.Json
    | undefined;

  // old key doesnt exist or new key is used already
  if (value === undefined || (await get(newKey, KV.namespace)) !== undefined)
    return false;

  if (edit !== undefined) value = await edit(value); // edit the data if wanted

  return (await save(newKey, value, KV.namespace)) as boolean; // save the new data
}

// changes the key to an other key
export async function changeKey(
  oldKey: string | number,
  newKey: string | number,
  namespace?: string,
  edit?: (value: any) => pylon.Json
): Promise<boolean> {
  const KV: pylon.KVNamespace = await getKV(namespace);

  oldKey = oldKey.toString();
  newKey = newKey.toString();

  // get the current value
  let value: pylon.Json | undefined = (await get(oldKey, KV.namespace)) as
    | pylon.Json
    | undefined;

  if (value === undefined || (await get(newKey, KV.namespace)) !== undefined)
    return false; // old key doesn't exist and/or new key exists already

  // deletes the old key
  const deleteDataRes: boolean = (await del(oldKey, KV.namespace)) as boolean;

  if (edit !== undefined) value = await edit(value);

  // the new data with the new index
  const saveDataRes: boolean = (await save(
    newKey,
    value,
    KV.namespace
  )) as boolean;

  return deleteDataRes && saveDataRes; // delete old object and save new one
}

// delete the key(s) and value(s)
export async function del(
  key: string | number | (string | number)[],
  namespace?: string
): Promise<boolean | boolean[]> {
  if (Array.isArray(key)) {
    // array so just do this function recursively
    let workedForAll: boolean[] = [];
    for await (const k of key)
      workedForAll.push((await del(k, namespace)) as boolean);
    return workedForAll;
    // if you just want to know if it was for every single one succesfull do:
    // return !workedForAll.includes(false);
  }

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = (await getDBKeySize(KV.namespace)) as number;

  // go through every db key and search for the key
  for (let i: number = 0; i <= size; ++i) {
    let savedData: object = ((await KV.get(`database_${i}`)) ?? {}) as object;

    // object is in current key
    if ((savedData as any)[key] !== undefined) {
      // found data and deleting it localy
      delete (savedData as any)[key];

      // update db key
      await KV.put(`database_${i}`, savedData as any);

      if (Object.keys(savedData).length === 0) await dbKeyOrder(KV.namespace); // db keys have to be sorted, because one of the db keys is now empty

      return true;
    }
  }

  // no key+data was deleted
  return false;
}

// check if an key exist
export async function exist(
  key: string | number | (string | number)[],
  namespace?: string
): Promise<boolean | boolean[]> {
  if (Array.isArray(key)) {
    // array so just do this function recursively
    let exists: boolean[] = [];
    for await (const k of key)
      exists.push((await get(k, namespace)) !== undefined);
    return exists;
  }

  key = key.toString();

  // not an array so just simply do that
  return (await get(key, namespace)) !== undefined;
}

// get the values from the key(s)
export async function get<T extends pylon.Json>(
  key: string | number | (string | number)[],
  namespace?: string
): Promise<T | undefined> {
  if (Array.isArray(key)) {
    // array so just do this function recursively
    let values: (pylon.Json | undefined)[] = [];
    // This won't return a (DataStructure | undefined)[] because you give it only a single string/number.
    for await (const k of key)
      values.push((await get(k, namespace)) as pylon.Json | undefined);

    return values as any;
  }

  key = key.toString();

  // get the KV
  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = (await getDBKeySize(KV.namespace)) as number;

  // it is more optimized to go manually through the keys, than just doing GetAllValues() and searching there for the data
  for (let i: number = 0; i <= size; ++i) {
    // search for key in the db key and return the value if it exists
    const savedData: any = (await KV.get(`database_${i}`)) ?? {};
    if (savedData[key] !== undefined) return savedData[key];
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

  // use all the values with the given properties
  if (filter !== undefined)
    for await (const key of Object.keys(rawData))
      if (filter((rawData as any)[key] === false)) delete (rawData as any)[key];

  // return objects
  if (Object.keys(rawData).length === 0) return [];
  else return Object.values(rawData);
}

// getting all the keys
export async function getAllKeys(
  namespace?: string,
  filter?: (value: any) => boolean
): Promise<string[]> {
  let rawData: object = await getRawData(namespace);

  // filter the keys
  if (filter !== undefined)
    for await (const key of Object.keys(rawData))
      if (filter((rawData as any)[key]) === false) delete (rawData as any)[key];

  return Object.keys(rawData);
}

// getting the raw data
export async function getRawData(namespace?: string): Promise<object> {
  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = (await getDBKeySize(KV.namespace)) as number;

  let data: object[] = [];
  for (let i: number = 0; i <= size; ++i)
    data = data.concat(((await KV.get(`database_${i}`)) ?? {}) as object);

  return await objArrToObj(data);
}

// the number of keys saved
export async function count(
  namespace?: string,
  filter?: (value: any) => boolean
): Promise<number> {
  return (await getAllKeys(namespace, filter)).length;
}

export async function clear(
  clearTheNamespace: boolean,
  namespace?: string
): Promise<boolean> {
  if (clearTheNamespace === true) await (await getKV(namespace)).clear();
  return clearTheNamespace;
}
// #endregion

// #region intern functions
// get the size in bytes of an object saved as JSON
const getSize = async (data: any) => JSON.stringify(data).length;

// get the KV for the namespace
async function getKV(namespace?: string): Promise<pylon.KVNamespace> {
  if (namespace !== undefined && namespace !== null)
    return new pylon.KVNamespace(namespace);
  else return Default_KV;
}

// correct empty db keys
async function dbKeyOrder(namespace: string): Promise<boolean> {
  const KV: pylon.KVNamespace = await getKV(namespace);

  let size: number =
    (await getDBKeySize(namespace)) === 0
      ? -1
      : ((await getDBKeySize(namespace)) as number);

  for (let i: number = 0; i <= size; ++i) {
    const data: object | undefined = (await KV.get(`database_${i}`)) as object;

    if (data === undefined || Object.keys(data).length === 0) {
      // current key is empty

      // puts data from key x+1 in key x
      for (let y: number = i; y < size; ++y)
        await KV.put(
          `database_${y}`,
          (await KV.get(`database_${y + 1}`)) ?? {}
        );

      // deletes empty key which is now the last one
      await KV.delete(`database_${size}`);

      // decreases the size
      --size;

      // In theory one more key if database is empty, but doesn't work right now. TODO
      if (size === 0 || size === -1)
        try {
          await KV.delete(`databaseKeySize`);
        } catch (_) {
          await KV.put(`databaseKeySize`, size);
        }
      else await KV.put(`databaseKeySize`, size); // update size

      await dbKeyOrder(KV.namespace); // restart the whole process to check for a second empty key

      return true;
    }
  }

  return false; // changed nothing
}

// get number of db keys in this namespace
async function getDBKeySize(namespace: string): Promise<number> {
  return ((await (await getKV(namespace)).get<number>(`databaseKeySize`)) ??
    0) as number;
}

// converts an one dimensional object array to an object
async function objArrToObj(objectArray: object[]): Promise<object> {
  objectArray = objectArray.flat();

  let result: object = {};

  for await (const obj of objectArray)
    for await (const key of Object.keys(obj))
      (result as any)[key] = (obj as any)[key];

  return result;
}
// #endregion

//#region Docs
/* How to use it:
 * Step 1:
 * First of all you have to copy this file. Create a new file called e.g. betterKV.ts and copy/paste this code.
 *
 * Step 2:
 * To use the better KV, you have to import the functions:
 * You go in the file, were you want the database and write: import * as betterKV from './betterKV';
 * If your relativ path is not './betterKV', do './FOLDER_NAME/betterKV' or '../FOLDER_NAME/betterKV'
 *
 * Step 3:
 * Use it! Write "await BetterKV." to see what you can do,
 * and after choosing one (e.g. BetterKV.save()) hover with your mouse over the function to see which arguments the function takes!
 *
 * Step 4:
 * If you have already used my old database scripts (scripts with version 1.8 or older), you can convert your existing database to the new one!
 * To do this, you use the ConvertOldDBToNewDB() function. I would recommend you to do this namespace per namespace and not all at once!
 *
 * Step 5:
 * If you want to go back to the normal KV system, use the ConvertDBToNativeKV() function.
 * Again, I recommend you to do this namespace per namespace and not all at once!
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
 * save(key: string | number, value: pylon.Json, namespace?: string): Promise<boolean>;
 * transact(key: string | number | (string | number)[], edit: (value: any) => pylon.Json, namespace?: string): Promise<boolean | boolean[]>;
 * duplicate(oldKey: string | number, newKey: string | number, namespace?: string, edit?: (value: any) => pylon.Json): Promise<boolean>;
 * changeKey(oldKey: string | number, newKey: string | number, namespace?: string, edit?: (value: any) => pylon.Json): Promise<boolean>;
 * del(key: string | number | (string | number)[], namespace?: string): Promise<boolean | boolean[]>;
 * exist(key: string | number | (string | number)[], namespace?: string): Promise<boolean | boolean[]>;
 * get<T extends pylon.Json>(key: string | number | (string | number)[], namespace?: string): Promise<T | undefined>;
 * getAllValues<T extends pylon.Json>(namespace?: string, filter?: (value: any) => boolean): Promise<T>;
 * getAllKeys(namespace?: string, filter?: (value: any) => boolean): Promise<string[]>;
 * getRawData(namespace?: string): Promise<object>;
 * count(namespace?: string, filter?: (value: any) => boolean): Promise<number>;
 * clear(clearTheNamespace: boolean, namespace?: string): Promise<boolean>;
 *
 * ConvertOldDBToNewDB(namespace?: string | string[]): Promise<boolean | boolean[]>;
 * ConvertDBToNativeKV(namespace?: string | string[]): Promise<boolean | boolean[]>;
 *
 * Most of the functions return a boolen to show you if they did their job successful:
 * If everything was successful, it returns true, if something got wrong (couldn't delete some keys+values for example) it returns false.
 * You should check if it returns false, and if so, handle the problem.
 */

/* Benchmarks:
 * Didn't have the time to do them yet.
 */

/* Examples:
 *
 *
 */
// #endregion

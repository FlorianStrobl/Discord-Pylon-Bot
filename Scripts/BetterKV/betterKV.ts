// Florian Crafter (ClashCrafter#0001) - 02-04.2021 - Version 2.1.0

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

export const Default_KV: pylon.KVNamespace = new pylon.KVNamespace(
  defaultNamespace
); // This is the default namespace.

// #region compatibility functions
export async function ConvertOldDBToNewDB(
  namespace?: string | string[]
): Promise<boolean | boolean[]> {
  return true;
}

export async function ConvertDBToNativeKV(
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
  if (
    (await getSize(value)) > maxByteSize ||
    key == null ||
    key === 'databaseKeySize'
  )
    return false;

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);
  let size: number = await getDBKeySize(KV.namespace);
  let savedData: object;

  // check if key is already in some db key and change the value. return true if so
  for (let i: number = 0; i <= size; ++i) {
    savedData = ((await KV.get(`database_${i}`)) ?? {}) as object;

    // search data in current db key
    const cvalue: pylon.Json = (savedData as any)[key];

    if (cvalue !== undefined) {
      if (ifNotExist === true) return false;

      (savedData as any)[key] = value; // change value of existing data in local array

      if ((await getSize(savedData)) <= maxByteSize) {
        await KV.put(`database_${i}`, savedData as any); // total size is under 8196 so save in current key
      } else {
        // too big for current key => delete object from current key and saving it as new
        delete (savedData as any)[key];
        await KV.put(`database_${i}`, savedData as any);
        //await dbKeyOrder(KV.namespace);
        await save(key, cvalue, KV.namespace); // ~~this should be pretty rare so no real performance lost~~
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
  ++size;
  await KV.put(`databaseKeySize`, size);
  await KV.put(`database_${size}`, { [key]: value });
  return true;
}

// modify values on the fly
export async function transact(
  key: string | number | (string | number)[],
  edit: (value: pylon.Json | undefined) => pylon.Json,
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
  const oldValue: pylon.Json | undefined = await get<pylon.Json>(
    key,
    KV.namespace
  );

  let newValue: pylon.Json;

  try {
    newValue = await edit(oldValue); // updated data locally
  } catch (_) {
    return false;
  }

  if (newValue === undefined) return false;

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
  if (
    value === undefined ||
    (await get(newKey, KV.namespace)) !== undefined ||
    newKey === 'databaseKeySize'
  )
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

  if (
    value === undefined ||
    (await get(newKey, KV.namespace)) !== undefined ||
    newKey === 'databaseKeySize'
  )
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
  const size: number = await getDBKeySize(KV.namespace);

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
    for await (const k of key) values.push(await get(k, namespace));
    return values as any;
  }

  key = key.toString();

  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = await getDBKeySize(KV.namespace);

  // it is more optimized to go manually through the keys, than just doing GetAllValues() and searching there for the data
  for (let i: number = 0; i <= size; ++i) {
    // search for key in the db key and return the value if it exists
    const savedData: object = ((await KV.get(`database_${i}`)) ?? {}) as object;
    if ((savedData as any)[key] !== undefined) return (savedData as any)[key];
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
    return Object.values(await filterObjValues(rawData, filter)) as T;
  else return Object.values(rawData) as T;
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

// getting the raw data
export async function getRawData(namespace?: string): Promise<object> {
  const KV: pylon.KVNamespace = await getKV(namespace);
  const size: number = await getDBKeySize(KV.namespace);

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
    (await getDBKeySize(namespace)) === 0 ? -1 : await getDBKeySize(namespace);

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
  return (await (await getKV(namespace)).get<number>(`databaseKeySize`)) ?? 0;
}

// converts an one dimensional object array to an object
async function objArrToObj(objectArray: object[]): Promise<object> {
  let result: object = {};
  for await (const obj of objectArray)
    for await (const key of Object.keys(obj))
      (result as any)[key] = (obj as any)[key];
  return result;
}

async function filterObjValues(
  obj: object,
  filter: (value: any) => boolean
): Promise<object> {
  for await (const key of Object.keys(obj))
    if (filter((obj as any)[key]) === false) delete (obj as any)[key];

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
 * save(key: string | number, value: pylon.Json, namespace?: string, ifNotExist?: boolean): Promise<boolean>;
 * transact(key: string | number | (string | number)[], edit: (value: pylon.Json | undefined) => pylon.Json, namespace?: string): Promise<boolean | boolean[]>;
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
 *
 * Every namespace needs a "databaseKeySize" key so that the functions can work properly. You should nevertheless use a new namespace for each new action.
 */

/* Benchmarks:
 * Test
 let time = Date.now();
  await BetterKV.clear(true);
  console.log('clear', Date.now() - time + 'ms');
  await BetterKV.save('key 1', '.'.repeat(8000));
  await BetterKV.save('key 2', '.'.repeat(8000));
  await BetterKV.save('key 3', '.'.repeat(8000));
  await BetterKV.save('key 4', '.'.repeat(8000));
  await BetterKV.save('key 5', '.'.repeat(8000));
  console.log('save', Date.now() - time + 'ms');
  time = Date.now();
  await BetterKV.get(['key 1', 'key 2', 'key 3', 'key 4', 'key 5']);
  console.log('get', Date.now() - time + 'ms');
  time = Date.now();
  await BetterKV.getAllKeys(undefined, (x) => x);
  await BetterKV.getAllValues(undefined, (x) => x);
  await BetterKV.count();
  await BetterKV.getRawData();
  console.log('get all', Date.now() - time + 'ms');
  time = Date.now();
  await BetterKV.del(['key 1', 'key 2', 'key 3', 'key 4', 'key 5']);
  console.log('del', Date.now() - time + 'ms');
  time = Date.now();
  await BetterKV.clear(true);
  console.log('clear', Date.now() - time + 'ms');

 * Output: 
 * clear ~8ms
 * save ~310ms
 * get ~140ms
 * get all ~180ms
 * del ~600ms
 * clear ~8ms
 */

/* Test if everything works:
 * Use the command !Test (yes it is this prefix)
  
 import * as BetterKV from './betterKV';
 new discord.command.CommandGroup().raw('Test', async (m) => {
  console.log(
    'Starting test!',
    'If control is false, or at least one of the save() test return false, the other results will be meaningless.'
  );

  let results: any;
  const startTime: number = Date.now();

  // #region clear
  console.log(
    'CONTROL | TEST clear() 1:',
    (await BetterKV.clear(true, 'test ns')) &&
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
    (await BetterKV.save('a key', 'a second value', 'test ns', true)) === false
  );
  console.log(
    'TEST save() 3:',
    await BetterKV.save('a key', 'a second value', 'test ns', false)
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
    (await BetterKV.clear(true, 'test ns')) &&
      (await BetterKV.save('a key', 'a value', 'test ns')) &&
      (await BetterKV.save('a second key', 'a value', 'test ns'))
  );

  console.log(
    'TEST transact() 1:',
    (await BetterKV.transact('not existing key', (x) => x, 'test ns')) === false
  );
  console.log(
    'TEST transact() 2:',
    await BetterKV.transact('a key', (x) => x + '.', 'test ns')
  );
  results = (await BetterKV.transact(
    ['a key', 'a second key'],
    (x) => x + ',',
    'test ns'
  )) as boolean[];
  console.log('TEST transact() 3:', results[0] && results[1]);
  console.log(
    'TEST transact() 4:',
    await BetterKV.transact('a key', (x) => '.'.repeat(8000), 'test ns')
  );
  // #endregion

  // #region duplicate
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear(true, 'test ns')) &&
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
    'TEST duplicate() 3:',
    await BetterKV.duplicate('a key', 'new key 2', 'test ns', (x) => '.' + x)
  );
  // #endregion

  // #region get
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear(true, 'test ns')) &&
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
    (await BetterKV.get<string[]>(
      ['a key', 'not existing key'],
      'test ns'
    ))![0] === 'a value' &&
      (await BetterKV.get<string[]>(
        ['a key', 'not existing key'],
        'test ns'
      ))![1] === undefined
  );
  // #endregion

  // #region changeKey
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear(true, 'test ns')) &&
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
    'TEST changeKey() 3:',
    await BetterKV.changeKey('new key', 'a key', 'test ns', (x) => '.' + x)
  );
  // #endregion

  // #region del
  // CONTROL
  console.log(
    'CONTROL:',
    (await BetterKV.clear(true, 'test ns')) &&
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
    (await BetterKV.clear(true, 'test ns')) &&
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
    (await BetterKV.clear(true, 'test ns')) &&
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
    (await BetterKV.clear(true, 'test ns')) &&
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
    (await BetterKV.clear(true, 'test ns')) &&
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

  // #region getRawData
  console.log(
    'CONTROL:',
    (await BetterKV.clear(true, 'test ns')) &&
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
    (await BetterKV.clear(true, 'test ns')) &&
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

  console.log('Duration', Date.now() - startTime + 'ms');

  await BetterKV.clear(true, 'test ns');
 });
 */

/* Example:
 * thats how it should look like: "https://media.discordapp.net/attachments/691250517820571649/830824466916573204/unknown.png"
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

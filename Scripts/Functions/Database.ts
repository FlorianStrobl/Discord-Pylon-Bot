// Florian Crafter - 02-04.2021 - Version 1.8
// Question about or need help for the code? Read the docs and look at the examples and at last DM me on Discord (ClashCrafter#0001).

// READ AT LEAST THE CAPSLOCK LINES (like "HOW TO USE IT") & EDIT THE LINES WITH "// EDIT" AT THE END

/*
 * If the version is under 2.0 the SaveData() function is not optimized yet and you should check if a newer version is available
 * on "https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/Functions/Database.ts".
 *
 * See an example code on: "https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/Functions/DatabaseExamples.ts".
 * Second example with !warn <user> <reason> "https://github.com/FlorianStrobl/Discord-Pylon-Bot/blob/master/Scripts/Functions/WarnCommandWDatabase.ts".
 * You want a undocumented version? Here: "https://gist.github.com/FlorianStrobl/219c6c0af240a2a576b28b7aebb744e8"!
 *
 * Store objects in Pylon now easily with these functions. The functions try to utilise every single byte
 * of the 8196 byte limit per key and if needed will create new keys. It works pretty much as the current KV system just without the 256 key limit.
 * Your objects DON'T has to have the same structure, as long they are storable as JSON String and have the index (as described later).
 * Objects are only saveable if they have a unique index / id in the current namespace and are not over 8196 bytes alone. If two different objects have the same index / id, the data will be overwritten!
 * You can choose the index / id propertie name of the object, yourself in the variable *indexName*, then you change it in the interface
 * and then you can use numbers and or strings as index / id.
 * You can specify the namespace for every object yourself. This will improve the speed noticeably. If you don't specify one in the function, you'll use the main namespace (defined in the *defaultNamespace* variable). That means that if you GetAllData()
 * and you don't specify a namespace, you'll only get the data from the default namespace!
 *
 *
 * HOW TO USE IT: I would recommend you to follow my steps exactly like I say:
 * - Read this whole comment (or at least the capslock lines)
 * - create a new file called (e.g.) "database.ts" for your discord server
 * - copy&paste this code to it
 * - search for "EDIT" with CTRL+F and edit there the lines to your values
 * - At the top of all files were you need the database write: "import * as Database from './database';".
 *   (The last string here is the folder directory. If your database is in a folder, write './FOLDER/database'
 *   and if your file is in a folder, but the database not, do '../database')
 * - Now you can use your 10 Functions and the KV directly with the keyword Database
 *   (for example: await Database.GetAllData(); )
 * PS: I would recommend NOT to use KV Namespaces which you already used to use to prevent any errors.
 * PPS: write undefined if you dont't need a special namespace or let it empty.
 * PPPS: WHY IS IT READ UNERLINED?? Probably because it thinks you give it stuff with wrong *types*: how do I fix this?
 *  use the *as* keyword! E.g. SaveData( {index: "i", data: "d"} as any ). This way you say TypeScript that you don't make an error.
 *  This is true for the return values of the functions too. Example for that: if ( (DeleteData("index") as boolean) === false ) return;
 *  In this case you know that it won't be an boolean array since you only give it one string (and not an string array). With the *as* you tell TypeScript that.
 *
 * A quick overview of the functions:
 *
 * SaveData(object, "namespace"?); Promise<boolean> // object has to have the structure of the DataStructure interface and has to have a UNIQUE index/id
 * DeleteData("index/id", "namespace"?); Promise<boolean> // deletes the data with this index. returns true if it was done succesfully.
 * GetData("index/id", "namespace"?); Promise<DataStructure | undefined> // Returns your searched data or returns undefined if it doesn't exist.
 * GetAllData(function?, "namespace"?); Promise<DataStructure[] | undefined> // optional function to get only data with specified properties
 * UpdateDataValues("index/id", function, "namespace"?); Promise<boolean> // update the values of an specific object. The given function has to return an object !!!
 * ChangeIndex("index/id", "index/id", "namespace"?); Promise<boolean> // change the index of an object.
 * IndexExist("index/id", "namespace"?); Promise<boolean> // returns true if an object exists which has this index
 * AllIndexes(function?, "namespace"?); // returns all indexes (with the properties defined in the optinal function)
 * DuplicateData("index/id", "index/id", function?, "namespace"?); // duplicates the object and optinally change values from it
 * ResetDatabase(true, "namespace"?); Promise<boolean> // deletes THE ENTIRE DATA
 *
 * The UpdateDataValues() function is just a cleaner/faster way of doing manually GetData(), edit the data and SaveData().
 *
 * Some functions return a bool which let you know if the task was succesfully done (e.g. if UpdateDataValues() returns false, it hasn't updated anything).
 *
 * DO NOT LOOP OVER SaveData(), DeleteData() or UpdateDataValues() (at least not more then 10 times)
 * because you can hit the 100ms limit of Pylons CPU Time and LOOSE SOME DATA.
 *
 * The actuall keys used in the KV Namespace are (for debuging important): "databaseKeySize" and "database_${databaseKeySizes}"
 *
 * Benchmarks (from version 1.3 => there were no different namespaces back then so results may differ to new versions):
 * The Benchmarks were made with an empty database at the beginning and with 1500 bytes objects (if not specified else).
 * I took all the tests at least 5 times and yes, some results are pretty astonish but they are all true!
 * Lines with " scale with the amount of keys and amount of objects in them
 * Lines with ' scale with the size of the objects in bytes
 * TIMES DO NOT SCALE EVERYWERE LINEARLY!
 *
 *                                 SaveData()
 * "' Average SaveData() time for new data (one object):                              ~30ms
 * "' Average SaveData() time for new data (one object in the key 20):                ~280ms
 * "' Average SaveData() time for updating existing data (one object):                ~25ms
 * "' Average SaveData() time for updating existing data (one object in the key 20):  ~170ms
 *
 *                                 DeleteData()
 * "  Average DeleteData() time for existing data (one object):                       ~40ms
 * "  Average DeleteData() time for existing data (one object in key 1 but 20 keys):  ~150ms
 * "  Average DeleteData() time for existing data (one object in key 20):             ~300ms
 * "  Average DeleteData() time for non-existing data (one object):                   ~15ms
 * "  Average DeleteData() time for non-existing data (20 keys):                      ~145ms
 *
 *                                  GetData()
 * "  Average GetData() time for existing data (one object):                          ~15ms
 * "  Average GetData() time existing or non-existing data (one object in key 20):    ~140ms
 *
 *                                  GetAllData()
 * "  Average GetAllData() time (100 objects (with 100 bytes and one key)):           ~20ms
 * "  Average GetAllData() time (100 objects (with 1500 bytes and 20 keys)):          ~145ms
 * "  Average GetAllData(f) time (one objects one key with given function):           ~20ms
 * "  Average GetAllData(f) time (100 objects (20 keys) with given function):         ~150ms
 *
 *                                UpdateDataValues()
 * "  Average UpdateDataValues() time (one object):                                   ~35ms
 * "  Average UpdateDataValues() time (one object (key 20)):                          ~290ms
 * "  Average UpdateDataValues() time none-existing data (one object (20 keys)):      ~150ms
 *
 * Conclusion to the benchmarks:
 * GetIndex(), GetData() and even GetAllIndexes(), GetAllData() are REALLY fast (like 50ms for 50kb data) and can be improved greatly with use of different namespaces.
 * Saving and deleting data needs much more time.
 * The other functions are just the combined time of these two fundamental functions.
 *
 * I take no responsibilys if there is a bug and you loose data (shouldn't happen tho if you use it correctly).
 */

// structure of the data // EDIT
// this is the main reason why you have a red underlined code. Use `as any` to fix them (example for that is on line 37 ^).
export interface DataStructure extends pylon.JsonObject {
  index: string | number; // the index / id of your data. Every object has to have this or else you can't use it here
  // you can do here what ever you want as long it can be saved in the JSON format.
  // you can ignore this too and just pass objects
}

// index name of the objects/interface. has to be the same as the index name of *DataStructure*
const indexName: string = 'index'; // EDIT

// this namespace will be used, if you don't specify a namespace
const defaultNamespace: string = 'database'; // EDIT

// pylons byte limit per KV key. you shoudn't change it. If you bought BYOB and have bigger byte limits, change the value here.
const maxByteSize: number = 8196;

export const Default_KV: pylon.KVNamespace = new pylon.KVNamespace(
  defaultNamespace
); // This is the default namespace.

// DO NOT LOOP OVER THIS (more then 10 times)
export async function SaveData(
  data: DataStructure | DataStructure[],
  namespace?: string
): Promise<boolean | boolean[]> {
  // Index is already in database => update object.
  // Index isn't in the database => save as new object.

  // If it is an array, do all the task and return if every single one of them, was succesfully done. TODO return the array if you need to know wich one worked and which one failed.
  if (Array.isArray(data)) {
    let workedForAll: boolean[] = [];
    for await (const d of data)
      workedForAll.push((await SaveData(d, namespace)) as boolean);
    //return !workedForAll.includes(false);
    return workedForAll;
  }

  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);

  // objects over 8196 bytes and/or without an index are not supported
  if (
    (await GetSize(data)) > maxByteSize ||
    data[indexName] === undefined ||
    data[indexName] === null
  )
    return false;

  let size: number = (await GetDatabaseKeySize(KV.namespace)) as number;
  let savedData: DataStructure[];

  // check if index is already in some key and change the object. return true if so
  for (let i: number = 0; i <= size; ++i) {
    savedData = (await KV.get<DataStructure[]>(`database_${i}`)) ?? [];

    // search object in current key
    let indexData: number = savedData.findIndex(
      (d) => d[indexName]?.toString() === data[indexName]?.toString()
    );

    if (indexData !== -1) {
      savedData[indexData] = data; // change value of existing object in local array

      // this will improve speed in the future but is way slower at first, decomment the other lines if you want more speed at once TODO

      //if ((await GetSize(savedData)) <= maxByteSize) {
      //  await KV.put(`database_${i}`, savedData); // total size is under 8196 so save in current key
      //} else {
      // too big for current key => delete object from current key and saving as new object
      savedData.splice(indexData, 1);
      await KV.put(`database_${i}`, savedData);
      //await DatabaseKeyOrder(KV.namespace);
      await SaveData(data, KV.namespace); // ~~this should be pretty rare so no real performance lost~~
      //}

      return true;
    }
  }

  // index is not in current database => try to save new object in an existing key
  for (let i: number = 0; i <= size; ++i) {
    savedData = (await KV.get<DataStructure[]>(`database_${i}`)) ?? [];
    savedData.push(data);

    if ((await GetSize(savedData)) <= maxByteSize) {
      // size check for current key
      await KV.put(`database_${i}`, savedData); // current key has space => object is saved in this key
      return true;
    }
  }

  // no key had space => new key is cerated and object saved there
  await KV.put(`databaseKeySize`, ++size);
  await KV.put(`database_${size}`, [data]);
  return true;
}

// DO NOT LOOP OVER THIS (more then 10 times)
export async function DeleteData(
  index: string | number | string[] | number[],
  namespace?: string
): Promise<boolean | boolean[]> {
  // If index isn't in the database => return false.

  // If it is an array, do all the task and return if every single one of them, was succesfully done.
  if (Array.isArray(index)) {
    let workedForAll: boolean[] = [];
    for await (const i of index)
      workedForAll.push((await DeleteData(i, namespace)) as boolean);
    //return !workedForAll.includes(false);
    return workedForAll;
  }

  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);
  const size: number = (await GetDatabaseKeySize(KV.namespace)) as number;

  // go through every key and search for the index
  for (let i: number = 0; i <= size; ++i) {
    let data: DataStructure[] =
      (await KV.get<DataStructure[]>(`database_${i}`)) ?? [];

    // search the index
    let indexData: number = data.findIndex(
      (data) => data[indexName]!.toString() === index.toString()
    );

    // object is in current key
    if (indexData !== -1) {
      data.splice(indexData, 1); // found object and deleting it localy
      await KV.put(`database_${i}`, data); // update kv
      if (data.length === 0) await DatabaseKeyOrder(KV.namespace); // keys are sorted because one of the keys is now empty

      return true;
    }
  }

  // no data was deleted, probably because there was no object with this index
  return false;
}

// DO NOT LOOP OVER THIS (more then 10 times)
export async function GetData(
  index: string | number | (string | number)[],
  namespace?: string
): Promise<DataStructure | (DataStructure | undefined)[] | undefined> {
  // If it is an array, do all the task and return if every single one of them, was succesfully done. TODO return the array if you need to know wich one worked and which one failed.
  if (Array.isArray(index)) {
    let data: (DataStructure | undefined)[] = [];
    // This won't return a (DataStructure | undefined)[] because you give it only a single string/number.
    for await (const i of index)
      data.push((await GetData(i, namespace)) as DataStructure | undefined);

    return data;
  }

  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);
  const size: number = (await GetDatabaseKeySize(KV.namespace)) as number;

  let data: DataStructure | undefined;
  // it is more optimized to go manually through the data, than just doing GetAllData() and searching there
  for (let i: number = 0; i <= size; ++i) {
    // search for index in the database and return the data if it finds something
    data = ((await KV.get<DataStructure[]>(`database_${i}`)) ?? []).find(
      (d) => d[indexName]?.toString() === index.toString()
    );

    if (data !== undefined) return data;
  }

  // no object had the index
  return undefined;
}

export async function GetAllData(
  namespace?: string,
  filter?: (data: DataStructure) => boolean
): Promise<DataStructure[]> {
  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);
  const size: number = (await GetDatabaseKeySize(KV.namespace)) as number;

  let data: DataStructure[] = [];
  // get every key and save the data in a local array
  for (let i: number = 0; i <= size; ++i)
    data = data.concat((await KV.get<DataStructure[]>(`database_${i}`)) ?? []);

  if (filter !== undefined) {
    let filteredData: DataStructure[] = [];
    // use all the data and search now the data with the given properties
    for await (const d of data)
      try {
        if (filter(d) === true) filteredData.push(d);
      } catch (_) {}

    data = filteredData;
  }

  // return objects
  if (data.length === 0) return [];
  else return data;
}

export async function UpdateDataValues(
  index: string | number | string[] | number[],
  editData: (data: DataStructure) => DataStructure,
  namespace?: string
): Promise<boolean | boolean[]> {
  // If index doesn't exist => does nothing and returns false
  // If new object is larger then max byte size or index was changed => does nothing and return false.

  if (Array.isArray(index)) {
    let workedForAll: boolean[] = [];
    for await (const i of index)
      workedForAll.push(
        (await UpdateDataValues(i, editData, namespace)) as boolean
      );
    //return !workedForAll.includes(false);
    return workedForAll;
  }

  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);

  // try get current data
  let data: DataStructure | undefined = (await GetData(index, KV.namespace)) as
    | DataStructure
    | undefined;
  if (data === undefined) return false;

  const updatedData: DataStructure = await editData(data); // updated object locally
  if (
    updatedData[indexName] !== data[indexName] ||
    (await GetSize(updatedData)) > maxByteSize
  )
    return false; // index was changed and/or object is too big now

  return (await SaveData(updatedData, KV.namespace)) as boolean; // updated object
}

// duplicate existing data, and you can optionally modify it before
export async function DuplicateData(
  oldIndex: string | number,
  newIndex: string | number,
  namespace?: string,
  dataEdit?: (data: DataStructure) => DataStructure
): Promise<boolean> {
  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);

  // it won't return a array
  let data: DataStructure | undefined = (await GetData(
    oldIndex,
    KV.namespace
  )) as DataStructure | undefined;

  // old key doesnt exist or new key is used already
  if (
    data === undefined ||
    (await GetData(newIndex, KV.namespace)) !== undefined
  )
    return false;

  data[indexName] = newIndex; // change index of new data

  if (dataEdit !== undefined) data = await dataEdit(data); // edit the data if wanted

  return (await SaveData(data, KV.namespace)) as boolean; // save the new data
}

// check if an index exists
export async function IndexExist(
  index: string | number | (string | number)[],
  namespace?: string
): Promise<boolean | boolean[]> {
  if (Array.isArray(index)) {
    // saves the result for each data
    let exists: boolean[] = [];
    for await (const i of index)
      exists.push((await GetData(i, namespace)) !== undefined);
    return exists;
  }

  // not an array so just simply do that
  return (await GetData(index, namespace)) !== undefined;
}

export async function ChangeIndex(
  oldIndex: string | number,
  newIndex: string | number,
  namespace?: string
): Promise<boolean> {
  // change the index of an existing object

  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);

  // get the current data
  let data: DataStructure | undefined = (await GetData(
    oldIndex,
    KV.namespace
  )) as DataStructure | undefined;

  if (
    data === undefined ||
    (await GetData(newIndex, KV.namespace)) !== undefined
  )
    return false; // old index doesn't exist and/or new index exists already

  data[indexName] = newIndex; // change index

  // deletes the old data
  const deleteDataRes: boolean = (await DeleteData(
    oldIndex,
    KV.namespace
  )) as boolean;
  // the new data with the new index
  const saveDataRes: boolean = (await SaveData(data, KV.namespace)) as boolean;

  return deleteDataRes && saveDataRes; // delete old object and save new one
}

export async function AllIndexes(
  namespace?: string,
  filter?: (data: DataStructure) => boolean
): Promise<string[]> {
  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);

  const data: DataStructure[] | undefined = await GetAllData(
    KV.namespace,
    filter
  );

  if (data === undefined) return []; // no data is saved

  // just return all the index names
  return data.map((d) => d[indexName]!) as string[];
}

export async function ResetDatabase(
  clearTheNamespace: boolean,
  namespace?: string
): Promise<boolean> {
  if (clearTheNamespace === true) await (await GetKV(namespace)).clear();
  return clearTheNamespace;
}

// correct empty keys
async function DatabaseKeyOrder(namespace: string): Promise<boolean> {
  // get the KV
  const KV: pylon.KVNamespace = await GetKV(namespace);

  let size: number =
    ((await GetDatabaseKeySize(namespace)) as number) === 0
      ? -1
      : ((await GetDatabaseKeySize(namespace)) as number);

  for (let i: number = 0; i <= size; ++i) {
    let data: DataStructure[] | undefined = await KV.get<DataStructure[]>(
      `database_${i}`
    );

    if (data === undefined || data.length === 0) {
      // current key is empty
      for (let y: number = i; y < size; ++y)
        // puts data from key x+1 in key x
        await KV.put(
          `database_${y}`,
          (await KV.get<DataStructure[]>(`database_${y + 1}`)) ?? []
        );

      await KV.delete(`database_${size}`); // deletes empty key which is now the last one
      // In theory one more key if database is empty, but doesn't work right now. TODO
      if (size === 0 || size === -1)
        try {
          await KV.delete(`databaseKeySize`);
        } catch (_) {
          await KV.put(`databaseKeySize`, --size);
        }
      else await KV.put(`databaseKeySize`, --size); // update size

      await DatabaseKeyOrder(KV.namespace); // restart the whole process to check for a second empty key

      return true;
    }
  }

  return false; // changed nothing
}

const GetKV = async (namespace?: string) => {
  if (namespace !== undefined && namespace !== null)
    return new pylon.KVNamespace(namespace);
  else return Default_KV;
};

// get number of keys in KV
const GetDatabaseKeySize = async (namespace: string) =>
  (await GetKV(namespace)).get<number>(`databaseKeySize`) ?? 0;

// get the size in bytes of an object saved as JSON
const GetSize = async (data: any) => JSON.stringify(data).length;

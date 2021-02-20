// Florian Crafter - 02.2021 - Version 1.2b
// Question about the code? DM Clash Crafter#7370 on Discord

// If the version is under 2.0 the SaveData() function is not optimized yet and you should check if a newer version is availible
// on "https://gist.github.com/FlorianStrobl/219c6c0af240a2a576b28b7aebb744e8/".

// namespace
export const KV: pylon.KVNamespace = new pylon.KVNamespace('database');

// structure of the data
export interface DataStructure extends pylon.JsonObject {
  index: string; // the id of the data
  data: string; // data
  // you can do here what ever you want as long it can be saved in the JSON format
}

// index name of the objects/interface. has to be the same as the index name of *DataStructure*
const indexName: string = 'index';

/*
 * If you want to store objects, you can do it now with this functions easily. The functions try to utilise every single byte
 * of the 8196 byte limit per key. Your objects has to have all the same structure and and has to storable as JSON.
 * Additionaly can objects over 8196 bytes no be handled by these functions. SaveData() e.g. returns false if the size is reached and
 * ChangeDataValues() too.
 * The objects are only savable if they have some kind of index / unique id. If two different data have the same
 * index / id, it will be overwritten! You can choose the index/id name yourself in the variable *indexName*.
 *
 * I would recommend to save this code inside a seperate file and importing then the functions.
 *
 * Here a quick overview of the functions:
 *
 * SaveData(object); Promise<boolean> // object has to have the structure of the DataStructure interface and has to have a UNIQUE index/id
 * DeleteData("index/id"); Promise<boolean>
 * GetData("index/id"); Promise<DataStructure | undefined>
 * GetAllData(function?); Promise<DataStructure[] | undefined> // optional function to get only data with specified properties
 * ChangeDataValues("index/id", function); Promise<boolean> // function has to return the object !!!
 * ResetDatabase(true); Promise<boolean>
 *
 * Some functions return a bool which says if the task was succesfully done
 *
 * DO NOT LOOP OVER SaveData(), DeleteData() and ChangeDataValues() (at least not more then 10 times)
 * because you can hit the 100ms limit of Pylons CPU Time and LOOSE SOME DATA
 *
 * Yes the ChangeDataValues() is just a cleaner version of doing it manually with the other functions.
 *
 * Actuall keys used are:*databaseKeySize and database_databaseKeySize
 *
 * This Benchmarks were made with an empty database at the beginning and with 1500 bytes objects (if not specified else).
 * I took all tests at least 5 times and yes, some results are pretty astonish but they are all true!
 * Lines with " scale with the amount of keys and amount of objects in them
 * Lines with ' scale with the size of the objects in bytes
 * TIMES SOMETIMES DO NOT SCALE LINEAR!
 *
 * "' Average SaveData() time for new data (one object):                              ~30ms
 * "' Average SaveData() time for new data (one object in the key 20):                ~280ms
 * "' Average SaveData() time for updating existing data (one object):                ~25ms
 * "' Average SaveData() time for updating existing data (one object in the key 20):  ~170ms
 *
 * "  Average DeleteData() time for existing data (one object):                       ~40ms
 * "  Average DeleteData() time for existing data (one object in key 1 but 20 keys):  ~150ms
 * "  Average DeleteData() time for existing data (one object in key 20):             ~300ms
 * "  Average DeleteData() time for non-existing data (one object):                   ~15ms
 * "  Average DeleteData() time for non-existing data (20 keys):                      ~145ms
 *
 * "  Average GetData() time for existing data (one object):                          ~15ms
 * "  Average GetData() time existing or non-existing data (one object in key 20):    ~140ms
 * "  Average GetAllData() time (100 objects (with 100 bytes and one key)):           ~20ms
 * "  Average GetAllData() time (100 objects (with 1500 bytes and 20 keys)):          ~145ms
 * "  Average GetAllData(f) time (one objects one key)):                              ~20ms
 * "  Average GetAllData(f) time (100 objects (20 keys)):                             ~150ms
 *
 * "  Average ChangeDataValues() time (one object):                                   ~35ms
 * "  Average ChangeDataValues() time (one object (key 20)):                          ~290ms
 * "  Average ChangeDataValues() time none-existing data (one object (20 keys)):      ~150ms
 */

// pylons byte limit per key. you shoudn't change it, only if you bought BYOP and have now more size possibility per key
const maxByteSize: number = 8196;

// save data. If was index was already in database => update data. If index wasn't in the database => save new data. DO NOT loop over this more then 10 times!!!
export async function SaveData(data: DataStructure): Promise<boolean> {
  if ((await GetSize(data)) > maxByteSize) return false;

  let size: number = (await KV.get<number>(`databaseKeySize`)) ?? 0;
  let datas: DataStructure[];

  // check if index is already in some key and change the data. return if so
  for (let i: number = 0; i <= size; ++i) {
    datas = (await KV.get<DataStructure[]>(`database_${i}`)) ?? [];

    // search data in the current key
    let indexData: number = datas.findIndex(
      (d) => d[indexName] === data[indexName]
    );

    if (indexData !== -1) {
      // change value of existing data in local array
      datas[indexData] = data;

      if ((await GetSize(datas)) <= maxByteSize) {
        // size allows to save in current key
        await KV.put(`database_${i}`, datas);
      } else {
        // too big current key so:
        datas.splice(indexData, 1);
        await KV.put(`database_${i}`, datas);

        // data was deleted from current key and will no be handelt and saved as new data
        await SaveData(data); // this should be pretty rare so no real performance lost
      }
      return true;
    }
  }

  // it is a new index. Try to save it in an existing key to save time later
  for (let i: number = 0; i <= size; i++) {
    datas = (await KV.get<DataStructure[]>(`database_${i}`)) ?? [];

    // first key is empty => everything should be empty
    if (datas.length === 0 && size === 0) await KV.put(`databaseKeySize`, 0);

    datas.push(data);

    if ((await GetSize(datas)) <= maxByteSize) {
      // data is saved in a key which has space left
      await KV.put(`database_${i}`, datas);
      return true;
    }
  }

  // no key had space so new key is cerated and data saved there
  await KV.put(`databaseKeySize`, ++size);
  await KV.put(`database_${size}`, [data]);
  return true;
}

// deletes the data for the given index. !!! if index wasn't in data base it returns false. Only use this if you want to delete one to ten Objects (do not loop over this, if it's more then 10 times)
export async function DeleteData(index: string): Promise<boolean> {
  let size: number = (await KV.get<number>(`databaseKeySize`)) ?? 0;

  // go through every key and search for the index
  for (let i: number = 0; i <= size; ++i) {
    // get the current data
    let data: DataStructure[] =
      (await KV.get<DataStructure[]>(`database_${i}`)) ?? [];

    // search the index
    let indexData: number = data.findIndex((data) => data[indexName] === index);

    if (indexData !== -1) {
      // found data and deleting it localy
      data.splice(indexData, 1);
      // save data in the kv
      await KV.put(`database_${i}`, data);
      // brings the data in right order if there is a key with no data
      await DatabaseKeyOrder();
      return true;
    }
  }

  // no data was deleted, probably because there was no object with this index
  return false;
}

// returns the data for the given index. Only use this if you want to get one Object (do not loop over this)
export async function GetData(
  index: string
): Promise<DataStructure | undefined> {
  let size: number = (await KV.get<number>(`databaseKeySize`)) ?? 0;
  let data: DataStructure | undefined;

  // it is more optimized to go manualy trow the data, then just doing GetAllData() and searching there
  for (let i: number = 0; i <= size; ++i) {
    // search for index in the database and return the data if it finds something
    data = ((await KV.get<DataStructure[]>(`database_${i}`)) ?? []).find(
      (data) => data[indexName] === index
    );
    if (data !== undefined) return data;
  }

  // no object had the index
  return undefined;
}

// return all your data. you can also filter only for some data
export async function GetAllData(
  onlyDataWith?: (data: DataStructure) => boolean
): Promise<DataStructure[] | undefined> {
  const size: number = (await KV.get<number>(`databaseKeySize`)) ?? 0;
  let data: DataStructure[] = [];

  // get every key and save the data in a local array
  for (let i: number = 0; i <= size; ++i)
    data = data.concat((await KV.get<DataStructure[]>(`database_${i}`)) ?? []);

  if (onlyDataWith !== undefined) {
    let filteredData: DataStructure[] = [];

    // use all the data and search now the data with the given properties
    for (let i = 0; i < data.length; ++i)
      if (onlyDataWith(data[i])) filteredData.push(data[i]);

    // try return the data
    if (filteredData.length === 0) return undefined;
    else return filteredData;
  }

  // return the data
  if (data.length === 0) return undefined;
  else return data;
}

// change values of data. !!! if index doesn't exist it will do nothing and return false. if new data is over the max byte size it will do nothing and return false. if you change the index, you'll create a new object with new values and old object still is saved
export async function ChangeDataValues(
  index: string,
  newData: (data: DataStructure) => DataStructure
): Promise<boolean> {
  // try get current data
  let data: DataStructure | undefined = await GetData(index);
  if (data === undefined) return false;

  // changes the data if index exist in database
  data = await newData(data);
  if ((await GetSize(data)) > maxByteSize) return false;

  // save updated data
  return await SaveData(data);
}

// reset all the data
export async function ResetDatabase(
  clearTheNamespace: boolean
): Promise<boolean> {
  if (clearTheNamespace === true) await KV.clear();
  return clearTheNamespace;
}

// corrects empty keys
async function DatabaseKeyOrder(): Promise<boolean> {
  let size: number = (await KV.get<number>(`databaseKeySize`)) ?? 0;
  let data: DataStructure[] | undefined;

  for (let i: number = 0; i <= size; ++i) {
    data = await KV.get<DataStructure[]>(`database_${i}`);

    // this key has saved nothing so it should save over things
    if (data === undefined || data.length === 0) {
      for (let y: number = i; y < size; ++y) {
        // puts data from key x+1 in key x
        let newData: DataStructure[] =
          (await KV.get<DataStructure[]>(`database_${y + 1}`)) ?? [];

        await KV.put(`database_${y}`, newData);
      }

      // deletes the empty array which is now the last one and update the size
      await KV.delete(`database_${size}`);
      await KV.put(`databaseKeySize`, --size);

      // restart everything the whole process to check for a second empty key
      await DatabaseKeyOrder();

      return true;
    }
  }
  // didn't changed anything which is good lol
  return false;
}

// get the size in bytes of an object saved as JSON
async function GetSize(data: any): Promise<number> {
  return JSON.stringify(data).length;
}

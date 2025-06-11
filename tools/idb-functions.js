// idb-tools-v1.0.0-modified
// < ========================================================
// < Exported IndexedDB Functions
// < ========================================================

/**
 * Open a database given string name, or create it
 * - If the database exists, the promise returns it
 * - Opens the most recent version of the database
 * - Or creates database version 1 with `default` store
 * @param {string} databaseName - Database name
 * @throws {DOMException} Rejects if database cannot be opened or created
 * @returns {Promise<IDBDatabase>}
 */
export function openDB(databaseName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains('default')) {
                database.createObjectStore('default');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
* Close a database, given a database instance
* @param {IDBDatabase} database - The database instance to close
* @returns {void}
*/
export function closeDB(database) {
    database.close();
}

/**
 * Store a key-value pair in a given store of a database
 * @param {IDBDatabase} database - The opened database instance
 * @param {string} key - The key to store the value at
 * @param {any} value - The value to store
 * @param {string} [storeName='default'] - The name of the store
 * @throws {DOMException} Rejects if the transaction fails or store doesn't exist
 * @returns {Promise<void>}
 */
export function storeInDB(database, key, value, storeName = 'default') {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(value, key);
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Retrieve a value by key from a given store in the database
 * @param {IDBDatabase} database - The opened database instance
 * @param {string} key - The key to retrieve the value for
 * @param {string} [storeName='default'] - The name of the object store
 * @throws {DOMException} Rejects if the transaction fails or store doesn't exist
 * @returns {Promise<any>} Resolves with the retrieved value or undefined if not found
 */
export function getFromDB(database, key, storeName = 'default') {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Quickly open a DB, store a key-value pair, then close the DB
 * @param {string} databaseName - Name of the database
 * @param {string} key - Key to store the value at
 * @param {any} value - Value to store
 * @param {string} [storeName='default'] - Name of the object store
 * @throws {DOMException} If the DB or transaction fails
 * @returns {Promise<void>}
 * @see storeInDB
 */
export async function quickStore(databaseName, key, value, storeName = 'default') {
    const db = await openDB(databaseName);
    try {
        return await storeInDB(db, key, value, storeName);
    } finally {
        closeDB(db);
    }
}

/**
 * Quickly open a DB, get a value by key, then close the DB
 * @param {string} databaseName - Name of the database
 * @param {string} key - Key to retrieve the value for
 * @param {string} [storeName='default'] - Name of the object store
 * @throws {DOMException} If the DB or transaction fails
 * @returns {Promise<any>} The retrieved value or undefined if not found
 * @see getFromDB
 */
export async function quickGet(databaseName, key, storeName = 'default') {
    const db = await openDB(databaseName);
    try {
        return await getFromDB(db, key, storeName);
    } finally {
        closeDB(db);
    }
}
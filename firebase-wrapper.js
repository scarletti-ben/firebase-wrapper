// < ========================================================
// < Imports
// < ========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// < ========================================================
// < Type Definitions
// < ========================================================

/**
 * @typedef {Object} UserCredential
 * @property {User} user
 * @property {string|null} providerId
 * @property {string} operationType
 * @property {Object|null} credential
*/

/**
 * @typedef {Object} User
 * @property {string} uid
 * @property {string|null} email
 * @property {boolean} emailVerified
 * @property {string|null} displayName
 * @property {string|null} photoURL
 * @property {string|null} phoneNumber
 * @property {Array<Object>} providerData
 * @property {function(): Promise<string>} getIdToken
 * @property {function(): Promise<Object>} getIdTokenResult
 * @property {function(): Promise<void>} reload
 * @property {function(Object): Promise<UserCredential>} linkWithCredential
 * @property {function(Object): Promise<UserCredential>} reauthenticateWithCredential
 * @property {function(string): Promise<void>} updateEmail
 * @property {function(string): Promise<void>} updatePassword
 * @property {function(Object): Promise<void>} updateProfile
 * @property {function(): Promise<void>} delete
*/

// > ========================================================
// > Section I : Encryption / IndexedDB Access
// > ========================================================

// < ========================================================
// < Internal Encryptor Object
// < ========================================================

/**
 * A collection of encryption and decryption functions
 * @namespace encryptor
 */
export const encryptor = {

    /**
     * Converts a Base64-encoded string to an ArrayBuffer
     * @param {string} base64String - The Base64-encoded string
     * @returns {ArrayBuffer} The ArrayBuffer
     */
    base64ToArrayBuffer(base64String) {
        var binaryString = window.atob(base64String);
        var intArray = new Uint8Array(binaryString.length);
        for (var i = 0; i < binaryString.length; i++) {
            intArray[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = intArray.buffer;
        return arrayBuffer;
    },

    /**
     * Converts an ArrayBuffer to a Base64-encoded string
     * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer
     * @returns {string} The Base64-encoded string
     */
    arrayBufferToBase64(arrayBuffer) {
        var binaryString = '';
        const intArray = new Uint8Array(arrayBuffer);
        const len = intArray.byteLength;
        for (var i = 0; i < len; i++) {
            binaryString += String.fromCharCode(intArray[i]);
        }
        const base64String = window.btoa(binaryString)
        return base64String;
    },

    /**
     * Derive cryptographic key using PBKDF2 from a given password and salt
     * @param {string} password - The password to derive the key from
     * @param {string} salt - The salt to use for key derivation
     * @returns {Promise<CryptoKey>} The derived CryptoKey object
     */
    async PBKDF2(password, salt) {

        // > Convert password and salt to int array
        const passwordIntArray = new TextEncoder().encode(password);
        const saltIntArray = new TextEncoder().encode(salt);

        // > Define importKey arguments
        var format = "raw";
        var algorithm = { name: "PBKDF2" };
        var extractable = false;
        var keyUsages = ["deriveKey"]

        // > Import key material to create a CryptoKey object
        const keyMaterial = await crypto.subtle.importKey(
            format,
            passwordIntArray,
            algorithm,
            extractable,
            keyUsages
        );

        // > Define deriveKey arguments
        var algorithm = {
            name: "PBKDF2",
            salt: saltIntArray,
            iterations: 100000,
            hash: "SHA-256"
        };
        var derivedKeyType = { name: "AES-GCM", length: 256 };
        var extractable = false;
        var keyUsages = ["encrypt", "decrypt"];

        // > Derive the key using the given arguments
        const cryptoKey = await crypto.subtle.deriveKey(
            algorithm,
            keyMaterial,
            derivedKeyType,
            extractable,
            keyUsages
        );

        return cryptoKey;

    },

    /**
     * Encrypt string using AES-GCM, returning a single cipher data string
     * @param {string} string - The string to encrypt
     * @param {CryptoKey} cryptoKey - The CryptoKey object used for encryption
     * @returns {Promise<{string}>} The ciphertext and iv as a comma-separated Base64-encoded string
     */
    async encrypt(string, cryptoKey) {

        // > Convert string to Uint8Array (byte array)
        const stringByteArray = new TextEncoder().encode(string);

        // > Generate random ArrayBuffer for the initialisation vector
        const ivArrayBuffer = crypto.getRandomValues(new Uint8Array(12));

        // > Define encrypt arguments
        var algorithm = {
            name: "AES-GCM",
            iv: ivArrayBuffer
        };

        // > Encrypt to a ciphertext ArrayBuffer using the given arguments
        const ciphertextArrayBuffer = await crypto.subtle.encrypt(
            algorithm,
            cryptoKey,
            stringByteArray
        );

        // > Convert ciphertext and iv ArrayBuffers to Base64 strings
        const ciphertext64 = encryptor.arrayBufferToBase64(ciphertextArrayBuffer);
        const iv64 = encryptor.arrayBufferToBase64(ivArrayBuffer);

        // > Create comma-separated string of ciphertext and iv and return
        let cipherData = ciphertext64 + ',' + iv64
        return cipherData;

    },

    /**
     * Decrypt Base64 cipherData using AES-GCM, returning original string
     * @param {string} cipherData - Base64-encoded ciphertext and iv as one comma-separated string
     * @param {CryptoKey} cryptoKey - The CryptoKey object used for decryption
     * @returns {Promise<string>} The decrypted string
     */
    async decrypt(cipherData, cryptoKey) {

        // > Split the comma-separated string
        const [ciphertext, iv] = cipherData.split(',');

        // > Convert the Base64 ciphertext and iv back to ArrayBuffers
        const ciphertextArrayBuffer = encryptor.base64ToArrayBuffer(ciphertext);
        const ivArrayBuffer = encryptor.base64ToArrayBuffer(iv);

        // > Define decrypt arguments
        const algorithm = {
            name: "AES-GCM",
            iv: ivArrayBuffer
        };

        // > Decrypt to original string ArrayBuffer
        const stringArrayBuffer = await crypto.subtle.decrypt(
            algorithm,
            cryptoKey,
            ciphertextArrayBuffer
        );

        // > Convert string ArrayBuffer to string and return
        const string = new TextDecoder().decode(stringArrayBuffer);
        return string;

    }

}

// < ========================================================
// < Internal IndexedDB Functions
// < ========================================================

/**
 * Open a database given string name, or create it
 * - If the database exists, the promise returns it
 * - Opens the most recent version of the database
 * - Or creates database version 1 with `default` store
 * @param {string} databaseName - Database name
 * @returns {Promise<IDBDatabase>}
 */
function openDB(databaseName) {
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
 * Store a key-value pair in a given store of a database
 * @param {IDBDatabase} database - The opened database instance
 * @param {string} key - The key to store the value at
 * @param {string} [storeName='default'] - The name of the store
 * @param {any} value - The value to store
 * @returns {Promise<void>}
 */
function storeInDB(database, key, value, storeName = 'default') {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(value, key);
        transaction.oncomplete = () => {
            database.close();
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
 * @returns {Promise<any>} - Resolves with the retrieved value or undefined if not found
 */
function getFromDB(database, key, storeName = 'default') {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// < ========================================================
// < Get Firebase Config Function
// < ========================================================

/**
 * Get the `firebaseConfig` object
 * - Reads from IndexedDB if present
 * - Otherwise prompts the user and runs decryption process
 * - Stores `firebaseConfig` to IndexedDB once decrypted
 * @param {string} appName - Name of the app, for IndexedDB
 * @returns {Promise<object>} The `firebaseConfig` object
 */
async function getFirebaseConfig(appName) {

    // Open the IndexedDB and check for stored firebaseConfig
    const idb = await openDB(appName);
    let firebaseConfig = await getFromDB(idb, 'firebaseConfig');

    // Return firebaseConfig if found, otherwise continue
    if (firebaseConfig) {
        return firebaseConfig;
    }

    try {

        // Read objects.json to retrieve encrypted firebaseConfig
        const response = await fetch('./objects.json');
        const repsonseData = await response.json();
        const encryptedObject = repsonseData['firebaseConfig'];

        // POSTIT: Placeholder method to prompt user for password and salt
        let password = prompt('Enter password...');
        let salt = prompt('Enter salt...');

        // Attempt to decrypt the object
        const cryptoKey = await encryptor.PBKDF2(password, salt);
        const stringObject = await encryptor.decrypt(encryptedObject, cryptoKey);
        firebaseConfig = JSON.parse(stringObject);

        // Store decrypted firebaseConfig object in indexedDB
        await storeInDB(idb, "firebaseConfig", firebaseConfig);

        // Return the decrypted firebaseConfig object
        return firebaseConfig;

    }
    catch (error) {
        
        // Log error and return undefined
        console.error(error);
        return undefined;

    }

}

// > ========================================================
// > Section II : Firebase Wrapper Functionality
// > ========================================================

// < ========================================================
// < Internal Core Object
// < ========================================================

/**
 * Core Firebase state
 * @property {?object} firebaseConfig - The firebaseConfig object
 * @property {?FirebaseApp} app - Initialised Firebase app
 * @property {?Auth} auth - Firebase authentication instance
 * @property {?AuthProvider} provider - Authentication provider (GoogleAuthProvider)
 * @property {?Firestore} database - Firestore database instance
 * @property {?User} user - Current authenticated user
 * @property {boolean} initialised - Flag for Firebase initialisation status
 */
const core = {
    firebaseConfig: null,
    app: null,
    auth: null,
    provider: null,
    database: null,
    user: null,
    initialised: false,
};

// < ========================================================
// < Internal Initialisation Functions
// < ========================================================

/**
 * Aynchronous function to initialise Firebase, and other systems
 * @param {string} appName - Name of the app, influences database paths
 * @throws {Error} If `appName` is not provided
 */
async function init(appName) {

    // Check if Firebase is already initialised
    if (core.initialised) {
        console.warn('Firebase core already initialised, skipping init');
        return;
    }

    // Get firebaseConfig, will prompt user and run decryption process if needed
    core.firebaseConfig = await getFirebaseConfig(appName);
    if (!core.firebaseConfig) {
        console.error('Firebase config is not accessible');
        return;
    }

    // Check if appName is provided
    if (!appName) {
        console.error('Firebase core not initialised, appName is required');
        return;
    }

    // Set core object attributes
    core.app = initializeApp(core.firebaseConfig, appName)
    core.auth = getAuth(core.app);
    core.provider = new GoogleAuthProvider();
    core.database = getFirestore(core.app);

    // Update core.user when user logs in
    authentication.onLogin((user) => {
        core.user = user;
        console.log('User logged in')
    });

    // Update core.user when user logs out
    authentication.onLogout(() => {
        core.user = null;
        console.log('User logged out')
    });

    // Set core.initialised to true
    core.initialised = true;

    // Log success message
    console.log('Firebase core initialised successfully');

}

// < ========================================================
// < Internal Firestore Functions
// < ========================================================

/**
 * Base collection path for the current app as a string array
 * - Collection path at users/{userId}/apps/{appName}
 * @returns {string[]} String array of path segments
 */
function basePath() {
    return [
        'users', core.user.uid,
        'apps', core.app.name
    ];
}

/**
 * Shallow collection path within the current app as a string array
 * - Collection path at users/{userId}/apps/{appName}/{collectionName}
 * @param {string} collectionName - Collection name to build collection path
 * @returns {string[]} String array of path segments
 */
function shallowCollectionPath(collectionName) {
    return [...basePath(), collectionName];
}

/** 
 * Shallow collection reference within the current app
 * - Collection reference at users/{userId}/apps/{appName}/{collectionName}
 * @param {string} collectionName - Collection name to build collection reference
 * @returns {CollectionReference} Firestore collection reference
 */
function shallowCollectionReference(collectionName) {
    const collectionPath = shallowCollectionPath(collectionName);
    return collection(core.database, ...collectionPath);
}

/** 
 * Shallow document path within the current app as a string array
 * - Document path at users/{userId}/apps/{appName}/{collectionName}/{documentName}
 * @param {string} collectionName - Collection name to build document path
 * @param {string} documentName - Document name to build document path
 * @returns {string[]} String array of path segments
 */
function shallowDocumentPath(collectionName, documentName) {
    return [...shallowCollectionPath(collectionName), documentName];
}

/** 
 * Shallow document reference within the current app
 * - Document reference at users/{userId}/apps/{appName}/{collectionName}/{documentName}
 * @param {string} collectionName - Collection name to build document reference
 * @param {string} documentName - Document name to build document reference
 * @returns {DocumentReference} Firestore document reference
 */
function shallowDocumentReference(collectionName, documentName) {
    const documentPath = shallowDocumentPath(collectionName, documentName)
    return doc(core.database, ...documentPath);
}

// < ========================================================
// < Exported Initialisation Object
// < ========================================================

/** Firebase initialisation functions */
export const initialisation = {
    init
}

// < ========================================================
// < Exported Authentication Object
// < ========================================================

/** Firebase authentication functions */
export const authentication = {

    /** 
     * Login function using Google oAuth 2.0 authentication
     * - Important: This function can only be used via a button click event
     * - Uses `signInWithPopup` from `firebase-auth`
     * @returns {Promise<UserCredential>} Promise that resolves with user credentials
     */
    async login() {
        return await signInWithPopup(core.auth, core.provider);
    },

    /**
     * Logout function using Google oAuth 2.0 authentication
     * - `core.user` will be set to null via `onAuthStateChanged`, triggered after logout
     * - Uses `signOut` from `firebase-auth`
     * @returns {Promise<void>} Promise that resolves when the user is logged out
     */
    async logout() {
        return await signOut(core.auth);
    },

    /**
     * Add callback to be called when the user logs in
     * - Does not overwrite previous callbacks
     * - Uses `onAuthStateChanged` from `firebase-auth`
     * @param {function(User): void} callback - Function to be called when user logs in
     */
    onLogin(callback) {
        onAuthStateChanged(core.auth, (user) => {
            if (user) {
                callback(user);
            }
        });
    },

    /**
     * Add callback to be called when the user logs out
     * - Does not overwrite previous callbacks
     * - Uses `onAuthStateChanged` from `firebase-auth`
     * @param {function(): void} callback - Function to be called when user logs out
     */
    onLogout(callback) {
        onAuthStateChanged(core.auth, (user) => {
            if (!user) {
                callback();
            }
        });
    },

    /**
     * Check if there is an authenticated user logged in
     * @returns {boolean} True if an authenticated user is logged in
     */
    isAuthenticated() {
        return core.user !== null;
    }

}

// < ========================================================
// < Exported Firestore Object
// < ========================================================

/** Firebase firestore functions */
export const firestore = {

    /** 
     * Write data to a document, given collection name and document name
     * - By default this will update the given fields, or create a new document
     * - If replace is `true` the entire document will be replaced by new data
     * - Document path at users/{userId}/apps/{appName}/{collectionName}/{documentName}
     * @param {string} collectionName - Collection name to build document reference
     * @param {string} documentName - Document name to build document reference
     * @param {object} documentData - Key-value data object to store in the document
     * @param {?boolean} replace - Whether to replace the entire document (default is false)
     * @returns {Promise<void>} Promise that resolves when written successfully
     */
    async writeDocument(collectionName, documentName, documentData, replace = false) {

        // Build document reference
        const documentReference = shallowDocumentReference(collectionName, documentName);

        // Write document data using document reference
        return await setDoc(documentReference, documentData, { merge: !replace });

    },

    /** 
     * Update data in an existing document, given collection name and document name
     * - Does not replace the entire document, only updates given fields
     * - Document path at users/{userId}/apps/{appName}/{collectionName}/{documentName}
     * @param {string} collectionName - Collection name to build document reference
     * @param {string} documentName - Document name to build document reference
     * @param {object} documentData - Key-value data object to update in the document
     * @returns {Promise<void>} Promise that resolves when updated successfully
     * @throws {FirebaseError} Throws an error if the document does not exist
     */
    async updateDocument(collectionName, documentName, documentData) {

        // Build document reference
        const documentReference = shallowDocumentReference(collectionName, documentName);

        // Update document data using document reference
        return await updateDoc(documentReference, documentData);

    },

    /**
     * Read data from a document, given collection name and document name
     * - Document path at users/{userId}/apps/{appName}/{collectionName}/{documentName}
     * @param {string} collectionName - Collection name to build document reference
     * @param {string} documentName - Document name to build document reference
     * @returns {Promise<?object>} Promise that resolves with document data
     */
    async readDocument(collectionName, documentName) {

        // Build document reference
        const documentReference = shallowDocumentReference(collectionName, documentName);

        // Read document data using the document reference and return
        const snapshot = await getDoc(documentReference);
        return snapshot.exists() ? snapshot.data() : null;

    },

    /**
     * Delete a document, given collection name and document name
     * - Document path at users/{userId}/apps/{appName}/{collectionName}/{documentName}
     * @param {string} collectionName - Collection name to build document reference
     * @param {string} documentName - Document name to build document reference
     * @returns {Promise<void>} Promise that resolves when deleted
     */
    async deleteDocument(collectionName, documentName) {

        // Build document reference
        const documentReference = shallowDocumentReference(collectionName, documentName);

        // Delete document using the document reference and return
        return await deleteDoc(documentReference);

    },

    /**
     * Read all documents from a collection, given collection name
     * - Collection path at users/{userId}/apps/{appName}/{collectionName}
     * @param {string} collectionName - Collection name to build collection reference
     * @returns {Promise<Object[]>} Promise that resolves with an array of all document data
     */
    async readCollection(collectionName) {

        // Build collection reference
        const collectionReference = shallowCollectionReference(collectionName);

        // Read all documents using the collection reference and return
        const snapshot = await getDocs(collectionReference);
        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return documents;

    },

}
// firebase-wrapper-v1.0.0-modified
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
// < Type Definitions for Reference
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

// ^^ =======================================================
// ^^ Internal Core Object
// ^^ =======================================================

/**
 * Core Firebase object for globally accessible attributes
 * @property {?FirebaseApp} app - Initialised Firebase app
 * @property {?Auth} auth - Firebase authentication instance
 * @property {?AuthProvider} provider - Authentication provider (GoogleAuthProvider)
 * @property {?Firestore} database - Firestore database instance
 * @property {?User} user - Current authenticated user
 * @property {boolean} initialised - Flag for Firebase initialisation status
 */
const core = {
    app: null,
    auth: null,
    get user() {
        return core.auth?.currentUser;
    },
    provider: null,
    database: null,
    initialised: false,
};

// < ========================================================
// < Exported Initialisation Object
// < ========================================================

/** Firebase initialisation functions */
export const initialisation = {

    /**
     * Function to initialise Firebase, and other systems
     * - Will automatically sign in recent user if possible
     * @param {string} appName - Name of the app, influences database paths
     * @throws If arguments not provided, or due to an issue initialising
     * @returns {void}
     */
    init(appName, firebaseConfig) {

        // Check if Firebase is already initialised
        if (core.initialised) {
            let message = 'Firebase core already initialised, skipping init';
            console.log(message);
            return;
        }

        // Check if appName and firebaseConfig are provided
        if (!appName || !firebaseConfig) {
            let message = 'Firebase core not initialised, both appName and firebaseConfig are required arguments';
            throw new Error(message);
        }

        try {

            // Set core object attributes
            core.app = initializeApp(firebaseConfig, appName);
            core.auth = getAuth(core.app);
            core.provider = new GoogleAuthProvider();
            core.database = getFirestore(core.app);

            // Set core.initialised flag if no errors
            core.initialised = true;

            // Log success message
            console.log('Firebase core initialised successfully');

        } catch (error) {
            console.error('Firebase core not initialised:', error);
            throw error;
        }

    },

    /**
     * Check if the core object is initialised
     * @returns {boolean} Value of core.initialised flag
     */
    isInitialised() {
        return core.initialised;
    }

}

// < ========================================================
// < Exported Authentication Object
// < ========================================================

/** Firebase authentication functions */
export const authentication = {

    /** 
     * Login function using current authentication provider
     * - Important: This function can only be used via a button click event
     * - Uses `signInWithPopup` from `firebase-auth`
     * @returns {Promise<UserCredential>} Promise that resolves with user credentials
     */
    async login() {
        return await signInWithPopup(core.auth, core.provider);
    },

    /**
     * Logout function using current authentication provider
     * - `core.user` will be set to null via `onAuthStateChanged`, triggered after logout
     * - Uses `signOut` from `firebase-auth`
     * @returns {Promise<void>} Promise that resolves when the user is logged out
     */
    async logout() {
        return await signOut(core.auth);
    },

    /**
     * Add callback to be called when the user login state changes
     * - Does not overwrite previous callbacks
     * - Uses `onAuthStateChanged` from `firebase-auth`
     * @param {function(User): void} callback - Function to be called when login state changes
     * @returns {function(): void} Unsubscribe function to stop listening
     */
    onChange(callback) {
        return onAuthStateChanged(core.auth, (user) => {
            callback(user);
        });
    },

    /**
     * Add callback to be called when the user logs in
     * - Does not overwrite previous callbacks
     * - Uses `onAuthStateChanged` from `firebase-auth`
     * @param {function(User): void} callback - Function to be called when user logs in
     * @returns {function(): void} Unsubscribe function to stop listening
     */
    onLogin(callback) {
        return onAuthStateChanged(core.auth, (user) => {
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
     * @returns {function(): void} Unsubscribe function to stop listening
     */
    onLogout(callback) {
        return onAuthStateChanged(core.auth, (user) => {
            if (!user) {
                callback();
            }
        });
    },

    /**
     * Check if there is a user logged in
     * @returns {boolean} True if a user is logged in
     */
    isLoggedIn() {
        return Boolean(core.user);
    }

}

// ^^ =======================================================
// ^^ Internal Firestore Functions
// ^^ =======================================================

/**
 * Base collection path for the current app as a string array
 * - Collection path at users/{userId}/apps/{appName}
 * @throws If user is not signed in
 * @returns {string[]} String array of path segments
 */
function basePath() {
    if (!core.initialised || !core.user) {
        let message = 'Base path cannot be generated, user is not logged in';
        throw new Error(message);
    }
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
// < Exported Firestore Object
// < ========================================================

/** Thin wrapper for interacting with firestore database 
 * - For best results, methods should be called within a try / catch block
*/
export const firestore = {

    /** 
     * Write data to a document, given collection name and document name
     * - By default this will update the given fields, or create a new document
     * - If replace is `true` the entire document will be replaced by new data
     * - Document path at users/{userId}/apps/{appName}/{collectionName}/{documentName}
     * @param {string} collectionName - Collection name to build document reference
     * @param {string} documentName - Document name to build document reference
     * @param {object} documentData - Key-value data object to store in the document
     * @param {boolean=false} replace - Whether to replace the entire document (default is false)
     * @throws For authentication issues, network errors, or the data is invalid
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
     * @throws For authentication issues, network errors, or if the document does not exist
     * @returns {Promise<void>} Promise that resolves when updated successfully
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
     * @throws For authentication issues or network errors
     * @returns {Promise<?object>} Promise that resolves with document data, or null if the document does not exist
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
     * @throws For authentication issues or network errors
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
     * @throws For authentication issues or network errors
     * @returns {Promise<Object[]>} Promise that resolves with an array of all document data
     */
    async readCollection(collectionName) {

        // Build collection reference
        const collectionReference = shallowCollectionReference(collectionName);

        // Read all documents using the collection reference and return
        const snapshot = await getDocs(collectionReference);
        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return documents;

    }

}
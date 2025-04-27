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

// < ========================================================
// < Internal Firebase Configuration Object
// < ========================================================

const firebaseConfig = {
    apiKey: "AIzaSyAx5VIksX5JeW2hk5FDf_8rhyBa6CibH84",
    authDomain: "mainframe-storage.firebaseapp.com",
    projectId: "mainframe-storage",
    storageBucket: "mainframe-storage.firebasestorage.app",
    messagingSenderId: "432631138940",
    appId: "1:432631138940:web:ae5059b05db6b3e09317f9",
    measurementId: "G-LXYPVDN1K4"
};

// < ========================================================
// < Internal Core Object
// < ========================================================

/**
 * Core Firebase state
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
    provider: null,
    database: null,
    user: null,
    initialised: false,
};

// < ========================================================
// < Internal Initialisation Functions
// < ========================================================

/**
 * Initialise Firebase
 * @param {string} appName - Name of the app, influences database paths
 * @returns {void}
 * @throws {Error} If `appName` is not provided
 */
function init(appName) {

    // Check if Firebase is already initialised
    if (core.initialised) {
        console.warn('Firebase core already initialised, skipping init');
        return;
    }

    // Check if appName is provided
    if (!appName) {
        console.error('Firebase core not initialised, appName is required');
        return;
    }

    // Set core object attributes
    core.app = initializeApp(firebaseConfig, appName)
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
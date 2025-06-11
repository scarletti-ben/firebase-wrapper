// < ========================================================
// < Imports
// < ========================================================

import {
    tools
} from './tools/my-tools.js';

import {
    initialisation,
    authentication,
    firestore
} from './tools/firebase-wrapper.js';

import {
    openDB,
    getFromDB,
    storeInDB,
    closeDB,
    quickGet,
    quickStore
} from './tools/idb-functions.js';

// < ========================================================
// < Element Queries
// < ========================================================

const page = document.getElementById('page');
const loginButton = document.getElementById('login-button');
let decryptButton = document.getElementById('decrypt-button');
const contentFrame = document.getElementById('content-frame');
const errorFrame = document.getElementById('error-frame');

// ! ========================================================
// ! Experimental
// ! ========================================================

const noteContainer = document.getElementById('note-container');
const noteText = noteContainer.querySelector('.note-text');
const noteTitle = noteContainer.querySelector('.note-title');
const noteTags = noteContainer.querySelector('[data-field="tags"]');
const noteActions = noteContainer.querySelector('.note-actions');
const noteUUID = noteContainer.querySelector('[data-field="uuid"]');
const noteDate = noteContainer.querySelector('[data-field="date"]');

// < ========================================================
// < Declarations
// < ========================================================

/**
 * Application name for Firebase / IndexedDB interaction
 * @constant {string}
 */
const APP_NAME = 'firebase-wrapper';

/**
 * Collection name for Firebase / Firestore interaction
 * @constant {string}
 */
const COLLECTION_NAME = 'notes';

/** 
 * Firebase configuration object, null until loaded 
 * @type {Object|null} 
 */
let firebaseConfig = null;

// < ========================================================
// < "Check Functions"
// < ========================================================

/**
 * Check if firebaseConfig is accessible
 * - First checks if the variable for firebaseConfig is already set
 * - Otherwise search IndexedDB for firebaseConfig
 * - Pipes errors to showError
 * @returns {Promise<boolean>} True if firebaseConfig is accessible
 */
async function checkSiteUnlocked() {

    // Return true if firebaseConfig is already set
    if (firebaseConfig) {
        return true;
    }

    try {

        // Search for firebaseConfig in IndexedDB
        const result = await quickGet(APP_NAME, 'firebaseConfig');
        if (result) {
            firebaseConfig = result;
            return true;
        }

        return false;

    } catch (error) {

        showError(error);
        return false;

    }

}

// < ========================================================
// < Decryption Functions
// < ========================================================

/**
 * Load and decrypt firebaseConfig from `objects.json`
 * - Prompts user for password and salt
 * - Stores decrypted config in IndexedDB for future use
 * @returns {Promise<boolean>} True if decryption succeeds
 * @throws Error when decrypting or accessing files
 */
async function decryptFirebaseConfig() {

    try {

        // Read objects.json to retrieve encrypted firebaseConfig
        const response = await fetch('./objects.json');
        const repsonseData = await response.json();
        const encryptedObject = repsonseData['firebaseConfig'];

        // Placeholder method to prompt user for password and salt
        let password = prompt('Enter password...');
        let salt = prompt('Enter salt...');
        if (!password || !salt) {
            throw new Error("PromptEmtpy");
        }

        // Attempt to decrypt the object
        const cryptoKey = await tools.PBKDF2(password, salt);
        const stringObject = await tools.decrypt(encryptedObject, cryptoKey);

        // Set the global value of firebaseConfig
        firebaseConfig = JSON.parse(stringObject);
        console.log('firebaseConfig set');

        // Store decrypted firebaseConfig object in indexedDB
        await quickStore(APP_NAME, "firebaseConfig", firebaseConfig);
        console.log('firebaseConfig stored in IndexedDB');

    } catch (error) {

        // Give context to the error
        let message = "DecryptionError";
        console.error(message, error);
        throw new Error(message, { cause: error });

    }

}
// < ========================================================
// < Handling Functions
// < ========================================================

/**
 * Handle decrypt button click event
 * - Attempts to decrypt firebaseConfig
 * @throws If there is an error in decryption or setup
 * @returns {void}
 */
async function handleDecryptButton() {
    try {
        await decryptFirebaseConfig();
        removeDecryptButton();
        setupUnlocked();
    } catch (error) {
        showError(error);
    }
}

/**
 * Handle login button click event
 * - Attempts to log the user in
 * @throws If there is an error in initialisation or login
 * @returns {void}
 */
async function handleLoginButton() {

    try {

        // Check if user is logged in
        if (authentication.isLoggedIn()) {
            console.log('User already logged in');
            return;
        }

        // Attempt initialisation, skips if already initialised
        initialisation.init(APP_NAME, firebaseConfig);

        // Delay 2s to allow automatic login to finish
        await tools.delay(2000);

        // Check if user is logged in
        if (authentication.isLoggedIn()) {
            console.log('User already logged in');
            return;
        } else {
            // Attempt to open login popup
            await authentication.login();
        }

    } catch (error) {

        // Give context to the error
        let message = "LoginError";
        console.error(message, error);
        showError(error);

    }

}

// < ========================================================
// < UI Functions
// < ========================================================

/**
 * Remove the decrypt button from the DOM
 * - Safe to call multiple times
 */
function removeDecryptButton() {
    if (decryptButton) {
        decryptButton.remove();
        decryptButton = null;
    }
}

/**
 * Display error message to the user
 * - Shows error frame and hides content frame
 * @param {Error|string} error - Error object or message to display
 */
function showError(error) {

    // Get string message
    let message = 'Unknown error';
    if (typeof error === 'string') {
        message = error;
    } else if (error instanceof Error) {
        message = `Error "${error.message}"`
        if (error.cause) {
            message += ` was caused by "${error.cause}"`
        }
    }

    // Hide content frame and show error frame
    contentFrame.classList.add('hidden');
    errorFrame.classList.remove('hidden');

    // Add string message to error frame
    const element = document.getElementById('error-message');
    const p = element.querySelector('p');
    p.textContent = `${message}`;

}

// < ========================================================
// < Setup Functions
// < ========================================================

/**
 * Setup for site in the "unlocked" state
 * - Initialises Firebase and sets up login functionality
 * @throws {Error} If initialisation is unsuccessful
 */
function setupUnlocked() {

    // Attempt initialisation
    initialisation.init(APP_NAME, firebaseConfig);

    // Add callback to show site on login
    const unsubscribe = authentication.onLogin((user) => {

        // Show the content frame
        contentFrame.classList.remove('hidden');

        // Show profile picture
        const icon = document.querySelector('#login-button .icon svg');
        const img = document.createElement('img');
        img.src = user.photoURL;
        img.alt = 'Image';
        icon.replaceWith(img);

        // Remove listener
        unsubscribe();

    });

    // Add functionality to the login button
    loginButton.addEventListener('click', handleLoginButton);

    // ! ========================================================
    // ! Experimental
    // ! ========================================================

    // Generate uuid for the note
    noteUUID.value = crypto.randomUUID();

    // Set current date
    initDateElement(noteDate);

    // Add the upload button
    let uploadButton = createButton('Upload', async (event) => {

        let noteObject = getNoteObject();
        let success = await safeUpload(noteObject);
        alert(`Success: ${success}`);

    }, noteActions);

    // Add the debug button
    let debugButton = createButton('Debug', async (event) => {

        let object = getNoteObject();
        let message = JSON.stringify(object, null, 2);

        try {
            checkNoteObject(object);
            message += `\n\nChecks passed`;
        } catch (error) {
            message += `\n\n${error.message}`;
        }

        console.log(message);
        alert(message);

    }, noteActions);

    // Add the history button
    let historyButton = createButton('History', async (event) => {

        let result = await firestore.readCollection(COLLECTION_NAME);
        result.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        tools.openObjectAsPage(result);

    }, noteActions);

}

/**
 * Setup for site in the "locked" state
 * - Sets up decrypt button functionality
 */
function setupLocked() {

    // Add functionality to the decrypt button
    decryptButton.addEventListener('click', handleDecryptButton);

}

// ! ========================================================
// ! Experimental
// ! ========================================================

/**
 * Create a div button, with label and callback
 * @param {string} text - The text to display on the button
 * @param {Function} callback - The function to execute when the button is clicked
 * @param {HTMLElement} [parent] - Optional parent element to append to
 * @returns {HTMLDivElement} The created button div element
 */
function createButton(text, callback, parent) {
    const button = document.createElement('div');
    button.classList.add('button');
    button.textContent = text;
    button.addEventListener('click', callback);
    if (parent) {
        parent.appendChild(button);
    }
    return button;
}

/**
* Initialise date input to current date and time and add validation
* - Format: YYYY-MM-DDTHH:MM
* @param {HTMLInputElement} dateElement - The date input element
*/
function initDateElement(dateElement) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    // dateElement.value = `${year}-${month}-${day}`;
    dateElement.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get values from note fields as object
 * @returns {{title: string, text: string, date: string, tags: string[], uuid: string}} Note object
 */

function getNoteObject() {
    let noteObject = {
        title: noteTitle.value,
        text: noteText.value,
        date: noteDate.value,
        tags: noteTags.value.split(',').map(tag => tag.trim()),
        uuid: noteUUID.value,
    }
    return noteObject;
}

/**
 * Check note object to ensure all required fields are valid
 * @param {Object} noteObject - The note object to check
 * @throws If check fails
 */
function checkNoteObject(noteObject) {

    // Empty string array for errors
    const errors = [];

    // Check if noteObject exists
    if (!noteObject || typeof noteObject !== 'object') {
        throw new Error('Note object is required');
    }

    // Check title is not empty
    if (!noteObject.title || noteObject.title.trim() === '') {
        errors.push('Title cannot be empty');
    }

    // Check text is not empty
    if (!noteObject.text || noteObject.text.trim() === '') {
        errors.push('Text cannot be empty');
    }

    // Check UUID is not empty
    if (!noteObject.uuid || noteObject.uuid.trim() === '') {
        errors.push('UUID cannot be empty');
    }

    // Check date is not empty and is valid format
    if (!noteObject.date || noteObject.date.trim() === '') {
        errors.push('Date cannot be empty');
    } else {
        // Validate date format and check if it's not in the future
        const dateObj = new Date(noteObject.date);
        const now = new Date();

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            errors.push('Date must be in a valid format');
        } else if (dateObj > now) {
            errors.push('Date cannot be in the future');
        }
    }

    // Tags check (tags array can be empty, but should be an array)
    if (noteObject.tags && !Array.isArray(noteObject.tags)) {
        errors.push('Tags must be an array');
    }

    // Throw if any errors found
    if (errors.length > 0) {
        throw new Error(`Checks failed: ${errors.join(', ')}`);
    }
}

/**
 * Upload note object to Firestore safely
 * - Runs checks before upload
 * - Catches errors and logs warning
 * @param {Object} noteObject - Object to upload
 * @returns {Promise<boolean>} True if upload succeeds
 */
async function safeUpload(noteObject) {

    try {

        checkNoteObject(noteObject);

        await firestore.writeDocument(COLLECTION_NAME, noteObject.uuid, {
            uuid: noteObject.uuid,
            title: noteObject.title,
            text: noteObject.text,
            tags: noteObject.tags,
            created: noteObject.date,
            modified: noteObject.date
        });
        return true;

    } catch (error) {
        console.warn('SafeUpload:', error);
        return false;
    }
}

// < ========================================================
// < Entry Point
// < ========================================================

/**
 * Entry point for site setup
 * - Checks if firebaseConfig is available
 * - Sets up site in locked or unlocked state
 * - Pipes errors to showError
 * @see showError
 * @returns {void}
 */
async function main() {

    try {

        let siteUnlocked = await checkSiteUnlocked();
        if (siteUnlocked) {
            removeDecryptButton();
            setupUnlocked();
        } else {
            decryptButton.classList.remove('hidden');
            setupLocked();
        }

    } catch (error) {
        showError(error);
    }

}

// < ========================================================
// < Execution
// < ========================================================

main();
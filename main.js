// < ========================================================
// < Imports
// < ========================================================

import { initialisation, authentication, firestore } from "./firebase-wrapper.js";

import *  as firebase from "./firebase-wrapper.js";
firebase.initialisation
firebase.authentication
firebase.firestore

// < ========================================================
// < HTML Queries
// < ========================================================

const noteContainer = document.getElementById('scrollable-content');
const addNoteButton = document.getElementById('add-note-button');
const userIcon = document.getElementById('user-icon');

// ! ========================================================
// ! Firebase Wrapper Initialisation and Aliasing
// ! ========================================================

// Initialise Firebase with app name
initialisation.init('test-app');

// Add example callbacks
authentication.onLogin((user) => {
    const profilePicture = user.photoURL;
    console.log('User profile picture:', profilePicture);
})
authentication.onLogout(() => {
    console.log('User logged out');
})

// < ========================================================
// < Note Class - Connected Objects and HTML Elements
// < ========================================================

class Note {

    /** @type {HTMLElement} The HTML element representing the note */
    element;

    /**
     * Create note instance, for connected objects and elements
     * @param {string} uuid - The UUID of the note
     * @param {string} title - The title of the note
     * @param {string} content - The content of the note
     * @param {string[]} tags - The tags of the note
     * @param {number} created - The creation timestamp of the note
     * @param {number} modified - The last modified timestamp of the note
     */
    constructor(uuid, title, content, tags, created, modified) {
        this.uuid = uuid;
        this.title = title;
        this.content = content;
        this.tags = tags;
        this.created = created;
        this.modified = modified;
        this.element = document.createElement('div');
        this.titleElement = document.createElement('h2');
        this.contentElement = document.createElement('p');
        this.tagsElement = document.createElement('p');
        this.actionsElement = document.createElement('div');
        this.init();
    }

    /**
     * Initialise connected note elements
     */
    init() {

        // Initialise the note element and connected elements
        this.element.classList.add('note');
        this.element.title = `Note UUID: ${this.uuid}`;
        this.titleElement.classList.add('note-title');
        this.contentElement.classList.add('note-content');
        this.titleElement.textContent = this.title;
        this.contentElement.textContent = this.content;
        this.tagsElement.classList.add('note-tags');
        this.tagsElement.textContent = `Tags: ${this.tags.join(', ')}`
        this.actionsElement.classList.add('note-actions');
        this.editButton = document.createElement('button');
        this.editButton.textContent = 'Edit';
        this.deleteButton = document.createElement('button');
        this.deleteButton.textContent = 'Delete';

        // Add event listener for the edit button
        this.editButton.addEventListener('click', async () => {
            const title = prompt('Edit new note title:');
            await firestore.updateDocument('notes', this.uuid, { title });
        });

        // Add event listener for the delete button
        this.deleteButton.addEventListener('click', async () => {
            firestore.deleteDocument('notes', this.uuid).then(() => {
                console.log('Note deleted successfully');
                this.element.remove();
            }).catch((error) => {
                console.error('Error deleting note:', error);
            });
        });

        // Append elements to the corresponding parent element
        this.actionsElement.appendChild(this.editButton);
        this.actionsElement.appendChild(this.deleteButton);
        this.element.appendChild(this.titleElement);
        this.element.appendChild(this.contentElement);
        this.element.appendChild(this.tagsElement);
        this.element.appendChild(this.actionsElement);

    }

}

// < ========================================================
// < Toolbar Class
// < ========================================================

/** Toolbar class that has methods to add functional buttons */
class Toolbar {

    /** @type {HTMLElement} The HTML element representing the toolbar */
    element;

    /**
     * Create a toolbar instance
     * @throws {Error} Throws an error if the toolbar element is not found in the DOM
     */
    constructor() {
        this.element = document.getElementById('toolbar');
        if (!this.element) {
            throw new Error('Element with ID "toolbar" not found in the DOM');
        }
    }

    /**
     * Add a button to the toolbar, with label and callback
     * @param {string} label - The text to display on the button
     * @param {Function} callback - The function to execute when the button is clicked
     * @returns {HTMLButtonElement} The created button element
     */
    addButton(label, callback) {
        const button = document.createElement('button');
        button.classList.add('toolbar-button');
        button.textContent = label;
        button.addEventListener('click', callback);
        this.element.appendChild(button);
        return button;
    }

}

// < ========================================================
// < Utility Functions
// < ========================================================

/**
 * Adds a new note to the notes container
 * @param {string} uuid - The UUID of the note
 * @param {string} title - The title of the note
 * @param {string} content - The content of the note
 * @param {string[]} tags - The tags of the note
 * @return {Note} The created note instance
 * */
function createNote(uuid, title, content, tags) {
    let created = Date.now();
    let modified = Date.now();
    const note = new Note(uuid, title, content, tags, created, modified);
    noteContainer.appendChild(note.element);
    return note;
}

// < ========================================================
// < Staging
// < ========================================================

/** @type {Note[]} */
const notes = [];

// < ========================================================
// < Entry Point
// < ========================================================

async function main() {

    // Create Toolbar instance
    let toolbar = new Toolbar();

    toolbar.addButton('Login', async () => {
        let credentials = await authentication.login();
        // console.log(credentials);
    })

    toolbar.addButton('Logout', async () => {
        await authentication.logout();
    })

    toolbar.addButton('Read', async () => {
        const noteUUID = prompt('Enter note UUID to read:');
        const noteData = await firestore.readDocument('notes', noteUUID);
        console.log(noteData);
    });

    toolbar.addButton('Write', async () => {
        const noteUUID = prompt('Enter note UUID to write:');
        const noteTitle = prompt('Enter note title:');
        const noteContent = prompt('Enter note content:');
        const noteTags = prompt('Enter note tags (comma separated):').split(',').map(tag => tag.trim());
        const noteData = {
            uuid: noteUUID,
            title: noteTitle,
            content: noteContent,
            tags: noteTags,
            created: Date.now(),
            modified: Date.now()
        };
        await firestore.writeDocument('notes', noteUUID, noteData).then(() => {
            console.log('Note written successfully');
        }).catch((error) => {
            console.error('Error writing note:', error);
        });
    });

    toolbar.addButton('Read All', async () => {
        await firestore.readCollection('notes').then((notes) => {
            console.log('Notes:', notes);
            notes.forEach(note => {
                createNote(note.uuid, note.title, note.content, note.tags);
            });
        });
    });

}

// < ========================================================
// < Execution
// < ========================================================

main()
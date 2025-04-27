# Overview
The primary aim of this repository is to create my own "wrapper" for `Firebase` / `Cloud Firestore` API functionality. It is tailored for use with my `Firebase` project named `mainframe-storage` which is set up for `Firestore` database usage and `Google oAuth 2.0` authentication. I set up the `Firebase` project as a learning process but also intend to use it across many applications as the central database for user data.

There will also be a `GitHub Pages` static site within this repository for testing the wrapper, you can access the site [here](https://scarletti-ben.github.io/firebase-wrapper/)

The plan is to also add a `psuedo-api` at https://scarletti-ben.github.io/firebase-wrapper/api, which sites can use via an `iframe`, and is essentially publically exposed part of the `Firestore` database of `mainframe-storage` that allows limited `write` access

> [!IMPORTANT]
> - This project exposes a public api key for `Firebase`, which is used for identifying the `Firebase` you are connecting to, all security and authentication is handled via `Firestore` rules and `Google` authentication
> - It is probably best to avoid exposing even "safe" public keys to the client. Whilst data should be safe behind server-side authentication checks, and user defined rules such as `Firestore` rules, it is not impossible that it could be used to make excess requests to your `Firebase` components
> - This `Firebase` project is connected to a free `Spark` tier account where it is impossible to incur costs

# Aims
The aims for the project are as follows
- A user should be authenticated via `Sign in with Google`
- An authenticated user should be able to read and write their personal data
- An authenticated user should be able to read and write application data for the specific app they are currently using
- The syntax of `firebase-wrapper.js` should be clear and concise and give easier access to common `Firebase` tools

# Usage 

## Using `firebase-wrapper.js`
You can use the file locally or via `CDN`, in both cases you will want to define an app name. The reason for this is that `mainframe-storage` has its `Firestore` set up such that users have data for each app they use stored under `users/{userName}/apps/{appName}`, and the app name we define controls where data is stored and read from. Let us assume that we have `const appName = 'test-app'` for the snippets below

Let us also assume that we have some test document data as the constant `documentData`
```javascript
const documentData = {
    uuid: crypto.randomUUID(),
    title: 'title',
    content: 'content',
    tags: ['tag1', 'tag2'],
    created: Date.now(),
    modified: Date.now()
};
```

### Local Usage
Inside your main `JavaScript` file, `main.js` for instance, you can import from `firebase-wrapper.js` in one of two ways
1) Import individual objects via `import { initialisation, authentication, firestore } from "./firebase-wrapper.js";`
    - Initialisation would then be done via `initialisation.init(appName)`
2) Import as a namespace via `import *  as firebase from "./firebase-wrapper.js"`
    - Initialisation would then be done via `firebase.initialisation.init(appName)`

In the snippet below we use the first method, the snippet is not an exhaustive list of the features of `firebase-wrapper` but shows the basics
```javascript
// Import objects from firebase-wrapper.js
import { initialisation, authentication, firestore } from "./firebase-wrapper.js";

// Initialise Firebase with app name
initialisation.init(appName);

// Add login functionality to an HTML button
loginButtonElement.addEventListener('click', async () => {
    let credentials = await authentication.login();
    console.log(credentials);
})

// Add logout functionality to an HTML button
logoutButtonElement.addEventListener('click', () => {
    authentication.logout();
})

// Add example callback that listens for successful user login
authentication.onLogin((user) => {
    console.log('User logged out');
})

// Add example callback that listens for successful user logout
authentication.onLogout(() => {
    console.log('User logged out');
})

// Write document at users/{userName}/apps/test-app/test-collection/{documentUUID}
firestore.writeDocument('test-collection', documentData.uuid, documentData)
```

### CDN Usage
Whilst you can add the `CDN` link directly to the `<head>` of your `HTML` file, and automatically gain access to the exported objects, `initialisation`, `authentication`, and `firestore`. It is probably best practice to import within your `JavaScript` file, as seen below

```javascript
// Import individual objects
import { initialisation, authentication, firestore }  from 'https://scarletti-ben.github.io/firebase-wrapper/firebase-wrapper.js';

// Alternatively: Import as namespace
import *  as firebase from 'https://scarletti-ben.github.io/firebase-wrapper/firebase-wrapper.js'
```

Once you have imported `firebase-wrapper.js` you can use it much the same as you would in a local environment, albeit with no code completion from your `IDE`

#### CDN Links

If you are accessing the file via a GitHub Pages link you can expect to be using the latest version of the file as they exist on the main branch of the repository
- https://scarletti-ben.github.io/firebase-wrapper/firebase-wrapper.js

If you are accessing the file via a `jsDelivr` link you can specify an exact release tag, here we use `v1.0.0`, and ensure that the files you are accessing do not change, ensuring consistent functionality
- https://cdn.jsdelivr.net/gh/scarletti-ben/firebase-wrapper@v1.0.0/firebase-wrapper.js

> [!NOTE]
> Do not use the direct link to the file on `GitHub`, only use the `GitHub Pages` served version of the file, or a link from `jsDelivr`

### Exported Objects / Object Methods
Below is a rough list what is exposed when importing `firebase-wrapper.js` correctly, more features may be added in future, and this list may not be entirely up to date
- `initialisation`
  - `initialisation.init(appName)`
- `authentication`
  - `authentication.login()`
  - `authentication.logout()`
  - `authentication.onLogin(callback)`
  - `authentication.onLogout(callback)`
  - `authentication.isAuthenticated()`
- `firestore`
  - `firestore.writeDocument(collectionName, documentName, documentData, replaceBoolean)`
  - `firestore.updateDocument(collectionName, documentName, documentData)`
  - `firestore.readDocument(collectionName, documentName)`
  - `firestore.deleteDocument(collectionName, documentName)`
  - `firestore.readCollection(collectionName)`

# Miscellaneous

## Project Notes
- `firebase-wrapper.js` does not make authentication checks for you eg. for  `firestore.writeDocument`
  - It is safe, and `Firestore` rules prevent unauthenticated writes, but it will throw errors and it is up to the developer to ensure user is logged in and authenticated

## Setting Up Firebase
You can create a new `Firebase` project, giving you access to the `Firebase Console` for your project. In the `Firebase Console` you can add apps to your project, the app itself doesn't necessarily need to exist but when you add an app to a `Firebase` project you generate a new `appId` that can be used alongside the public API key to interact with the components of your `Firebase` project. The `appId` itself isn't noticed by `Firestore` which is why we use a manually entered `appName` to separate collections under each user.

You need to then enable `Authentication` [here](https://console.firebase.google.com/u/3/project/mainframe-storage/authentication), and choose `Google` as a sign-in provider, ignore the warnings for `SHA-1`

You then enable / create a `Firestore` database and update the `Firestore` rules for read / write access

Add `https://scarletti-ben.github.io/` to "authorised domains" if you want to access via a `GitHub Pages` static site

You can use `Firebase` for hosting an app / site as well but this shows that it's not entirely necessary, you can host the site anywhere and you can still interface with a `Firestore` database, with authentication handled server-side by `Google`

Linking an application to `Firebase` gives you the code similar to the snippet below, which we use in our `firebase-wrapper.js` file. It is important to note that the `apiKey` is is not meant to be a secret , it is entirely public as it identifies your `Firebase` project. Safety of data is entirely handled by `Google` authentication and user-defined `Firestore` rules.
```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAx5VIksX5JeW2hk5FDf_8rhyBa6CibH84",
    authDomain: "mainframe-storage.firebaseapp.com",
    projectId: "mainframe-storage",
    storageBucket: "mainframe-storage.firebasestorage.app",
    messagingSenderId: "432631138940",
    appId: "1:432631138940:web:ae5059b05db6b3e09317f9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
```

### Testing Firebase Locally
By default `Firebase` only allows connections from whitelisted sites, this means that you may need to add a local URL to the whitelisted sites if it doesn't start with `localhost`, adding `http://127.0.0.1` to the whitelist will likely help

## Cloud Firestore Database
A simplified version of the database structure can be seen below, with this structure a user can have data across multiple apps all stored within the same `Firestore` database, and accessed via the same credentials
```text
users/
  └─ {userId}/
    └─ apps/
      └─ {appName}/
        └─ .../
          └─ .../
```

A user with `ID` of `UID9876` using an app called `test-app`, storing a document with an `ID` of `note-1234` to that app's `notes` collection would create the path structure seen below
```text
users/
  └─ UID9876/
    └─ apps/
      └─ test-app/
        └─ notes/
          └─ note-1234/
```

### Firestore Rules
The `Firestore Rules` as they stand are below, you can read them [here](https://console.firebase.google.com/u/3/project/mainframe-storage/firestore/databases/-default-/rules)
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  
    // allow user to read/write any document or subcollection under their apps
    match /users/{userId}/apps/{appName}/{path=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
  }
}
```

## Screenshots
![alt text](screenshots/screenshot001.png)
![alt text](screenshots/screenshot002.png)

# Learnings

## User Authentication / Tokens Between Sessions
An ID token is often short-lived, or "ephemeral", lasting say an hour, and to get an ID token you need a valid refresh token. Some sites rotate the refresh token when the ID token is returned, meaning the old refresh token is no longer valid. The ID token is used in request headers to show that the user is authenticated. An ID token should not be used to get refresh tokens. Refresh tokens are usually generated during initial authentication.

To ensure you receive a refresh token, your request for authentication must include the scope. This scope tells `Google` to provide a refresh token along with the ID token during initial authentication.

The refresh token is managed automatically for you when using `Firebase` via `getAuth`, it will check if the current ID token is valid, then attempt to refresh it if not using the refresh token, rotating the ID token, and likely the refresh token itself in the process. In other apps where `Google OAuth 2.0` is used you may have to manage this manually.

# Project Information

## Developement Environment Information
- Tested using `Google Chrome Version 135.0.7049.96 (Official Build) (64-bit)`
- Not tested on mobile devices or other desktop browsers

## Repository Metadata
```yaml
---
metadata:
  author: "Ben Scarletti"
  date: "2025-04-24"
  description: ""
  tags: [
    "dev", "webdev", "programming", "coding", "javascript", "html", "cdn", "ecma6", "export", "import", "firebase", "firestore", "firestore rules", "cloud firestore", "firebase cli", "authentication", "google oauth 2.0", "api", "api keys", "encryption", "pbkdf2", "https", "tokens", "refresh tokens", "id tokens", "sign in with google"
  ]
---
```
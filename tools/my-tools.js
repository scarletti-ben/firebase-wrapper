// my-tools-v1.0.0
// < ========================================================
// < Exported tools Object
// < ========================================================

/**
 * A collection of utility functions
 * @namespace tools
 */
export const tools = {

    // > ========================================================
    // > I: JavaScript Tools
    // > ========================================================

    // ==========================================================
    // Language Tools
    // ==========================================================

    /**
     * Remove an item from a given array
     * @template T
     * @param {Array<T>} array - The array to remove the item from
     * @param {T} item - The item to remove from the array
     * @returns {Array<T>} - The spliced array of deleted elements
     * @throws {Error} If the item is not found in the given array
     */
    remove(array, item) {
        const index = array.indexOf(item);
        if (index !== -1) {
            return array.splice(index, 1);
        }
        throw new Error(`UserError: item not in array`);
    },

    /**
     * Ensure none of the arguments passed are undefined
     * @param {...*} args - Arguments to check for undefined values
     * @throws {Error} If any argument passed is undefined
     */
    argcheck(...args) {
        const successful = args.every(arg => arg !== undefined);
        if (!successful) {
            throw new Error('UserError: A passed argument was undefined');
        }
    },

    /** 
     * Throws an error if the passed condition is false
     * @param {boolean} condition - The condition to assert
     * @param {string} [message='Assertion'] - The error message
     * @throws {Error} UserError if condition is false
     */
    assert(condition, message = 'Assertion') {
        if (!condition) {
            console.error(`Condition: ${condition}`);
            throw new Error(`UserError: ${message}`);
        }
    },

    /**
     * Create an array of numbers from 0 to n-1
     * @param {number} n - The end number (exclusive)
     * @returns {Array<number>} An array containing the sequence [0, 1, 2, ..., n-1]
     */
    range(n) {
        const array = Array(n);
        const indices = array.keys();
        return [...indices];
    },

    /** 
     * Get a random element from an array
     * @template T
     * @param {Array<T>} array - The array
     * @returns {T} A random element from the array
     */
    choice(array) {
        const index = Math.floor(Math.random() * array.length);
        return array[index];
    },

    /**
     * Generate a random integer from min to max, both inclusive
     * @param {number} min - The minimum value (will be rounded up)
     * @param {number} max - The maximum value (will be rounded down)
     * @returns {number} A random integer between min and max (inclusive)
     */
    randint(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Generate a random boolean, true or false
     * @returns {boolean} A random boolean
     */
    randbool() {
        return Math.random() > 0.5;
    },

    /** 
     * Clamp a value between a minimum and maximum
     * @param {number} value - The value to clamp
     * @param {number} min - The minimum value
     * @param {number} max - The maximum value
     * @returns {number} The clamped value
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Sort an array using a key function, with optional reverse
     * @template T
     * @param {Array<T>} array - The array to sort
     * @param {(item: T) => number} key - Function that returns a numeric sort value
     * @param {boolean} [reverse=false] - optionally reverse the sort order
     * @returns {Array<T>} - The sorted array
     */
    sort(array, key, reverse = false) {
        return array.sort((a, b) => {
            const comparison = key(a) - key(b);
            return reverse ? -comparison : comparison;
        });
    },

    /** 
    * Shuffle an array in-place using an unbiased Fisher–Yates shuffle
    * @param {Array} array - The array to shuffle  
    */
    shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
    },

    // ==========================================================
    // Other Tools
    // ==========================================================

    /** 
     * Save string or object to localStorage using key
     * @param {string} key - The localStorage key to save to
     * @param {object | string} data - The data to be saved
     */
    save(data, key) {

        // > Ensure no arguments are undefined
        tools.argcheck(data, key);

        // > Ensure string format, converting if necessary
        let string = typeof data === 'string' ? data : JSON.stringify(data);

        // > Save string to local storage using key
        window.localStorage.setItem(key, string);

    },

    /** 
     * Load string or object from localStorage using key
     * @param {string} key - The localStorage key to load from
     * @returns {object | string} The saved data from localStorage
     */
    load(key) {

        // > Load string from local storage using key
        const string = window.localStorage.getItem(key);

        // > Return if no data is found
        if (!string) {
            console.error(`No data found in localStorage for ${key}`);
            return;
        }

        // > Try to parse string to object, fallback to string if SyntaxError
        let output;
        try {
            output = JSON.parse(string);
        } catch (error) {
            if (error instanceof SyntaxError) {
                output = string;
            }
            else {
                throw error;
            }
        }

        // > Return the object or string output
        return output;

    },

    /**
     * Download a given object as a JSON file
     * @param {Object} object - The object to download
     * @param {number} indent - The number of spaces of indentation [2]
     * @param {string} filename - The name of the file to download [data.json]
     */
    downloadObject(object, indent = 2, filename = 'data.json') {
        const string = JSON.stringify(object, null, indent);
        const blob = new Blob([string], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 200);
    },

    /**
     * Open a given string as in another window
     * @param {String} string - The string to view
     */
    openStringAsPage(string) {
        const blob = new Blob([string], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    },

    /**
     * Open a given object as a JSON string in another window
     * @param {Object} object - The object to view
     * @param {number} indent - The number of spaces of indentation [2]
     */
    openObjectAsPage(object, indent = 2) {
        const string = JSON.stringify(object, null, indent);
        tools.openStringAsPage(string);
    },

    /**
     * Applies CSS styles to an element from key: value pairs
     * @param {HTMLElement} element - The target element
     * @param {Object<string, string>} styling - The styles to apply
     */
    style(element, styling) {
        Object.assign(element.style, styling);
    },

    /**
     * Briefly flash an element by toggling its opacity
     * - Will be hard to notice on elements with low opacity to start
     * @param {HTMLElement} element - The element to flash
     * @param {number} [duration=300] - Total duration of the flash in ms
     */
    flash(element, duration = 400) {
        let original = element.style.opacity;
        element.style.transition = `opacity ${duration / 2}ms`;
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.opacity = original;
        }, duration / 2);
    },

    /** 
     * Dispatch `CustomEvent` of type `UserEvent` with a given flavour
     * - The `CustomEvent` can only be picked up by document
     * - The flavour of the event can be any string you want
     * - The detail object should use strings as key / value pairs
     * - Listen for specific `UserEvent` by checking `event.detail.flavour`
     * @see tools.respond - Counterpart that responds to `UserEvent`
     * @param {string} flavour - The flavour of `UserEvent`
     * @param {object} [detail={}] - Additional event data, minus flavour
     */
    dispatch(flavour, detail = {}) {
        const eventType = `UserEvent`;
        detail['flavour'] = flavour;
        const event = new CustomEvent(eventType, { detail });
        document.dispatchEvent(event);
    },

    /** 
     * Add listener to document for `UserEvent` of a given flavour
     * @see tools.dispatch - Counterpart that generates `UserEvent`
     * @param {string} flavour - The flavour of `UserEvent` to respond to
     * @param {(event: Event)} callback - Callback with event as first argument
     */
    respond(flavour, callback) {
        document.addEventListener(`UserEvent`, (event) => {
            if (event.detail.flavour === flavour) {
                callback(event);
            }
        });
    },

    /** 
     * Create a time delay via setTimeout within a Promise object
     * - The returned Promise object resolves when setTimeout ends
     * - Allows for awaiting eg. await delay(1000)
     * - Allows .then chaining eg. delay(1000).then(() => func())
     * @param {number} [ms=1000] - Time to wait in milliseconds
     * @returns {Promise} - An awaitable Promise that allows .then
     */
    delay(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Get the current date and time as an ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)
     * @returns {string} The current date and time in ISO 8601 format
     */
    date() {
        const date = new Date();
        const string = date.toISOString();
        return string;
    },

    /**
     * Wait for a given time, then resolve 'empty' Promise
     * - Returns an 'empty' Promise object allowing .then() chaining
     * @returns {Promise<void>}
     */
    sleep(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /** 
     * Decorator to return a debounced wrapper of a given function
     * - Calling the wrapper starts a timeout
     * - Subsequent calls restart the timeout
     * - When the timeout ends the wrapped function is called
     * @param {Function} func - The function to be wrapped
     * @param {number} timeout - The debounce timeout in milliseconds
     * @returns {Function} A debounceed wrapper of the given function
     */
    debounced: (func, timeout = 1000) => {
        let timeoutID = null;
        function wrapper(...args) {
            window.clearTimeout(timeoutID);
            timeoutID = window.setTimeout(() => {
                func(...args);
            }, timeout);
        }
        return wrapper;
    },

    /** 
     * Decorator to return a bottlenecked wrapper of a given function
     * - Calling the wrapper the first time starts a timeout
     * - Subsequent calls are ignored and do not restart the timeout
     * - When the timeout ends the wrapped function is called
     * @param {Function} func - The function to be wrapped
     * @param {number} timeout - The bottleneck timeout in milliseconds
     * @returns {Function} A bottlenecked wrapper of the given function
     */
    bottlenecked: (func, timeout = 1000) => {
        let running = false;
        function wrapper(...args) {
            if (running) return;
            running = true;
            window.setTimeout(() => {
                running = false;
                func(...args);
            }, timeout);
        }
        return wrapper;
    },

    /**
     * Timed animation ticker that executes a function every animation frame, passing progress as a decimal
     * - Returns a Promise object allowing .then() chaining
     * @param {(progress: number)} callback - Callback that takes ticker progress (decimal 0 to 1)
     * @param {number} duration - The duration in milliseconds for the ticker to run for
     * @returns {Promise} A promise that resolves when the ticker is finished
     */
    animationTicker(callback, duration) {
        return new Promise((resolve) => {
            let start = performance.now();
            function tick() {
                let current = performance.now();
                let elapsed = current - start;
                let progress = Math.min(elapsed / duration, 1);
                callback(progress);
                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    resolve();
                }
            }
            requestAnimationFrame(tick);
        });
    },

    // > ========================================================
    // > II: HTML and CSS Tools
    // > ========================================================

    /** 
     * Force reflow for an element, using an arbitrary attribute
     * @param {HTMLElement} element - The element to reflow
     */
    reflow(element) {
        void element.offsetHeight;
    },

    /** 
     * Select all content within an HTML element
     * @param {HTMLElement} element - The element to select from
     */
    selectAll(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    },

    // =========================================================
    // Common CSS Class Toggles
    // =========================================================

    /**
     * Toggle .hidden class for an element
     * @param {HTMLElement} element - The element
     * @param {boolean} [force] - Force hidden on or off
     */
    toggleHidden(element, force) {
        element.classList.toggle('hidden', force);
    },

    /** 
     * Toggle shown (removal of .hidden class) for an element
     * @param {HTMLElement} element - The element
     * @param {boolean} [force] - Force shown on or off
     */
    toggleShown(element, shown) {
        let force = shown === undefined ? undefined : !shown
        element.classList.toggle('hidden', force);
    },

    /** 
     * Toggle the .highlighted class for an element
     * @param {HTMLElement} element - The element
     * @param {boolean} [force] - Force highlighted on or off
     */
    toggleHighlighted(element, force) {
        element.classList.toggle('highlighted', force);
    },

    /** 
     * Toggle the .bordered class for an element
     * @param {HTMLElement} element - The element
     * @param {boolean} [force] - Force bordered on or off
     */
    toggleBordered(element, force) {
        element.classList.toggle('bordered', force);
    },

    // > ========================================================
    // > III: Encryption
    // > ========================================================

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
        const ciphertext64 = tools.arrayBufferToBase64(ciphertextArrayBuffer);
        const iv64 = tools.arrayBufferToBase64(ivArrayBuffer);

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
        const ciphertextArrayBuffer = tools.base64ToArrayBuffer(ciphertext);
        const ivArrayBuffer = tools.base64ToArrayBuffer(iv);

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
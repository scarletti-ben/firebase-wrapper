// < ========================================================
// < Exported Toast Class
// < ========================================================

/**
 * Wrapper for a fixed-position `toast` element
 * - Added directly to document body
 * - Creates temporary on-screen messages similar to alert
 * - All styling is self-contained and injected inline
 * - Contains `HTMLDivElement` as `this.element`
 */
export class Toast {

    /** @type {HTMLDivElement} */
    element;

    /** @type {number} Duration (ms) that toasts are shown for */
    duration;

    /** @type {Object.<string, string>} Inline styles applied to the toast */
    styling;

    /** @type {number | null} Active timeout ID */
    timeoutId;

    // Create a new Toast instance
    constructor() {
        this.duration = 1200;
        this.timeoutId = null;
        this.styling = {
            position: 'fixed',
            left: '50%',
            top: '8%',
            transform: 'translateX(-50%)',
            width: 'auto',
            maxWidth: '480px',
            height: 'auto',
            maxHeight: '92px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxSizing: 'border-box',
            backgroundColor: 'white',
            opacity: '0.8',
            color: 'black',
            fontSize: '14px',
            fontWeight: 'bold',
            lineHeight: '1.4',
            fontFamily: "'Courier New', Courier, monospace",
            textAlign: 'center',
            textJustify: 'center',
            overflowY: 'auto',
            overflowWrap: 'break-word',
            scrollbarGutter: "stable both-edges",
            zIndex: 999
        };
        this.element = document.createElement('div');
        this.element.className = 'toast';
        Object.assign(this.element.style, this.styling);
        document.body.appendChild(this.element);
    }

    /**
     * Display a toast message briefly
     * - Clears existing toast if active
     * @param {string} message - Message to show
     * @param {number} [duration] - Optional duration (ms) to show the message
     */
    show(message, duration) {

        // Clear the timeout, and cancel callbacks
        if (this.timeoutId) clearTimeout(this.timeoutId);

        // Set the toast message and make it visible
        this.element.textContent = message;
        this.element.style.display = 'flex';

        // Add timeout / callback to clear and hide the toast
        this.timeoutId = setTimeout(() => {
            this.element.style.display = 'none';
            this.element.textContent = '';
            this.timeoutId = null;
        }, duration ?? this.duration);

    }

}
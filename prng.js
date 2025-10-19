// prng.js - Pseudo-Random Number Generator with seed support

/**
 * Creates a seeded random number generator using the Mulberry32 algorithm
 * @param {number} seed - The seed value (any integer)
 * @returns {function} A function that returns random numbers between 0 and 1 (like Math.random())
 */
function createRNG(seed) {
    // Ensure seed is a valid 32-bit integer
    let state = seed >>> 0; // Convert to unsigned 32-bit integer

    return function() {
        // Mulberry32 algorithm
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Generates a random seed value
 * @returns {number} A random integer seed
 */
function generateSeed() {
    return Math.floor(Math.random() * 2147483647);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createRNG, generateSeed };
}

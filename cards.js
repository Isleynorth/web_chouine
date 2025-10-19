// cards.js - Card representation and utilities

const SUITS = {
    HEARTS: 'hearts',
    DIAMONDS: 'diamonds',
    CLUBS: 'clubs',
    SPADES: 'spades'
};

const RANKS = {
    ACE: { name: 'ace', value: 11, power: 8, display: 'A' },
    TEN: { name: 'ten', value: 10, power: 7, display: '10' },
    KING: { name: 'king', value: 4, power: 6, display: 'K' },
    QUEEN: { name: 'queen', value: 3, power: 5, display: 'Q' },
    JACK: { name: 'jack', value: 2, power: 4, display: 'J' },
    NINE: { name: 'nine', value: 0, power: 3, display: '9' },
    EIGHT: { name: 'eight', value: 0, power: 2, display: '8' },
    SEVEN: { name: 'seven', value: 0, power: 1, display: '7' }
};

const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

const SUIT_COLORS = {
    hearts: '#e74c3c',
    diamonds: '#e74c3c',
    clubs: '#2c3e50',
    spades: '#2c3e50'
};

class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.id = `${rank.name}_${suit}`;
    }

    getValue() {
        return this.rank.value;
    }

    getPower() {
        return this.rank.power;
    }

    isBrisque() {
        return this.rank.name === 'ace' || this.rank.name === 'ten';
    }

    toString() {
        return `${this.rank.display}${SUIT_SYMBOLS[this.suit]}`;
    }

    toHTML() {
        const color = SUIT_COLORS[this.suit];
        return `
            <div class="card" data-card-id="${this.id}">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="card-corner top-left">
                            <div class="card-rank" style="color: ${color}">${this.rank.display}</div>
                            <div class="card-suit" style="color: ${color}">${SUIT_SYMBOLS[this.suit]}</div>
                        </div>
                        <div class="card-center" style="color: ${color}">
                            ${SUIT_SYMBOLS[this.suit]}
                        </div>
                        <div class="card-corner bottom-right">
                            <div class="card-rank" style="color: ${color}">${this.rank.display}</div>
                            <div class="card-suit" style="color: ${color}">${SUIT_SYMBOLS[this.suit]}</div>
                        </div>
                    </div>
                    <div class="card-back">
                        <div class="card-back-pattern"></div>
                    </div>
                </div>
            </div>
        `;
    }
}

class Deck {
    constructor(randomFn = null) {
        this.cards = [];
        this.randomFn = randomFn || Math.random.bind(Math);
        this.initializeDeck();
    }

    initializeDeck() {
        this.cards = [];
        for (const suitKey in SUITS) {
            const suit = SUITS[suitKey];
            for (const rankKey in RANKS) {
                const rank = RANKS[rankKey];
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(this.randomFn() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }

    size() {
        return this.cards.length;
    }

    isEmpty() {
        return this.cards.length === 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Card, Deck, SUITS, RANKS, SUIT_SYMBOLS, SUIT_COLORS };
}

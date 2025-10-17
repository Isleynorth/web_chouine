// ai.js - AI opponent logic for La Chouine

class ChouineAI {
    constructor(game) {
        this.game = game;
    }

    async makeMove() {
        // Add a small delay to make it feel more natural
        await this.delay(800);

        // Check if AI can exchange seven
        if (this.game.canExchangeSeven('ai') && this.shouldExchangeSeven()) {
            const result = this.game.exchangeSeven('ai');
            if (result.success) {
                return {
                    type: 'exchange',
                    result: result
                };
            }
        }

        // Select and play a card
        const card = this.selectCard();
        const result = this.game.playCard('ai', card.id);

        return {
            type: 'play',
            card: card,
            result: result
        };
    }

    shouldExchangeSeven() {
        // Exchange if trump card is a brisque (Ace or 10)
        if (this.game.trumpCard.isBrisque()) {
            return true;
        }

        // Exchange if trump card helps form a combination
        const hand = this.game.players.ai.hand;
        const trumpSuit = this.game.trumpSuit;
        const trumpCards = hand.filter(c => c.suit === trumpSuit);
        const trumpRanks = new Set(trumpCards.map(c => c.rank.name));

        // Check if getting the trump card would complete a valuable combo
        const trumpCardRank = this.game.trumpCard.rank.name;
        if ((trumpCardRank === 'king' || trumpCardRank === 'queen') &&
            (trumpRanks.has('king') || trumpRanks.has('queen'))) {
            return true;
        }

        return false;
    }

    selectCard() {
        const hand = this.game.players.ai.hand;
        const gamePhase = this.game.gamePhase;

        // If leading a trick
        if (!this.game.currentTrick.human && !this.game.currentTrick.ai) {
            return this.selectLeadingCard(hand, gamePhase);
        }

        // If following a trick
        return this.selectFollowingCard(hand, gamePhase);
    }

    selectLeadingCard(hand, gamePhase) {
        // Phase 1: Try to win tricks and control the game
        if (gamePhase === 1) {
            // Check for possible announcements
            const cardWithBestCombo = this.findCardWithBestAnnouncement(hand);
            if (cardWithBestCombo) {
                return cardWithBestCombo;
            }

            // Play strong brisques to win tricks
            const brisques = hand.filter(c => c.isBrisque());
            if (brisques.length > 0) {
                // Play non-trump brisques first
                const nonTrumpBrisques = brisques.filter(c => c.suit !== this.game.trumpSuit);
                if (nonTrumpBrisques.length > 0) {
                    return this.selectStrongest(nonTrumpBrisques);
                }
                return this.selectStrongest(brisques);
            }

            // Play high-value cards
            return this.selectStrongest(hand);
        }

        // Phase 2: More strategic play
        // Try to win with aces or tens
        const strongCards = hand.filter(c =>
            (c.rank.name === 'ace' || c.rank.name === 'ten') &&
            c.suit !== this.game.trumpSuit
        );
        if (strongCards.length > 0) {
            return strongCards[0];
        }

        // Play low-value cards
        return this.selectWeakest(hand);
    }

    selectFollowingCard(hand, gamePhase) {
        const leadCard = this.game.currentTrick.human;
        const legalCards = hand.filter(card => this.game.isLegalPlay('ai', card));

        if (legalCards.length === 0) {
            console.error("No legal cards found - this should not happen");
            return hand[0];
        }

        // Phase 1: Flexible strategy
        if (gamePhase === 1) {
            // Check if we can win the trick
            const winningCards = this.getWinningCards(legalCards, leadCard);

            if (winningCards.length > 0) {
                // If lead card is valuable, try to win
                const leadValue = leadCard.getValue();
                if (leadValue >= 10) {
                    // Win with weakest winning card
                    return this.selectWeakest(winningCards);
                }

                // If lead card is weak, only win if we can win cheaply
                const cheapWins = winningCards.filter(c => c.getValue() === 0);
                if (cheapWins.length > 0) {
                    return cheapWins[0];
                }

                // Otherwise, don't win - throw weak card
                const nonWinningCards = legalCards.filter(c => !winningCards.includes(c));
                if (nonWinningCards.length > 0) {
                    return this.selectWeakest(nonWinningCards);
                }
            }

            // Cannot win or don't want to - throw weakest card
            return this.selectWeakest(legalCards);
        }

        // Phase 2: Must follow strict rules
        const winningCards = this.getWinningCards(legalCards, leadCard);

        if (winningCards.length > 0) {
            // Try to win valuable tricks
            const leadValue = leadCard.getValue();
            if (leadValue >= 3) {
                return this.selectWeakest(winningCards);
            }

            // For weak tricks, check if we can win cheaply
            const cheapWins = winningCards.filter(c => c.getValue() <= 2);
            if (cheapWins.length > 0) {
                return cheapWins[0];
            }
        }

        // Play weakest legal card
        return this.selectWeakest(legalCards);
    }

    findCardWithBestAnnouncement(hand) {
        let bestCard = null;
        let bestPoints = 0;

        for (const card of hand) {
            const suit = card.suit;
            const comboKey = `${suit}`;

            // Skip if already announced for this suit
            if (this.game.announcedCombos.ai.has(comboKey)) {
                continue;
            }

            const allCards = hand;
            const suitCards = allCards.filter(c => c.suit === suit);
            const ranks = new Set(suitCards.map(c => c.rank.name));

            let points = 0;

            // Check for Chouine (instant win!)
            if (ranks.has('ace') && ranks.has('ten') && ranks.has('king') &&
                ranks.has('queen') && ranks.has('jack')) {
                return card; // Play immediately!
            }

            // Check for Quarteron
            if (ranks.has('ace') && ranks.has('king') && ranks.has('queen') && ranks.has('jack')) {
                points = suit === this.game.trumpSuit ? 80 : 40;
            }
            // Check for Tierce
            else if (ranks.has('king') && ranks.has('queen') && ranks.has('jack')) {
                points = suit === this.game.trumpSuit ? 60 : 30;
            }
            // Check for Mariage
            else if (ranks.has('king') && ranks.has('queen')) {
                points = suit === this.game.trumpSuit ? 40 : 20;
            }

            if (points > bestPoints) {
                bestPoints = points;
                bestCard = card;
            }
        }

        // Check for Quinte
        if (!this.game.announcedCombos.ai.has('quinte')) {
            const brisques = hand.filter(c => c.isBrisque());
            if (brisques.length >= 5) {
                bestPoints = 100;
                bestCard = brisques[0];
            }
        }

        return bestPoints >= 20 ? bestCard : null;
    }

    getWinningCards(cards, leadCard) {
        const trumpSuit = this.game.trumpSuit;

        if (leadCard.suit === trumpSuit) {
            // Lead is trump - need higher trump
            return cards.filter(c =>
                c.suit === trumpSuit && c.getPower() > leadCard.getPower()
            );
        } else {
            // Lead is not trump
            // Trump cards win
            const trumpCards = cards.filter(c => c.suit === trumpSuit);
            if (trumpCards.length > 0) {
                return trumpCards;
            }
            // Higher cards of same suit win
            return cards.filter(c =>
                c.suit === leadCard.suit && c.getPower() > leadCard.getPower()
            );
        }
    }

    selectStrongest(cards) {
        return cards.reduce((strongest, card) =>
            card.getPower() > strongest.getPower() ? card : strongest
        );
    }

    selectWeakest(cards) {
        return cards.reduce((weakest, card) =>
            card.getPower() < weakest.getPower() ? card : weakest
        );
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// game.js - Core game logic and rules

class ChouineGame {
    constructor() {
        this.deck = new Deck();
        this.players = {
            human: { hand: [], tricks: [], score: 0, gameWins: 0, announcements: [] },
            ai: { hand: [], tricks: [], score: 0, gameWins: 0, announcements: [] }
        };
        this.trumpCard = null;
        this.trumpSuit = null;
        this.currentTrick = { human: null, ai: null };
        this.currentPlayer = 'human'; // non-dealer starts
        this.dealer = 'ai';
        this.talonEmpty = false;
        this.lastTrickWinner = null;
        this.gamePhase = 1; // 1 = free play with talon, 2 = strict rules
        this.announcedCombos = { human: new Set(), ai: new Set() };
        this.gameOver = false;
        this.gameWinner = null;
        this.sevenExchanged = false;
        this.seed = null; // Current seed for reproducibility
    }

    startNewGame(seed = null) {
        // Switch dealer for fairness (dealer alternates each game)
        this.dealer = this.dealer === 'human' ? 'ai' : 'human';

        // Generate or use provided seed
        this.seed = seed !== null ? seed : generateSeed();

        // Create RNG from seed
        const rng = createRNG(this.seed);

        // Reset game state
        this.deck = new Deck(rng);
        this.deck.shuffle();
        this.players.human.hand = [];
        this.players.ai.hand = [];
        this.players.human.tricks = [];
        this.players.ai.tricks = [];
        this.players.human.score = 0;
        this.players.ai.score = 0;
        this.players.human.announcements = [];
        this.players.ai.announcements = [];
        this.currentTrick = { human: null, ai: null };
        this.announcedCombos = { human: new Set(), ai: new Set() };
        this.gamePhase = 1;
        this.talonEmpty = false;
        this.gameOver = false;
        this.gameWinner = null;
        this.sevenExchanged = false;

        // Deal 5 cards to each player
        for (let i = 0; i < 5; i++) {
            this.players.human.hand.push(this.deck.draw());
            this.players.ai.hand.push(this.deck.draw());
        }

        // Turn up trump card
        this.trumpCard = this.deck.draw();
        this.trumpSuit = this.trumpCard.suit;

        // Non-dealer starts
        this.currentPlayer = this.dealer === 'human' ? 'ai' : 'human';
        this.lastTrickWinner = this.currentPlayer;

        return {
            humanHand: this.players.human.hand,
            aiHandSize: this.players.ai.hand.length,
            trumpCard: this.trumpCard,
            currentPlayer: this.currentPlayer,
            seed: this.seed
        };
    }

    canExchangeSeven(player) {
        if (this.talonEmpty || this.sevenExchanged || this.gamePhase === 2) {
            return false;
        }
        const sevenOfTrump = this.players[player].hand.find(
            card => card.suit === this.trumpSuit && card.rank.name === 'seven'
        );
        return !!sevenOfTrump;
    }

    exchangeSeven(player) {
        if (!this.canExchangeSeven(player)) {
            return { success: false, message: "Cannot exchange seven" };
        }

        const hand = this.players[player].hand;
        const sevenIndex = hand.findIndex(
            card => card.suit === this.trumpSuit && card.rank.name === 'seven'
        );

        if (sevenIndex === -1) {
            return { success: false, message: "Seven of trump not found" };
        }

        // Exchange
        const oldTrump = this.trumpCard;
        this.trumpCard = hand[sevenIndex];
        hand[sevenIndex] = oldTrump;
        this.sevenExchanged = true;

        return { success: true, newTrumpCard: this.trumpCard };
    }

    playCard(player, cardId) {
        const hand = this.players[player].hand;
        const cardIndex = hand.findIndex(card => card.id === cardId);

        if (cardIndex === -1) {
            return { success: false, message: "Card not in hand" };
        }

        const card = hand[cardIndex];

        // Check if play is legal
        if (!this.isLegalPlay(player, card)) {
            return { success: false, message: "Illegal play" };
        }

        // Remove card from hand
        hand.splice(cardIndex, 1);

        // Check for announcements when playing the card
        const announcement = this.checkAnnouncements(player, card);

        // If Chouine, game ends immediately
        if (announcement && announcement.instantWin) {
            this.players[player].gameWins++;
            this.gameOver = true;
            this.gameWinner = player;
            return {
                success: true,
                gameOver: true,
                instantWin: true,
                announcement: announcement,
                scores: {
                    human: this.players.human.score,
                    ai: this.players.ai.score
                },
                winner: player,
                gameWins: {
                    human: this.players.human.gameWins,
                    ai: this.players.ai.gameWins
                }
            };
        }

        // Add to current trick
        this.currentTrick[player] = card;

        // Check if trick is complete
        if (this.currentTrick.human && this.currentTrick.ai) {
            return this.completeTrick(player, announcement);
        }

        // Switch player
        this.currentPlayer = player === 'human' ? 'ai' : 'human';

        return {
            success: true,
            card: card,
            announcement: announcement,
            waitingForOpponent: true
        };
    }

    isLegalPlay(player, card) {
        // Phase 1: No restrictions
        if (this.gamePhase === 1) {
            return true;
        }

        // Phase 2: Strict rules
        // If player is leading, any card is legal
        if (!this.currentTrick.human && !this.currentTrick.ai) {
            return true;
        }

        // Get the led card
        const opponent = player === 'human' ? 'ai' : 'human';
        const ledCard = this.currentTrick[opponent];

        if (!ledCard) {
            return true; // Leading the trick
        }

        const hand = this.players[player].hand;

        // Debug logging for AI illegal plays
        if (player === 'ai') {
            console.log('=== AI isLegalPlay Check ===');
            console.log('Phase:', this.gamePhase);
            console.log('Led card:', ledCard.rank.name, 'of', ledCard.suit);
            console.log('Testing card:', card.rank.name, 'of', card.suit);
            console.log('Trump suit:', this.trumpSuit);
            console.log('AI hand:', hand.map(c => `${c.rank.name} of ${c.suit}`));
        }

        // Must follow suit if possible
        const canFollowSuit = hand.some(c => c.suit === ledCard.suit);
        if (canFollowSuit) {
            if (card.suit !== ledCard.suit) {
                if (player === 'ai') {
                    console.log('ILLEGAL: Must follow suit but trying to play different suit');
                }
                return false; // Must follow suit
            }
            if (player === 'ai') {
                console.log('LEGAL: Following suit');
            }
            return true;
        }

        // Cannot follow suit - must trump if possible
        const canTrump = hand.some(c => c.suit === this.trumpSuit);
        if (player === 'ai') {
            console.log('Cannot follow suit. Can trump?', canTrump);
        }
        if (canTrump) {
            if (card.suit !== this.trumpSuit) {
                if (player === 'ai') {
                    console.log('ILLEGAL: Must trump but trying to play non-trump');
                }
                return false; // Must trump
            }
            // If led card is trump, must play higher trump if possible
            if (ledCard.suit === this.trumpSuit) {
                const canPlayHigher = hand.some(c =>
                    c.suit === this.trumpSuit && c.getPower() > ledCard.getPower()
                );
                if (canPlayHigher && card.getPower() <= ledCard.getPower()) {
                    if (player === 'ai') {
                        console.log('ILLEGAL: Must play higher trump');
                    }
                    return false; // Must play higher trump
                }
            }
            if (player === 'ai') {
                console.log('LEGAL: Playing trump');
            }
        }

        if (player === 'ai') {
            console.log('LEGAL: Can play any card');
        }
        return true; // Can play any card
    }

    completeTrick(lastPlayer, announcement) {
        const humanCard = this.currentTrick.human;
        const aiCard = this.currentTrick.ai;

        // Determine winner
        let winner;
        if (humanCard.suit === aiCard.suit) {
            winner = humanCard.getPower() > aiCard.getPower() ? 'human' : 'ai';
        } else if (humanCard.suit === this.trumpSuit) {
            winner = 'human';
        } else if (aiCard.suit === this.trumpSuit) {
            winner = 'ai';
        } else {
            // First player wins if neither is trump
            winner = lastPlayer === 'human' ? 'ai' : 'human';
        }

        // Add cards to winner's tricks
        this.players[winner].tricks.push(humanCard, aiCard);

        // Add points from the trick immediately
        const trickPoints = humanCard.getValue() + aiCard.getValue();
        this.players[winner].score += trickPoints;

        this.lastTrickWinner = winner;

        // Draw cards if talon not empty
        let drawnCards = null;
        if (!this.talonEmpty) {
            drawnCards = {};
            const loser = winner === 'human' ? 'ai' : 'human';

            if (this.deck.size() > 0) {
                // Winner draws first
                drawnCards[winner] = this.deck.draw();
                this.players[winner].hand.push(drawnCards[winner]);
            }

            if (this.deck.size() > 0) {
                // Loser draws from deck
                drawnCards[loser] = this.deck.draw();
                this.players[loser].hand.push(drawnCards[loser]);
            } else {
                // Deck is empty - loser takes the trump card
                if (this.trumpCard) {
                    drawnCards[loser] = this.trumpCard;
                    this.players[loser].hand.push(this.trumpCard);
                    this.trumpCard = null; // Trump card is now in play
                }
                this.talonEmpty = true;
                this.gamePhase = 2; // Enter strict rules phase
            }
        }

        // Don't clear trick yet - let UI show it first
        // this.currentTrick = { human: null, ai: null };

        // Winner leads next trick
        this.currentPlayer = winner;

        // Check if game is over
        if (this.players.human.hand.length === 0 && this.players.ai.hand.length === 0) {
            return this.endGame(announcement);
        }

        return {
            success: true,
            trickWinner: winner,
            announcement: announcement,
            drawnCards: drawnCards,
            currentPlayer: winner,
            gamePhase: this.gamePhase
        };
    }

    checkAnnouncements(player, playedCard) {
        const hand = this.players[player].hand;
        const allCards = [...hand, playedCard]; // Include the played card
        const suit = playedCard.suit;

        // Check for Chouine (instant win)
        const chouine = this.checkChouine(allCards, suit);
        if (chouine) {
            this.gameOver = true;
            this.gameWinner = player;
            return { type: 'chouine', suit: suit, points: 0, instantWin: true };
        }

        // Check for Quinte (5 brisques)
        if (!this.announcedCombos[player].has('quinte')) {
            const quinte = this.checkQuinte(allCards);
            if (quinte) {
                this.announcedCombos[player].add('quinte');
                const points = 100;
                this.players[player].announcements.push({ type: 'quinte', points });
                this.players[player].score += points; // Add points immediately
                return { type: 'quinte', points: points };
            }
        }

        // Check for combinations in the suit of the played card
        const comboKey = `${suit}`;
        if (!this.announcedCombos[player].has(comboKey)) {
            const quarteron = this.checkQuarteron(allCards, suit);
            if (quarteron) {
                this.announcedCombos[player].add(comboKey);
                const points = suit === this.trumpSuit ? 80 : 40;
                this.players[player].announcements.push({ type: 'quarteron', suit, points });
                this.players[player].score += points; // Add points immediately
                return { type: 'quarteron', suit: suit, points: points };
            }

            const tierce = this.checkTierce(allCards, suit);
            if (tierce) {
                this.announcedCombos[player].add(comboKey);
                const points = suit === this.trumpSuit ? 60 : 30;
                this.players[player].announcements.push({ type: 'tierce', suit, points });
                this.players[player].score += points; // Add points immediately
                return { type: 'tierce', suit: suit, points: points };
            }

            const mariage = this.checkMariage(allCards, suit);
            if (mariage) {
                this.announcedCombos[player].add(comboKey);
                const points = suit === this.trumpSuit ? 40 : 20;
                this.players[player].announcements.push({ type: 'mariage', suit, points });
                this.players[player].score += points; // Add points immediately
                return { type: 'mariage', suit: suit, points: points };
            }
        }

        return null;
    }

    checkChouine(cards, suit) {
        const suitCards = cards.filter(c => c.suit === suit);
        const ranks = new Set(suitCards.map(c => c.rank.name));
        return ranks.has('ace') && ranks.has('ten') && ranks.has('king') &&
               ranks.has('queen') && ranks.has('jack');
    }

    checkQuarteron(cards, suit) {
        const suitCards = cards.filter(c => c.suit === suit);
        const ranks = new Set(suitCards.map(c => c.rank.name));
        return ranks.has('ace') && ranks.has('king') && ranks.has('queen') && ranks.has('jack');
    }

    checkTierce(cards, suit) {
        const suitCards = cards.filter(c => c.suit === suit);
        const ranks = new Set(suitCards.map(c => c.rank.name));
        return ranks.has('king') && ranks.has('queen') && ranks.has('jack');
    }

    checkMariage(cards, suit) {
        const suitCards = cards.filter(c => c.suit === suit);
        const ranks = new Set(suitCards.map(c => c.rank.name));
        return ranks.has('king') && ranks.has('queen');
    }

    checkQuinte(cards) {
        const brisques = cards.filter(c => c.isBrisque());
        return brisques.length >= 5;
    }

    endGame(lastAnnouncement) {
        // Add 10 points bonus for winning the last trick
        this.players[this.lastTrickWinner].score += 10;

        // Determine winner
        let winner;
        if (this.players.human.score > this.players.ai.score) {
            winner = 'human';
        } else if (this.players.ai.score > this.players.human.score) {
            winner = 'ai';
        } else {
            winner = 'tie';
        }

        if (winner !== 'tie') {
            this.players[winner].gameWins++;
        }

        this.gameOver = true;
        this.gameWinner = winner;

        return {
            success: true,
            gameOver: true,
            announcement: lastAnnouncement,
            scores: {
                human: this.players.human.score,
                ai: this.players.ai.score
            },
            winner: winner,
            gameWins: {
                human: this.players.human.gameWins,
                ai: this.players.ai.gameWins
            }
        };
    }

    clearTrick() {
        this.currentTrick = { human: null, ai: null };
    }

    getGameState() {
        return {
            humanHand: this.players.human.hand,
            aiHandSize: this.players.ai.hand.length,
            trumpCard: this.trumpCard,
            trumpSuit: this.trumpSuit,
            currentPlayer: this.currentPlayer,
            currentTrick: this.currentTrick,
            talonSize: this.deck.size(),
            talonEmpty: this.talonEmpty,
            gamePhase: this.gamePhase,
            scores: {
                human: this.players.human.score,
                ai: this.players.ai.score
            },
            gameWins: {
                human: this.players.human.gameWins,
                ai: this.players.ai.gameWins
            },
            gameOver: this.gameOver,
            gameWinner: this.gameWinner
        };
    }
}

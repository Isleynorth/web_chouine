// ui.js - User interface management

class ChouineUI {
    constructor() {
        this.game = null;
        this.ai = null;
        this.selectedCard = null;
        this.animating = false;
        this.previousHandIds = { human: [], ai: [] };
    }

    init() {
        this.game = new ChouineGame();
        this.ai = new ChouineAI(this.game);
        this.setupEventListeners();
        this.startNewGame();
    }

    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('exchange-seven-btn').addEventListener('click', () => {
            this.handleExchangeSeven();
        });
    }

    startNewGame() {
        const result = this.game.startNewGame();

        // Reset hand tracking to treat all initial cards as new
        this.previousHandIds = { human: [], ai: [] };

        this.updateUI();
        this.showMessage("Nouvelle partie ! Atout: " + SUIT_SYMBOLS[this.game.trumpSuit]);
    }

    updateUI() {
        // Always reset animating flag when updating UI
        // This ensures cards become clickable again
        const wasAnimating = this.animating;
        this.animating = false;

        this.renderHumanHand();
        this.renderAIHand();
        this.renderTrumpCard();
        this.renderCurrentTrick();
        this.updateScoreDisplay();
        this.updateGameInfo();
        this.updateExchangeButton();

        // Restore animating if we're still in the middle of something
        if (wasAnimating && this.game.currentPlayer !== 'human') {
            this.animating = true;
        }
    }

    renderHumanHand() {
        const handContainer = document.getElementById('human-hand');
        handContainer.innerHTML = '';

        const hand = this.game.players.human.hand;
        const currentHandIds = hand.map(c => c.id);

        // Find new cards (cards that weren't in the previous hand)
        const newCardIds = currentHandIds.filter(id => !this.previousHandIds.human.includes(id));

        hand.forEach(card => {
            const cardElement = this.createCardElement(card, true);

            // Add animation only to newly drawn cards
            if (newCardIds.includes(card.id)) {
                cardElement.classList.add('new-card');
            }

            handContainer.appendChild(cardElement);
        });

        // Update previous hand state
        this.previousHandIds.human = currentHandIds;
    }

    renderAIHand() {
        const handContainer = document.getElementById('ai-hand');
        handContainer.innerHTML = '';

        const handSize = this.game.players.ai.hand.length;
        const currentHandSize = this.game.players.ai.hand.map(c => c.id);

        // Find new cards based on hand size increase
        const newCardCount = handSize - this.previousHandIds.ai.length;

        for (let i = 0; i < handSize; i++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card card-back-only';

            // Add animation to the last cards (newly drawn ones)
            if (newCardCount > 0 && i >= handSize - newCardCount) {
                cardElement.classList.add('new-card');
            }

            cardElement.innerHTML = '<div class="card-back-pattern"></div>';
            handContainer.appendChild(cardElement);
        }

        // Update previous hand state
        this.previousHandIds.ai = currentHandSize;
    }

    renderTrumpCard() {
        const trumpContainer = document.getElementById('trump-card');
        trumpContainer.innerHTML = '';

        if (this.game.trumpCard) {
            const cardElement = this.createCardElement(this.game.trumpCard, false);
            trumpContainer.appendChild(cardElement);
        }
    }

    renderCurrentTrick() {
        const humanTrickCard = document.getElementById('human-trick-card');
        const aiTrickCard = document.getElementById('ai-trick-card');

        humanTrickCard.innerHTML = '';
        aiTrickCard.innerHTML = '';

        if (this.game.currentTrick.human) {
            const cardElement = this.createCardElement(this.game.currentTrick.human, false);
            humanTrickCard.appendChild(cardElement);
        }

        if (this.game.currentTrick.ai) {
            const cardElement = this.createCardElement(this.game.currentTrick.ai, false);
            aiTrickCard.appendChild(cardElement);
        }
    }

    createCardElement(card, clickable) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;

        const color = SUIT_COLORS[card.suit];
        cardDiv.innerHTML = `
            <div class="card-front">
                <div class="card-corner top-left">
                    <div class="card-rank" style="color: ${color}">${card.rank.display}</div>
                    <div class="card-suit" style="color: ${color}">${SUIT_SYMBOLS[card.suit]}</div>
                </div>
                <div class="card-center" style="color: ${color}">
                    ${SUIT_SYMBOLS[card.suit]}
                </div>
                <div class="card-corner bottom-right">
                    <div class="card-rank" style="color: ${color}">${card.rank.display}</div>
                    <div class="card-suit" style="color: ${color}">${SUIT_SYMBOLS[card.suit]}</div>
                </div>
            </div>
        `;

        if (clickable && this.game.currentPlayer === 'human' && !this.animating) {
            cardDiv.classList.add('clickable');
            cardDiv.addEventListener('click', () => this.handleCardClick(card));

            // Add hover effect to show if card is legal
            cardDiv.addEventListener('mouseenter', () => {
                if (this.game.isLegalPlay('human', card)) {
                    cardDiv.classList.add('legal-play');
                } else {
                    cardDiv.classList.add('illegal-play');
                }
            });

            cardDiv.addEventListener('mouseleave', () => {
                cardDiv.classList.remove('legal-play', 'illegal-play');
            });
        }

        return cardDiv;
    }

    async handleCardClick(card) {
        if (this.animating || this.game.currentPlayer !== 'human') {
            return;
        }

        if (!this.game.isLegalPlay('human', card)) {
            this.showMessage("Coup illégal !", 'error');
            return;
        }

        this.animating = true;

        const result = this.game.playCard('human', card.id);

        if (!result.success) {
            this.showMessage(result.message, 'error');
            this.animating = false;
            return;
        }

        // Show announcement if any
        if (result.announcement) {
            this.showAnnouncement(result.announcement, 'human');
        }

        // If game ended with instant win (Chouine), handle it immediately
        if (result.gameOver && result.instantWin) {
            await this.delay(2000); // Let user see the announcement
            this.handleGameOver(result);
            this.animating = false;
            return;
        }

        this.updateUI();

        // If trick is complete
        if (result.trickWinner) {
            await this.delay(1500);
            this.showMessage(
                result.trickWinner === 'human' ? "Vous gagnez le pli !" : "L'IA gagne le pli !",
                result.trickWinner === 'human' ? 'success' : 'info'
            );

            // Wait to let user see the trick winner message
            await this.delay(1500);

            if (result.gameOver) {
                this.handleGameOver(result);
                this.animating = false;
                return;
            }

            // Clear the trick before updating UI
            this.game.clearTrick();
            this.updateUI();

            await this.delay(500);

            // If AI's turn, let AI play
            if (this.game.currentPlayer === 'ai') {
                this.animating = false;
                await this.handleAITurn();
            } else {
                this.animating = false;
            }
        } else {
            // Waiting for AI to complete trick - show player's card first
            await this.delay(1200);
            this.animating = false;
            await this.handleAITurn();
        }
    }

    async handleAITurn() {
        if (this.game.currentPlayer !== 'ai' || this.animating) {
            return;
        }

        this.animating = true;
        this.showMessage("L'IA réfléchit...", 'info');

        const move = await this.ai.makeMove();

        if (move.type === 'exchange') {
            this.showMessage("L'IA échange le 7 d'atout !", 'info');
            this.updateUI();
            await this.delay(1500);
            this.animating = false;
            await this.handleAITurn();
            return;
        }

        const result = move.result;

        if (!result.success) {
            console.error("AI move failed:", result.message);
            this.animating = false;
            return;
        }

        // Show announcement if any
        if (result.announcement) {
            this.showAnnouncement(result.announcement, 'ai');
        }

        // If game ended with instant win (Chouine), handle it immediately
        if (result.gameOver && result.instantWin) {
            await this.delay(2000); // Let user see the announcement
            this.handleGameOver(result);
            this.animating = false;
            return;
        }

        this.updateUI();

        // If trick is complete
        if (result.trickWinner) {
            // Let user see both cards before resolving trick
            await this.delay(1800);
            this.showMessage(
                result.trickWinner === 'human' ? "Vous gagnez le pli !" : "L'IA gagne le pli !",
                result.trickWinner === 'human' ? 'success' : 'info'
            );

            // Wait to let user see the trick winner message
            await this.delay(1500);

            if (result.gameOver) {
                this.handleGameOver(result);
                this.animating = false;
                return;
            }

            // Clear the trick before updating UI
            this.game.clearTrick();
            this.updateUI();

            await this.delay(500);

            // If AI still has to lead, let it play again
            if (this.game.currentPlayer === 'ai') {
                this.animating = false;
                await this.handleAITurn();
            } else {
                this.animating = false;
            }
        } else {
            // Trick not complete, human's turn
            this.animating = false;
            this.updateUI();
        }
    }

    handleExchangeSeven() {
        if (!this.game.canExchangeSeven('human')) {
            this.showMessage("Impossible d'échanger le 7 d'atout", 'error');
            return;
        }

        const result = this.game.exchangeSeven('human');
        if (result.success) {
            this.showMessage("7 d'atout échangé !", 'success');
            this.updateUI();
        }
    }

    updateExchangeButton() {
        const btn = document.getElementById('exchange-seven-btn');
        if (this.game.canExchangeSeven('human') && !this.animating) {
            btn.disabled = false;
            btn.classList.remove('disabled');
        } else {
            btn.disabled = true;
            btn.classList.add('disabled');
        }
    }

    showAnnouncement(announcement, player) {
        if (!announcement) return;

        let message = '';

        if (announcement.instantWin) {
            message = player === 'human'
                ? 'Vous avez une CHOUINE ! Victoire immédiate !'
                : "L'IA a une CHOUINE ! Victoire immédiate !";
        } else {
            const typeNames = {
                'mariage': 'Mariage',
                'tierce': 'Tierce',
                'quarteron': 'Quarteron',
                'quinte': 'Quinte'
            };
            const announcementName = typeNames[announcement.type];
            message = player === 'human'
                ? `Vous annoncez ${announcementName} pour ${announcement.points} points !`
                : `L'IA annonce ${announcementName} pour ${announcement.points} points !`;
        }

        this.showMessage(message, 'success');
    }

    handleGameOver(result) {
        const winner = result.winner;
        let message = '';

        if (winner === 'human') {
            message = `Vous gagnez ${result.scores.human} à ${result.scores.ai} !`;
        } else if (winner === 'ai') {
            message = `L'IA gagne ${result.scores.ai} à ${result.scores.human} !`;
        } else {
            message = `Égalité ${result.scores.human} à ${result.scores.ai} !`;
        }

        message += `\nScore de la manche: Vous ${result.gameWins.human} - IA ${result.gameWins.ai}`;

        // Check if match is won (best of 3)
        if (result.gameWins.human >= 2) {
            message += "\n🏆 Vous remportez la manche !";
        } else if (result.gameWins.ai >= 2) {
            message += "\n🏆 L'IA remporte la manche !";
        }

        this.showMessage(message, winner === 'human' ? 'success' : 'info');
        this.updateUI();
    }

    updateScoreDisplay() {
        document.getElementById('human-score').textContent =
            `Vous: ${this.game.players.human.score} points (${this.game.players.human.gameWins} victoires)`;
        document.getElementById('ai-score').textContent =
            `IA: ${this.game.players.ai.score} points (${this.game.players.ai.gameWins} victoires)`;
    }

    updateGameInfo() {
        const phase = this.game.gamePhase === 1 ? "Phase 1: Jeu libre" : "Phase 2: Règles strictes";
        const talon = `Talon: ${this.game.deck.size()} cartes`;
        const turn = this.game.currentPlayer === 'human' ? "À votre tour" : "Tour de l'IA";

        document.getElementById('game-phase').textContent = phase;
        document.getElementById('talon-info').textContent = talon;
        document.getElementById('current-turn').textContent = turn;

        // Update talon display
        const talonDisplay = document.getElementById('talon-display');
        if (talonDisplay) {
            talonDisplay.textContent = this.game.deck.size();
        }
    }

    showMessage(message, type = 'info') {
        const messageBox = document.getElementById('message-box');
        messageBox.textContent = message;
        messageBox.className = 'message-box ' + type;
        messageBox.style.display = 'block';

        // Auto-hide after 3 seconds for non-game-over messages
        if (!this.game.gameOver) {
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 3000);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const ui = new ChouineUI();
    ui.init();
});

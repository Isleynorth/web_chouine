# Web Chouine

A web-based implementation of La Chouine, a traditional French card game.

## About

La Chouine is a trick-taking card game played with a 32-card French deck. This implementation allows you to play against an AI opponent in your browser.

## Features

- Full game implementation following traditional La Chouine rules
- AI opponent with strategic decision-making
- Clean, responsive user interface
- Card animations and visual feedback
- Score tracking across rounds
- **Seeded RNG** for reproducible games (replay any game with the same seed)

## Special Seeds

The game supports seed-based random number generation for reproducible gameplay. Here are some interesting seeds that create specific scenarios:

### 1. Quinte (5 Brisques) - Seed: `56394879`
**Main**: A♦, 10♥, A♥, 10♣, A♣
**Points**: 52 points in hand
**Atout**: 8♥
**Found in**: 6,462 attempts
Perfect for announcing a Quinte (100 points)!

### 2. Chouine (Instant Win) - Seed: `680504986`
**Main**: A♠, Q♠, J♠, K♠, 10♠
**Atout**: K♦
**Found in**: 72,851 attempts
The legendary Chouine - all 5 cards in the same suit! Play any card to win instantly.

### 3. Mariage d'Atout - Seed: `1610014355`
**Main**: K♠, 8♦, Q♠, A♥, J♣
**Atout**: 7♠
**Found in**: 49 attempts
King and Queen of trump suit = 40 points

### 4. Main Parfaite (All Trump) - Seed: `235878572`
**Main**: K♠, 10♠, J♠, 8♠, 9♠
**Atout**: A♠
**Found in**: 1,362 attempts
All 5 cards are trump cards! Ultimate control.

### 5. Quarteron - Seed: `384697027`
**Main**: K♣, A♣, Q♣, 9♠, J♣
**Atout**: K♦
**Found in**: 183 attempts
4 consecutive face cards in clubs: 40 points (80 if trump)

### 6. Aucune Brisque (Challenge Mode) - Seed: `992357791`
**Main**: 8♥, 8♣, 7♦, Q♥, 7♠
**Atout**: 9♥
**Found in**: 2 attempts
No Aces or 10s - for experienced players seeking a challenge!

### How to Use Seeds

1. Click the "📋" button to copy the current game's seed
2. Enter a seed in the input field and click "Rejouer" to replay
3. The same seed always produces the same card distribution

**Note**: The dealer alternates between games, so you may start or the AI may start, but the card distribution remains deterministic.

## How to Play

1. Open `index.html` in a web browser
2. The game will automatically deal cards and determine the trump suit
3. Click on cards to play them during your turn
4. Try to win tricks and score points according to the rules

## Rules

For detailed rules, see [la_chouine_rules.md](la_chouine_rules.md).

## Files

- `index.html` - Main game page
- `game.js` - Core game logic and state management
- `cards.js` - Card and deck management
- `ai.js` - AI player implementation
- `ui.js` - User interface and rendering
- `prng.js` - Seeded pseudo-random number generator (Mulberry32 algorithm)
- `styles.css` - Game styling
- `la_chouine_rules.md` - Complete game rules

## License

MIT

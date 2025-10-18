# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web Chouine is a browser-based implementation of La Chouine, a traditional French trick-taking card game from the Loire Valley. The game is played with a 32-card French deck between a human player and an AI opponent.

## Running the Application

This is a client-side only web application with no build process:

```bash
# Simply open in a web browser
open index.html
# or on Linux
xdg-open index.html
```

No dependencies or build tools are required.

## Architecture

### Core Game System

The application follows a modular class-based architecture with four main components:

1. **Card Model (`cards.js`)**: Defines the card representation and deck management
   - 32-card French deck (piquet pack): 7-A in 4 suits
   - Card ranking by "power" (for trick-taking) vs "value" (for scoring)
   - Brisques: Aces and 10s are the highest-value cards
   - Constants: `SUITS`, `RANKS`, `SUIT_SYMBOLS`, `SUIT_COLORS`

2. **Game Logic (`game.js`)**: Implements La Chouine rules via `ChouineGame` class
   - Two-phase gameplay: Phase 1 (free play while talon has cards) and Phase 2 (strict following rules)
   - Trump system with seven-exchange mechanic
   - Announcement system (Mariage, Tierce, Quarteron, Quinte, Chouine)
   - Tracks game state: hands, tricks, scores, current player, game phase

3. **AI Opponent (`ai.js`)**: Strategic decision-making via `ChouineAI` class
   - Announcement detection and optimal combo play
   - Different strategies for Phase 1 (aggressive) vs Phase 2 (defensive)
   - Card valuation: prioritizes winning valuable tricks, preserving weak cards
   - Seven-exchange logic based on trump card value

4. **User Interface (`ui.js`)**: Rendering and interaction via `ChouineUI` class
   - Turn management with animation sequencing
   - Card click handling with legality validation
   - Visual feedback for legal/illegal plays
   - Game state rendering (hands, tricks, scores, announcements)

### Key Game Rules Implemented

- **Phase 1** (talon not empty): No restrictions on play, winner draws first
- **Phase 2** (talon empty): Must follow suit, must trump if unable, must overtrump if possible
- **Announcements**: Must be declared when playing a card from the combination
  - Mariage (K+Q): 20 pts normal, 40 pts trump
  - Tierce (K+Q+J): 30 pts normal, 60 pts trump
  - Quarteron (A+K+Q+J): 40 pts normal, 80 pts trump
  - Quinte (5 brisques): 100 pts
  - **Chouine (A+10+K+Q+J)**: Instant win
- **Seven Exchange**: Can swap 7 of trump for trump card (Phase 1 only)
- **Last Trick Bonus**: Winner of final trick scores +10 points

### State Management

Game state flows through a centralized `ChouineGame` instance:
- Player hands and tricks are stored in `players` object
- Current trick in progress stored in `currentTrick`
- `gamePhase` (1 or 2) determines which rules apply
- `announcedCombos` tracks which combos have been declared (once per suit per game)
- Animation and interaction state managed by `ChouineUI.animating` flag

### AI Strategy

The AI in `ai.js` uses a rule-based decision system:
- Leading tricks: Prioritizes announcements, then brisques, then high-power cards
- Following tricks: Attempts to win valuable tricks with minimal cost
- Differentiates strategy between Phase 1 (flexible) and Phase 2 (forced rules)
- Seven exchange decision based on trump card brisque status and combo potential

## File Organization

```
/
├── index.html          # Main game page, includes all scripts
├── cards.js           # Card and Deck classes, constants
├── game.js            # ChouineGame class - core game logic
├── ai.js              # ChouineAI class - opponent strategy
├── ui.js              # ChouineUI class - rendering and events
├── styles.css         # All styling and animations
├── la_chouine_rules.md # Complete game rules reference
└── README.md          # Project documentation
```

## Common Development Tasks

When modifying game logic:
1. Start in `game.js` for rule changes (`isLegalPlay`, `checkAnnouncements`)
2. Update AI strategy in `ai.js` if rules affect decision-making
3. Modify UI feedback in `ui.js` if visual changes needed
4. Card definitions in `cards.js` rarely need changes

When debugging:
- AI has extensive console logging in `isLegalPlay` (search for `player === 'ai'`)
- Check `animating` flag in UI if cards become unresponsive
- Use browser DevTools to inspect card elements with `data-card-id` attributes

## Game Flow

1. Game initialization: `ChouineUI.init()` → `startNewGame()`
2. Deal 5 cards to each player, reveal trump card
3. Non-dealer leads first trick
4. Turn sequence: Player action → Update UI → Check for trick completion → Draw cards (Phase 1) → Next player
5. Trick completion: Determine winner → Award points → Check for game end → Clear trick → Winner leads
6. Game end: Add 10-point bonus for last trick → Determine winner → Update match score

## Important Implementation Notes

- The game uses a unique card ID system (`${rank}_${suit}`) for tracking cards
- Animation timing is critical: `animating` flag prevents concurrent actions
- Hand tracking (`previousHandIds`) enables "new card" animations
- Phase transition occurs automatically when talon becomes empty
- Announcement points are added immediately when declared (not at end of game)
- Trump card can be taken by loser of last trick before talon empties

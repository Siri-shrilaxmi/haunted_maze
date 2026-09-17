# Maze Escape

## Overview

**Maze Escape** is a browser-based maze game where the player must navigate from the **Start (`▶`)** to the **Exit (`🚪`)** while avoiding hidden ghost triggers.

The game contains multiple themed levels. Each level uses a fixed physical maze layout, while the safe route and chase-trigger positions are randomized for each round.

## Game Objective

Reach the exit before the **90-second timer** expires.

During each round:

- One valid Start-to-Exit route is selected as the **safe route**.
- The safe route remains free of chase triggers.
- Other routes can contain hidden ghost triggers.
- Trigger positions are randomized when the level starts and remain fixed during that round.
- When a trigger is activated, a warning is displayed and the game temporarily freezes.
- The ghost then appears ahead of the player.
- The ghost follows the maze rather than moving through walls.
- After the chase, the ghost remains on the trigger tile and that tile becomes blocked.
- The player must retreat or find another available route.

## Controls

| Key | Action |
|---|---|
| `Arrow Up` | Move up |
| `Arrow Down` | Move down |
| `Arrow Left` | Move left |
| `Arrow Right` | Move right |
| `Escape` | Pause / resume |

The game can also be controlled through the on-screen interface where available.

## Levels

The game contains five themed levels:

1. **Digital World**
2. **Forgotten Jungle**
3. **Frozen Wilderness**
4. **Forgotten Palace**
5. **The Haunted Cave**

All levels use a **90-second time limit**.

Difficulty increases primarily through maze complexity, route structure, ghost behavior, and movement speed rather than by reducing the timer.

## Maze System

The maze is represented using a character grid.

### Map Symbols

| Symbol | Meaning |
|---|---|
| `#` | Wall |
| `.` | Walkable path |
| `S` | Start |
| `E` | Exit |

The physical maze layout remains intact during gameplay.

The game engine does not replace the maze with a simple corridor when selecting a safe route. Instead, it analyzes the existing maze and selects a route through it.

## Safe Route

At the beginning of a round, the maze engine searches for possible `S → E` routes.

One route is randomly selected as the safe route.

The safe route is stored internally using:

- `safePath`
- `safePathSet`

Trigger generation checks this safe-route set so that a trigger is never intentionally placed on the selected safe route.

Recent safe-route signatures can also be supplied to the maze engine to reduce immediate repetition between rounds.

## Ghost Trigger System

Triggers are generated from non-safe routes.

A trigger candidate must satisfy several conditions:

- It must be on a walkable tile.
- It must not be the Start tile.
- It must not be the Exit tile.
- It must not be on the selected safe route.
- It must have sufficient maze space for the ghost spawn.
- The ghost must be able to appear six maze steps ahead.

### Six-Step Ghost Spawn

The six-step distance does not mean the ghost must remain in a perfectly straight line.

The first step is forced to follow the player's approach direction.

After that, the ghost's six-step path may turn through the maze.

This allows behavior such as:

```text
Player
  ↓
Trigger
  ↓
  ↓
  →
  →
  ↓
Ghost
```

provided all six steps are valid maze movements.

## Ghost Movement

Ghost movement uses maze pathfinding.

The ghost:

- Cannot move through walls.
- Cannot ignore the maze structure.
- Uses the available walkable cells.
- Can turn around corners.
- Appears ahead of the player rather than directly behind them.
- Remains on the activated trigger tile after the chase ends.

When a trigger tile becomes permanently blocked, the player must adapt to the remaining maze.

## Route Planning

The main route-planning functions are implemented in:

```text
js/maze.js
```

Important functions include:

- `findPath()`
- `findAllSimplePaths()`
- `findSixStepsAhead()`
- `getRouteTriggerCandidates()`
- `findRouteTriggerMatching()`
- `chooseRandomEscapeRoute()`

### Performance Protection

Highly connected mazes can contain a very large number of possible simple Start-to-Exit routes.

For example, the Haunted Cave can contain more than 10,000 possible simple routes.

To prevent the browser from freezing, route enumeration is bounded:

```js
findAllSimplePaths(10000)
```

The safe-route selection is also limited by:

```js
safeRouteAttempts
```

Each level can configure this value independently.

For example:

```js
safeRouteAttempts: 100
```

The maze engine caps the actual safe-route planning attempts so that extremely complex maps remain responsive.

## Project Structure

```text
Maze Escape/
│
├── index.html
├── style.css
├── README.md
│
└── js/
    ├── audio.js
    ├── game.js
    ├── hazards.js
    ├── levels.js
    ├── main.js
    ├── maze.js
    ├── player.js
    ├── renderer.js
    └── ui.js
```

### File Responsibilities

#### `index.html`

Contains the game page structure, canvas, HUD, overlays, and controls.

#### `style.css`

Contains the visual styling for the game interface, HUD, overlays, buttons, and themed presentation.

#### `js/main.js`

Initializes the game and handles keyboard input.

#### `js/game.js`

Controls the main game lifecycle, including:

- Starting the game
- Loading levels
- Updating gameplay
- Timer handling
- Player movement
- Trigger activation
- Ghost chase handling
- Level completion
- Restarting / advancing levels

#### `js/maze.js`

Contains the maze engine.

It handles:

- Maze representation
- Wall detection
- Walkability
- Pathfinding
- Route discovery
- Safe-route selection
- Trigger candidate generation
- Ghost spawn positioning

#### `js/player.js`

Controls player position and movement.

#### `js/hazards.js`

Controls hidden triggers, ghost encounters, and hazard behavior.

#### `js/renderer.js`

Draws the maze, player, ghost, exit, and other game elements on the canvas.

#### `js/ui.js`

Controls:

- HUD
- Timer display
- Warnings
- Pause overlay
- Level-complete overlay
- Game-complete overlay
- Restart / next-level controls

#### `js/audio.js`

Handles game audio initialization and sound effects.

#### `js/levels.js`

Contains the level definitions, maps, themes, timing, speed, and route-planning settings.

## Running the Game

This project is designed to run directly in a modern web browser.

### Option 1: Open Directly

Open:

```text
index.html
```

in a browser.

### Option 2: Local Web Server

For a more reliable browser environment, run a local HTTP server from the project folder.

For Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Level Configuration

Each level can define settings such as:

```js
{
    id: 1,
    name: "Digital World",
    theme: "Digital World",
    timeLimit: 90,

    map: [
        // maze rows
    ],

    triggerMode:
        "one-per-non-safe-route",

    spawnDistance: 6,

    safeRouteAttempts: 30,

    warningTime: 1500,

    speed: 3.4,

    maxDuration: 3,

    maxDistance: 10
}
```

### Important Settings

#### `timeLimit`

Maximum time available for the level.

Current levels use:

```text
90 seconds
```

#### `triggerMode`

Controls the trigger-generation strategy.

Current configuration:

```text
one-per-non-safe-route
```

#### `spawnDistance`

Distance used when determining where the ghost should appear.

Current value:

```text
6 maze steps
```

#### `safeRouteAttempts`

Controls how many possible safe routes are considered during round generation.

Higher values can provide more route-selection variety but require more computation.

#### `warningTime`

Duration of the warning before the ghost chase begins.

Current value:

```text
1500 ms
```

#### `speed`

Player/game movement speed for the level.

Higher levels generally use higher speeds.

## Important Design Principles

### 1. The physical maze is preserved

The original maze grid is not replaced by a generated linear path.

### 2. Safe route is randomized

The safe route can change between rounds.

### 3. Trigger positions are randomized

Triggers are selected during level initialization and remain fixed for the current round.

### 4. Safe route remains trigger-free

Trigger candidates are rejected when their tile belongs to the safe route.

### 5. Ghosts respect maze geometry

Ghost movement uses pathfinding and cannot pass through walls.

### 6. Ghosts can turn during their six-step spawn path

The six-step requirement represents maze distance, not necessarily a straight line.

### 7. Trigger tiles become permanent obstacles

After a chase, the activated tile is blocked so the player cannot repeatedly trigger the same hazard.

### 8. Performance is protected

Very complex mazes can have thousands of possible routes. Route enumeration and safe-route testing are therefore bounded to prevent the browser from becoming unresponsive.

## Known Route-Enumeration Limitation

`findAllSimplePaths()` uses a maximum route count.

Therefore, if a maze contains more simple Start-to-Exit routes than the configured limit, only the discovered subset is considered by the route planner during that round.

This is intentional as a performance safeguard.

For extremely large maze graphs, an alternative scalable route-planning approach would be required to guarantee analysis of every mathematically possible simple route.

## Technologies

The project uses standard web technologies:

- HTML5
- CSS3
- JavaScript
- HTML Canvas
- Browser keyboard events
- Client-side pathfinding

No backend server is required for the core game.

## Future Improvements

Possible future enhancements include:

- More maze themes
- Additional ghost types
- Multiple ghost behaviors
- Better procedural maze generation
- More advanced route classification
- Persistent scores
- High-score leaderboard
- Mobile touch controls
- Difficulty selection
- Additional sound effects
- Visual effects during ghost encounters
- More scalable route analysis for extremely dense mazes

## Credits

Maze Escape is a custom browser game project focused on maze navigation, randomized route selection, pathfinding, and chase-based gameplay.

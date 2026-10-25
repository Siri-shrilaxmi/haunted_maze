# Maze Escape

## Overview

**Maze Escape** is a browser-based maze game where the player must navigate from the **Start (`▶`)** to the **Exit (`🚪`)** while avoiding hidden ghost triggers.

The game contains multiple themed levels. Each level uses a fixed physical maze layout, while the safe route and chase-trigger positions are randomized for each round.

## Game Objective

Reach the exit before the **90-second timer** expires.

During each round:

- There is **no pre-selected safe route**. Every walkable route can be used.
- Ghost triggers are distributed across the physical maze and are independent of route planning.
- Trigger positions are randomized when the level starts and remain fixed during that round.
- When a trigger is activated, a warning appears and the ghost encounter begins immediately.
- Each trigger can create **1–3 ghosts** at distinct, dynamically chosen positions.
- Ghosts can appear from different directions instead of always spawning behind the player.
- Before an encounter is accepted, the engine verifies that the player still has a reachable escape route.
- Previously used ghost spawn tiles are not reused during the level.
- Ghosts follow the maze rather than moving through walls.
- After a chase, a ghost can remain on its trigger tile, changing the available space without permanently selecting a single correct route.
- The player is expected to make mistakes and take risks; the engine should not create an unavoidable trap.

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

## Dynamic Route System

The current game does **not** select a correct route at the beginning of a level.
The player is free to choose any corridor and can change direction at any junction.

Ghost events are generated independently from route planning. This makes the maze a reactive survival game rather than a puzzle where the player is expected to discover one hidden correct path.

The trigger system only controls **where an encounter can start**. The actual ghost positions are selected at runtime from the player's current location, which makes the same trigger behave differently on different attempts.

## Ghost Trigger System

Triggers are generated from **walkable maze cells**, not from a pre-selected route.

A trigger candidate must satisfy several conditions:

- It must be on a walkable tile.
- It must not be the Start tile.
- It must not be the Exit tile.
- Triggers are spaced apart so encounters do not accidentally chain from adjacent cells.
- Ghost spawn positions are chosen later, when the player actually activates the trigger.

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

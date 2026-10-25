class Game {

    constructor(canvas, ui) {

        this.canvas =
            canvas;

        this.ui =
            ui;


        this.levelIndex =
            0;

        /*
         * Prevent finishLevel() from being processed repeatedly.
         */
        this.levelFinished =
            false;


        this.maze =
            null;

        this.player =
            null;

        this.hazards =
            [];

        this.collectibles = [];
        this.score = 0;
        this.levelScore = 0;
        this.combo = 0;


        this.hazardTemplates =
            [];


        this.trapTriggeredCells =
            new Set();

        /*
         * Ghosts belonging to the currently active encounter.
         * A trigger can create 1-3 ghosts, but encounters are kept
         * from overlapping so the screen does not become chaotic.
         * A later trigger may fire after the current chase ends.
         */
        this.activeGhostHazards = [];

        /* Ghost spawn tiles already used during this level.
         * This prevents later triggers from reusing the same physical
         * ambush location. */
        this.usedGhostSpawnCells = new Set();


        this.renderer =
            null;


        this.running =
            false;

        this.paused =
            false;

        this.gameOver =
            false;


        this.remainingTime =
            0;

        this.lastTime =
            0;


        /*
         * =========================================================
         * NORMAL WARNING STATE
         * =========================================================
         *
         * Normal warnings are now only a visual flash.
         *
         * IMPORTANT:
         * The ghost does NOT wait for warningTime anymore.
         *
         * Trigger:
         *     red flash + warning sound
         *     ghost appears immediately
         *     ghost starts chasing immediately
         */

        this.warningActive =
            false;

        this.warningRemaining =
            0;

        this.pendingHazard =
            null;


        /*
         * Events already triggered during this level.
         */

        this.triggeredEvents =
            new Set();


        /*
         * Keep a small history of recently selected safe routes
         * for each level.
         */

        this.recentSafeRouteSignatures =
            new Map();


        /*
         * =========================================================
         * FIRST ENCOUNTER
         * =========================================================
         *
         * The FIRST wrong-route encounter of the WHOLE GAME:
         *
         * 1. Game pauses.
         * 2. Timer pauses.
         * 3. Player cannot move.
         * 4. Center warning appears.
         * 5. Player must press CONTINUE.
         * 6. Ghost starts chasing immediately.
         *
         * Later encounters do NOT pause the game.
         */

        this.firstEncounterWarningShown =
            false;

        this.firstEncounterOverlay =
            null;

    }


    /*
     * =============================================================
     * START GAME
     * =============================================================
     */

    start() {

        if (
            this.running
        ) {

            return;

        }


        this.running =
            true;


        this.gameOver =
            false;

        this.paused =
            false;

        this.levelFinished =
            false;


        /*
         * A completely new game starts from Level 1.
         */

        this.levelIndex =
            0;

        this.score = 0;
        this.levelScore = 0;
        this.combo = 0;

        this.firstEncounterWarningShown =
            false;


        this.loadLevel(
            this.levelIndex
        );


        this.lastTime =
            performance.now();


        requestAnimationFrame(
            (time) => {

                this.gameLoop(
                    time
                );

            }
        );

    }


    /*
     * =============================================================
     * LOAD LEVEL
     * =============================================================
     */

    loadLevel(index) {

        if (
            index < 0 ||
            index >= LEVELS.length
        ) {

            index = 0;

        }


        this.levelIndex =
            index;


        const level =
            LEVELS[index];


        /*
         * Reset level completion state.
         */

        this.levelFinished =
            false;


        /*
         * =========================================================
         * MAZE
         * =========================================================
         */

        this.maze =
            new Maze(
                level.map
            );


        /*
         * =========================================================
         * LEVEL SETTINGS
         * =========================================================
         */

        this.maze.safeRouteAttempts =
            level.safeRouteAttempts || 30;


        this.maze.theme =
            level.theme;


        /*
         * =========================================================
         * PLAYER
         * =========================================================
         */

        this.player =
            new Player(
                this.maze
            );


        /*
         * =========================================================
         * RESET HAZARDS
         * =========================================================
         */

        this.hazardTemplates =
            [];

        this.hazards =
            [];

        this.trapTriggeredCells.clear();
        this.activeGhostHazards = [];
        this.usedGhostSpawnCells.clear();


        /*
         * =========================================================
         * DYNAMIC GHOST SYSTEM
         * =========================================================
         *
         * There is deliberately NO pre-selected safe route anymore.
         * Every walkable corridor is part of the live game. Ghost
         * triggers are distributed through the maze and an encounter
         * is decided from the player's actual position at runtime.
         */

        this.randomEscapePath = [];

        this.createCollectibles();


        /*
         * =========================================================
         * CHASE SETTINGS
         * =========================================================
         */

        const chaseTemplate = {

            spawnDistance:
                level.spawnDistance || 6,

            warningTime:
                level.warningTime || 1500,

            speed:
                level.speed || 3.5,

            maxDuration:
                level.maxDuration || 3,

            maxDistance:
                level.maxDistance || 10

        };

        this.hazardTemplates = [chaseTemplate];


        /*
         * Create independent physical triggers. They are not attached
         * to a route and therefore can activate on ANY route the player
         * happens to take.
         */
        const triggerCount =
            level.triggerCount || Math.max(5, 4 + level.id * 2);

        const triggerCells = this.createDynamicGhostTriggers(triggerCount);

        this.hazards = triggerCells.map((cell, index) =>
            new ChaseBlock(
                this.maze,
                {
                    ...chaseTemplate,
                    id: `dynamic-ghost-${level.id}-${index + 1}`,
                    trigger: { x: cell.x, y: cell.y }
                }
            )
        );

        console.info(
            `[Haunted Maze] Level ${level.id}: dynamic mode, ` +
            `${this.hazards.length} independent ghost triggers.`
        );

        /*
         * =========================================================
         * RENDERER
         * =========================================================
         */

        this.renderer =
            new Renderer(
                this.canvas,
                this.maze
            );


        /*
         * =========================================================
         * RESET LEVEL STATE
         * =========================================================
         */

        this.remainingTime =
            level.timeLimit;

        this.levelScore = 0;
        this.combo = 0;
        this.updateScoreUI();


        this.paused =
            false;


        this.gameOver =
            false;


        this.warningActive =
            false;


        this.warningRemaining =
            0;


        this.pendingHazard =
            null;


        this.triggeredEvents.clear();


        this.trapTriggeredCells.clear();


        /*
         * Remove any first-encounter overlay left from an
         * interrupted level.
         */

        if (
            this.firstEncounterOverlay
        ) {

            this.firstEncounterOverlay.remove();

            this.firstEncounterOverlay =
                null;

        }


        /*
         * =========================================================
         * HUD
         * =========================================================
         */

        this.ui.updateLevel(

            `${level.id} — ${level.name}`

        );


        this.ui.updateTimer(
            this.remainingTime
        );


        /*
         * =========================================================
         * HIDE OLD UI
         * =========================================================
         */

        this.ui.hideWarning();

        this.ui.hideOverlay();

        this.ui.hidePause();

        this.ui.hideExit();


        /*
         * Stop any previous chase audio.
         */

        if (
            window.gameAudio &&
            window.gameAudio.stopChase
        ) {

            window.gameAudio.stopChase();

        }


        /*
         * Draw the newly loaded level immediately.
         */

        this.render();

    }


    /*
     * =============================================================
     * MAIN GAME LOOP
     * =============================================================
     */

    gameLoop(currentTime) {

        if (
            !this.running
        ) {

            return;

        }


        /*
         * Calculate elapsed frame time.
         */

        let deltaTime =
            (
                currentTime -
                this.lastTime
            ) / 1000;


        this.lastTime =
            currentTime;


        /*
         * Prevent very large frame jumps.
         */

        deltaTime =
            Math.min(
                Math.max(
                    deltaTime,
                    0
                ),
                0.05
            );


        /*
         * =========================================================
         * PAUSED
         * =========================================================
         *
         * This is used by:
         *
         * - ESC pause
         * - FIRST wrong-route warning
         *
         * In both cases the timer stops.
         */

        if (
            this.paused
        ) {

            this.render();


            requestAnimationFrame(
                (time) => {

                    this.gameLoop(
                        time
                    );

                }
            );


            return;

        }


        /*
         * =========================================================
         * GAME OVER / COMPLETE
         * =========================================================
         */

        if (
            this.gameOver
        ) {

            this.render();


            requestAnimationFrame(
                (time) => {

                    this.gameLoop(
                        time
                    );

                }
            );


            return;

        }


        /*
         * =========================================================
         * TIMER
         * =========================================================
         */

        this.remainingTime -=
            deltaTime;


        if (
            this.remainingTime <=
            0
        ) {

            this.remainingTime =
                0;


            this.ui.updateTimer(
                0
            );


            this.failLevel(
                "TIME UP"
            );


            return;

        }


        this.ui.updateTimer(
            this.remainingTime
        );


        /*
         * =========================================================
         * NORMAL WARNING
         * =========================================================
         *
         * IMPORTANT:
         *
         * There is NO countdown here anymore.
         *
         * startHazardWarning() starts the ghost immediately.
         *
         * This block intentionally remains empty because the
         * previous delayed-warning system has been removed.
         */


        /*
         * =========================================================
         * PLAYER MOVEMENT
         * =========================================================
         */

        const previousPlayerPosition = {

            x:
                this.player.x,

            y:
                this.player.y

        };


        this.player.update(
            window.keys || {},
            currentTime
        );


        /*
         * =========================================================
         * ACTUAL MOVEMENT DIRECTION
         * =========================================================
         */

        const movedDirection = {

            x:
                Math.sign(
                    this.player.x -
                    previousPlayerPosition.x
                ),

            y:
                Math.sign(
                    this.player.y -
                    previousPlayerPosition.y
                )

        };


        /*
         * =========================================================
         * CHECK HIDDEN TRIGGERS
         * =========================================================
         */

        this.collectPlayerPoints();

        this.checkChaseTriggers(

            previousPlayerPosition,

            movedDirection

        );


        /*
         * =========================================================
         * UPDATE GHOSTS
         * =========================================================
         */

        for (
            const hazard of
            this.hazards
        ) {

            if (
                !hazard
            ) {

                continue;

            }


            const wasChasing =
                hazard.isChasing();


            /*
             * Update chasing ghost.
             *
             * Blocking ghost simply remains stationary.
             */

            hazard.update(

                deltaTime,

                this.player

            );


            /*
             * =====================================================
             * PLAYER CAUGHT
             * =====================================================
             *
             * IMPORTANT:
             *
             * This collision check runs for BOTH:
             *
             *     chasing ghosts
             *     blocking/stationary ghosts
             */

            const ghostCollision =
                hazard.isColliding(
                    this.player
                );


            /*
             * Extra explicit stationary-ghost collision check.
             *
             * This guarantees that a ghost which has finished
             * chasing and is permanently blocking a trigger tile
             * is still lethal when the player touches it.
             */

            const stationaryGhostCollision =

                hazard.isBlocking() &&

                hazard.active &&

                Math.abs(
                    hazard.x -
                    this.player.x
                ) < 0.55 &&

                Math.abs(
                    hazard.y -
                    this.player.y
                ) < 0.55;


            if (
                ghostCollision ||
                stationaryGhostCollision
            ) {

                this.failLevel(
                    "You were caught!"
                );


                return;

            }


            /*
             * =====================================================
             * CHASE ENDED
             * =====================================================
             */

            if (

                wasChasing &&

                hazard.isBlocking() &&

                window.gameAudio &&

                window.gameAudio.stopChase

            ) {

                window.gameAudio.stopChase();

            }

        }


        /*
         * =========================================================
         * RECYCLE COMPLETED GHOST ENCOUNTERS
         * =========================================================
         * Ghosts fade out after a chase instead of becoming permanent
         * walls. The original trigger is then moved to a new location,
         * making trigger points continuously change during the level.
         */
        this.recycleFinishedGhostEncounters();


        /*
         * =========================================================
         * EXIT
         * =========================================================
         */

        if (

            this.player.x ===
                this.maze.exit.x &&

            this.player.y ===
                this.maze.exit.y

        ) {

            this.finishLevel();

            return;

        }


        /*
         * =========================================================
         * RENDER
         * =========================================================
         */

        this.render();


        /*
         * Continue animation loop.
         */

        requestAnimationFrame(
            (time) => {

                this.gameLoop(
                    time
                );

            }
        );

    }


    /*
     * =============================================================
     * RECYCLE GHOST ENCOUNTER
     * =============================================================
     */

    recycleFinishedGhostEncounters() {
        if (!this.activeGhostHazards.length) return;

        const encounter = this.activeGhostHazards;
        const finished = encounter.every(h => h && h.isWaiting());
        if (!finished) return;

        const primary = encounter[0];
        const oldKey = `${primary.trigger.x},${primary.trigger.y}`;

        const newCell = this.findFreshTriggerCell();
        if (newCell) {
            primary.trigger = { x: newCell.x, y: newCell.y };
            primary.reset();
            primary.trigger = { x: newCell.x, y: newCell.y };
            this.trapTriggeredCells.delete(oldKey);
            this.triggeredEvents.delete(primary.config.id);
        } else {
            primary.reset();
        }

        /* Remove extra ghosts from the old encounter. */
        const encounterSet = new Set(encounter.slice(1));
        this.hazards = this.hazards.filter(h => !encounterSet.has(h));
        this.activeGhostHazards = [];
    }


    findFreshTriggerCell() {
        if (!this.maze || !this.player) return null;

        const reserved = new Set([
            `${this.maze.start.x},${this.maze.start.y}`,
            `${this.maze.exit.x},${this.maze.exit.y}`,
            `${Math.round(this.player.x)},${Math.round(this.player.y)}`
        ]);

        const candidates = [];
        for (let y = 1; y < this.maze.rows - 1; y++) {
            for (let x = 1; x < this.maze.cols - 1; x++) {
                if (!this.maze.isWalkable(x, y)) continue;
                const key = `${x},${y}`;
                if (reserved.has(key) || this.usedGhostSpawnCells.has(key)) continue;

                const path = this.maze.findPath(
                    { x: Math.round(this.player.x), y: Math.round(this.player.y) },
                    { x, y }
                );
                if (!path || path.length < 7) continue;
                candidates.push({ x, y, distance: path.length - 1 });
            }
        }

        /* Shuffle first, then prefer mid-range cells. This prevents
           trigger locations from feeling fixed or always appearing
           immediately beside the player. */
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        candidates.sort((a, b) => Math.abs(a.distance - 10) - Math.abs(b.distance - 10));
        return candidates[0] || null;
    }


    /*
     * =============================================================
     * DYNAMIC TRIGGERS
     * =============================================================
     */

    createDynamicGhostTriggers(count) {

        const candidates = [];
        const reserved = new Set([
            `${this.maze.start.x},${this.maze.start.y}`,
            `${this.maze.exit.x},${this.maze.exit.y}`
        ]);

        for (let y = 1; y < this.maze.rows - 1; y++) {
            for (let x = 1; x < this.maze.cols - 1; x++) {
                if (!this.maze.isWalkable(x, y)) continue;
                const key = `${x},${y}`;
                if (reserved.has(key)) continue;
                candidates.push({x, y});
            }
        }

        /* Keep triggers separated so the player cannot accidentally
           chain several encounters from adjacent tiles. */
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const chosen = [];
        const minSpacing = Math.max(3, 2 + Math.floor(this.levelIndex / 2));

        for (const cell of candidates) {
            if (chosen.length >= count) break;
            if (chosen.every(other =>
                Math.abs(other.x - cell.x) + Math.abs(other.y - cell.y) >= minSpacing
            )) {
                chosen.push(cell);
            }
        }

        return chosen;
    }


    /*
     * Find reachable ghost spawn cells around the PLAYER, not around
     * the trigger. This makes the encounter dynamic: the same trigger
     * can produce a completely different ambush depending on how the
     * player entered the area.
     */
    getGhostSpawnCandidates(hazard) {

        if (!this.maze || !this.player) return [];

        const px = Math.round(this.player.x);
        const py = Math.round(this.player.y);
        /*
         * IMPORTANT: spawn distance is measured along the ACTUAL maze
         * corridor, not by Manhattan/grid distance. A cell that is two
         * tiles away visually but separated by a wall may be twelve maze
         * steps away, which is not a threatening spawn.
         *
         * Keep ghosts close enough to matter, but never so close that the
         * encounter becomes an unavoidable collision.
         */
        const minPathDistance = 5;
        const maxPathDistance = 6;
        const maxGridRange = 8;
        const candidates = [];
        const seen = new Set();

        for (let y = Math.max(1, py - maxGridRange); y <= Math.min(this.maze.rows - 2, py + maxGridRange); y++) {
            for (let x = Math.max(1, px - maxGridRange); x <= Math.min(this.maze.cols - 2, px + maxGridRange); x++) {
                if (!this.maze.isWalkable(x, y)) continue;

                const key = `${x},${y}`;
                if (seen.has(key)) continue;
                if (this.usedGhostSpawnCells.has(key)) continue;
                if (x === this.maze.exit.x && y === this.maze.exit.y) continue;

                const gridDistance = Math.abs(x - px) + Math.abs(y - py);
                if (gridDistance < 2 || gridDistance > maxGridRange) continue;

                /*
                 * This is the critical fairness/threat test. The ghost must
                 * be 5-6 REAL WALKABLE STEPS from the player. Walls, turns,
                 * and branches therefore count correctly. A visually-close
                 * spawn behind a wall with a 12-step route is rejected.
                 */
                const path = this.maze.findPath({x: px, y: py}, {x, y});
                const pathDistance = path.length > 0 ? path.length - 1 : Infinity;
                if (pathDistance < minPathDistance || pathDistance > maxPathDistance) continue;

                let lane = 'side';
                if (x === px && y < py) lane = 'behind';
                else if (x === px && y > py) lane = 'forward';
                else if (x < px) lane = 'left';
                else if (x > px) lane = 'right';

                candidates.push({
                    x,
                    y,
                    path,
                    lane,
                    distance: pathDistance,
                    gridDistance
                });
                seen.add(key);
            }
        }

        /*
         * Prefer the shortest REAL corridor distance, with enough random
         * jitter to avoid making every encounter happen at exactly the same
         * tile. The important point is that distance here is path distance,
         * so a wall-separated cell can never masquerade as a close threat.
         */
        candidates.sort((a, b) =>
            (a.distance + Math.random() * 0.8) -
            (b.distance + Math.random() * 0.8)
        );

        return candidates;
    }


    /*
     * A fair encounter must leave the player with at least one legal
     * move and a route to the exit. We also require a little distance
     * to the exit so a spawn cannot effectively trap the player in a
     * one-cell pocket immediately after the warning.
     */
    getFairEscapePath(blockedSpawns) {

        if (!this.maze || !this.player || !this.maze.exit) return null;

        const blocked = new Set(blockedSpawns.map(p => `${p.x},${p.y}`));
        const start = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
        const startKey = `${start.x},${start.y}`;
        const exitKey = `${this.maze.exit.x},${this.maze.exit.y}`;

        if (blocked.has(startKey) || blocked.has(exitKey)) return null;

        /*
         * A fair spawn is not just one where the exit is technically
         * reachable.  We explicitly test the player's FIRST MOVES.
         * This prevents the classic bad encounter:
         *
         *       ghost
         *         |
         *       PLAYER
         *         |
         *       ghost
         *
         * where the player has nowhere useful to run even though a
         * long path around the ghosts technically exists.
         */
        const MIN_ESCAPE_STEPS = 10;
        const MIN_INITIAL_RUN_STEPS = 4;
        const MIN_GHOST_LEAD = 3;

        const neighbors = this.maze.getNeighbors(start)
            .filter(n => this.maze.isWalkable(n.x, n.y))
            .filter(n => !blocked.has(`${n.x},${n.y}`));

        if (!neighbors.length) return null;

        const findPathFrom = (origin) => {
            const queue = [{ x: origin.x, y: origin.y, d: 0, path: [origin] }];
            const visited = new Set([`${origin.x},${origin.y}`]);

            while (queue.length) {
                const current = queue.shift();
                const key = `${current.x},${current.y}`;

                if (key === exitKey) return current.path;

                for (const next of this.maze.getNeighbors(current)) {
                    const nextKey = `${next.x},${next.y}`;
                    if (visited.has(nextKey) || blocked.has(nextKey)) continue;
                    if (!this.maze.isWalkable(next.x, next.y)) continue;
                    visited.add(nextKey);
                    queue.push({
                        x: next.x,
                        y: next.y,
                        d: current.d + 1,
                        path: [...current.path, next]
                    });
                }
            }

            return null;
        };

        const fairOptions = [];

        for (const firstStep of neighbors) {
            const path = findPathFrom(firstStep);
            if (!path) continue;

            const fullPath = [start, ...path];
            const escapeSteps = fullPath.length - 1;
            if (escapeSteps < MIN_ESCAPE_STEPS) continue;

            const initialRun = fullPath.slice(1, MIN_INITIAL_RUN_STEPS + 1);
            if (initialRun.length < MIN_INITIAL_RUN_STEPS) continue;

            /*
             * The first few tiles must be genuinely usable.  In
             * particular, a ghost may not occupy or immediately control
             * the player's escape corridor.  We compare actual maze-path
             * distance from each ghost to those tiles, not coordinate
             * distance, so walls cannot fool the test.
             */
            let practical = true;
            for (let step = 0; step < initialRun.length; step++) {
                const point = initialRun[step];
                const pointKey = `${point.x},${point.y}`;
                if (blocked.has(pointKey)) {
                    practical = false;
                    break;
                }

                for (const ghost of blockedSpawns) {
                    const ghostPath = this.maze.findPath(
                        { x: ghost.x, y: ghost.y },
                        { x: point.x, y: point.y }
                    );
                    const ghostDistance = ghostPath && ghostPath.length
                        ? ghostPath.length - 1
                        : Infinity;

                    /*
                     * Give the player a real head start.  At player step
                     * N, a ghost must still be at least N + MIN_GHOST_LEAD
                     * maze steps from that same escape tile.
                     */
                    if (ghostDistance <= step + MIN_GHOST_LEAD) {
                        practical = false;
                        break;
                    }
                }

                if (!practical) break;
            }

            if (!practical) continue;

            fairOptions.push(fullPath);
        }

        if (!fairOptions.length) return null;

        /* Prefer an escape with several choices, but keep randomness so
           the player cannot memorize one guaranteed direction. */
        fairOptions.sort((a, b) => b.length - a.length);
        const topCount = Math.min(3, fairOptions.length);
        return fairOptions[Math.floor(Math.random() * topCount)];
    }

    hasFairEscapeRoute(blockedSpawns, minimumSteps = 10) {
        const path = this.getFairEscapePath(blockedSpawns);
        return !!path && path.length - 1 >= minimumSteps;
    }

    /*
     * =============================================================
     * CHECK CHASE TRIGGERS
     * =============================================================
     */

    checkChaseTriggers(
        previousPlayerPosition,
        movedDirection
    ) {

        /*
         * Never activate another trigger while a normal warning
         * is already active.
         *
         * Normally warningActive is false because the ghost now
         * starts immediately.
         */

        if (
            this.warningActive
        ) {

            return;

        }

        /*
         * Do not overlap separate trigger encounters. The important
         * difference from the old single-ghost lock is that ONE
         * trigger may now create several ghosts. Once all ghosts in
         * that encounter finish chasing, another trigger can fire.
         */
        if (
            this.hazards.some(
                hazard =>
                    hazard &&
                    (hazard.isWarning() || hazard.isChasing())
            )
        ) {

            return;

        }


        if (
            !movedDirection ||
            (
                movedDirection.x === 0 &&
                movedDirection.y === 0
            )
        ) {

            return;

        }


        const x =
            this.player.x;

        const y =
            this.player.y;


        /*
         * Check the randomly generated trigger tiles.
         */

        for (
            const hazard of
            this.hazards
        ) {

            if (
                !hazard ||
                !hazard.isWaiting()
            ) {

                continue;

            }


            const triggerKey =
                `${hazard.trigger.x},${hazard.trigger.y}`;


            if (
                this.trapTriggeredCells.has(
                    triggerKey
                )
            ) {

                continue;

            }


            if (
                x !== hazard.trigger.x ||
                y !== hazard.trigger.y
            ) {

                continue;

            }


            /*
             * =====================================================
             * MULTI-GHOST ENCOUNTER
             * =====================================================
             *
             * One trigger now creates a random 1-3 ghosts. Their
             * spawn tiles are deliberately selected from different
             * maze positions, so several ghosts never materialize on
             * top of each other.
             */

            const ghostCount =
                1 + Math.floor(Math.random() * 3);

            const spawnCandidates =
                this.getGhostSpawnCandidates(hazard);

            if (spawnCandidates.length === 0) {

                console.warn(
                    `[Maze Escape] Trigger ${triggerKey} could not prepare a ghost spawn.`
                );

                continue;
            }

            /*
             * Choose 1-3 positions while preserving at least one
             * meaningful player-to-exit route. If three ghosts would
             * seal the maze, gracefully reduce the encounter to two or
             * one rather than creating an impossible situation.
             */
            const encounterGhosts = [];
            const selectedSpawns = [];

            /*
             * Pick ghosts one at a time, but judge the WHOLE encounter.
             * A spawn is only accepted when the player still has a real
             * escape corridor with enough distance to react.
             *
             * The important distinction is that we do NOT merely ask
             * "is the exit reachable?". A one-cell route to the exit is
             * technically reachable but is not a fair escape during a
             * chase. The helper below requires a practical amount of
             * running room and checks the first few steps of that route.
             */
            const remaining = [...spawnCandidates];
            while (selectedSpawns.length < ghostCount && remaining.length) {
                let bestIndex = -1;
                let bestScore = Infinity;

                for (let i = 0; i < remaining.length; i++) {
                    const candidate = remaining[i];
                    const proposed = [...selectedSpawns, candidate];
                    const escape = this.getFairEscapePath(proposed);
                    if (!escape) continue;

                    /*
                     * Do not deliberately put a ghost directly on the
                     * player's best escape corridor. This leaves the player
                     * a genuine decision instead of creating a fake route
                     * that is already occupied at spawn time.
                     */
                    const escapeKeys = new Set(escape.map(p => `${p.x},${p.y}`));
                    if (escapeKeys.has(`${candidate.x},${candidate.y}`)) continue;

                    /* Prefer threatening 5-6 step spawns and vary approach
                       directions. A little randomness prevents a fixed
                       pattern from becoming memorisable. */
                    const duplicateLane = selectedSpawns.some(s => s.lane === candidate.lane);
                    const diversityPenalty = duplicateLane ? 3.5 : 0;
                    const escapeBonus = Math.max(0, 14 - escape.length) * 0.12;
                    const score = candidate.distance + diversityPenalty + escapeBonus + Math.random() * 1.5;

                    if (score < bestScore) {
                        bestScore = score;
                        bestIndex = i;
                    }
                }

                if (bestIndex < 0) break;
                selectedSpawns.push(remaining[bestIndex]);
                remaining.splice(bestIndex, 1);
            }

            if (!selectedSpawns.length) {
                console.warn(
                    `[Maze Escape] No fair ghost placement for trigger ${triggerKey}; encounter skipped.`
                );
                continue;
            }

            for (let i = 0; i < selectedSpawns.length; i++) {
                const targetHazard =
                    i === 0
                        ? hazard
                        : new ChaseBlock(
                            this.maze,
                            {
                                ...hazard.config,
                                id: `${hazard.config.id}-ghost-${i + 1}`
                            }
                        );

                const candidate = selectedSpawns[i];
                const dx = Math.sign(candidate.x - this.player.x);
                const dy = Math.sign(candidate.y - this.player.y);
                const direction =
                    Math.abs(dx) >= Math.abs(dy)
                        ? { x: dx || 1, y: 0 }
                        : { x: 0, y: dy || 1 };

                const prepared = targetHazard.prepareSpawn(
                    direction,
                    candidate
                );

                if (prepared) {
                    targetHazard.spawnIndex = i;
                    encounterGhosts.push(targetHazard);
                    this.usedGhostSpawnCells.add(`${selectedSpawns[i].x},${selectedSpawns[i].y}`);
                }
            }

            if (!encounterGhosts.length) {
                continue;
            }

            /* Additional ghosts are now real hazards for collision,
               rendering and chase updates, but they share the same
               consumed physical trigger. */
            for (const extraGhost of encounterGhosts.slice(1)) {
                this.hazards.push(extraGhost);
            }

            /* Consume this trigger only for the current encounter.
               Once the ghosts fade out it will be moved to a fresh
               walkable location, so trigger points continuously change. */
            this.trapTriggeredCells.add(triggerKey);
            this.triggeredEvents.add(hazard.config.id);
            const encounterId = `${hazard.config.id}-${Date.now()}-${Math.random()}`;
            for (const ghost of encounterGhosts) ghost.encounterId = encounterId;
            this.activeGhostHazards = encounterGhosts;

            this.startHazardWarning(
                encounterGhosts
            );


            break;

        }

    }


    /*
     * =============================================================
     * FIRST ENCOUNTER WARNING
     * =============================================================
     *
     * This is shown ONLY ONCE for the entire game session.
     *
     * The game is completely paused until CONTINUE is pressed.
     */

    startFirstEncounterWarning(hazard) {

        this.firstEncounterWarningShown =
            true;


        this.pendingHazard =
            hazard;


        /*
         * Normal warning is not needed here.
         */

        this.warningActive =
            false;


        this.warningRemaining =
            0;


        /*
         * PAUSE THE ENTIRE GAME.
         *
         * This also stops the timer because gameLoop() returns
         * from the paused section.
         */

        this.paused =
            true;


        this.ui.hideWarning();


        /*
         * Remove an old copy if one somehow exists.
         */

        const oldOverlay =
            document.getElementById(
                "maze-first-encounter-warning"
            );


        if (
            oldOverlay
        ) {

            oldOverlay.remove();

        }


        /*
         * =========================================================
         * CREATE CENTER WARNING
         * =========================================================
         */

        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "maze-first-encounter-warning";


        overlay.setAttribute(
            "role",
            "dialog"
        );


        overlay.setAttribute(
            "aria-modal",
            "true"
        );


        overlay.innerHTML = `

            <div class="maze-first-warning-card">

                <div class="maze-first-warning-icon">
                    ⚠
                </div>

                <div class="maze-first-warning-title">
                    WRONG ROUTE
                </div>

                <div class="maze-first-warning-text">
                    You took a wrong route.<br>
                    Get ready for the haunting.
                </div>

                <div class="maze-first-warning-coming">
                    SOMETHING<br>
                    IS COMING
                </div>

                <button
                    type="button"
                    id="maze-first-warning-continue"
                >
                    CONTINUE
                </button>

            </div>

        `;


        /*
         * =========================================================
         * FULLSCREEN OVERLAY
         * ========================================================= */

        overlay.style.position =
            "fixed";

        overlay.style.inset =
            "0";

        overlay.style.zIndex =
            "99999";

        overlay.style.display =
            "flex";

        overlay.style.alignItems =
            "center";

        overlay.style.justifyContent =
            "center";

        overlay.style.padding =
            "24px";

        overlay.style.boxSizing =
            "border-box";

        overlay.style.background =
            "rgba(0, 0, 0, 0.84)";

        overlay.style.backdropFilter =
            "blur(5px)";

        overlay.style.fontFamily =
            "Arial, Helvetica, sans-serif";


        /*
         * =========================================================
         * WARNING CARD
         * ========================================================= */

        const card =
            overlay.querySelector(
                ".maze-first-warning-card"
            );


        card.style.width =
            "min(560px, 92vw)";


        card.style.boxSizing =
            "border-box";


        card.style.padding =
            "42px 36px 34px";


        card.style.textAlign =
            "center";


        card.style.background =
            "rgba(10, 5, 8, 0.98)";


        card.style.border =
            "2px solid rgba(255, 50, 65, 0.9)";


        card.style.borderRadius =
            "14px";


        card.style.boxShadow =
            "0 0 45px rgba(255, 0, 30, 0.35), 0 20px 80px rgba(0, 0, 0, 0.75)";


        card.style.color =
            "#ffffff";


        /*
         * =========================================================
         * WARNING ICON
         * ========================================================= */

        const icon =
            overlay.querySelector(
                ".maze-first-warning-icon"
            );


        icon.style.fontSize =
            "44px";


        icon.style.lineHeight =
            "1";


        icon.style.marginBottom =
            "14px";


        /*
         * =========================================================
         * WRONG ROUTE TITLE
         * ========================================================= */

        const title =
            overlay.querySelector(
                ".maze-first-warning-title"
            );


        title.style.fontSize =
            "30px";


        title.style.fontWeight =
            "900";


        title.style.letterSpacing =
            "4px";


        title.style.marginBottom =
            "16px";


        /*
         * =========================================================
         * DESCRIPTION
         * ========================================================= */

        const text =
            overlay.querySelector(
                ".maze-first-warning-text"
            );


        text.style.fontSize =
            "18px";


        text.style.lineHeight =
            "1.7";


        text.style.color =
            "rgba(255,255,255,0.86)";


        text.style.marginBottom =
            "24px";


        /*
         * =========================================================
         * SOMETHING IS COMING
         * ========================================================= */

        const coming =
            overlay.querySelector(
                ".maze-first-warning-coming"
            );


        coming.style.fontSize =
            "32px";


        coming.style.lineHeight =
            "1.08";


        coming.style.fontWeight =
            "900";


        coming.style.letterSpacing =
            "5px";


        coming.style.margin =
            "10px 0 30px";


        coming.style.color =
            "#ff3347";


        coming.style.textShadow =
            "0 0 18px rgba(255, 0, 30, 0.75)";


        /*
         * =========================================================
         * CONTINUE BUTTON
         * ========================================================= */

        const continueButton =
            overlay.querySelector(
                "#maze-first-warning-continue"
            );


        continueButton.style.border =
            "1px solid rgba(255,255,255,0.5)";


        continueButton.style.borderRadius =
            "7px";


        continueButton.style.padding =
            "13px 34px";


        continueButton.style.fontSize =
            "15px";


        continueButton.style.fontWeight =
            "800";


        continueButton.style.letterSpacing =
            "2px";


        continueButton.style.cursor =
            "pointer";


        continueButton.style.color =
            "#ffffff";


        continueButton.style.background =
            "rgba(255, 35, 55, 0.18)";


        continueButton.style.boxShadow =
            "0 0 18px rgba(255, 0, 30, 0.2)";


        /*
         * CONTINUE CLICK
         */

        continueButton.addEventListener(
            "click",
            () => {

                this.continueAfterFirstEncounter();

            }
        );


        /*
         * ENTER / SPACE can also continue.
         */

        overlay.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    this.continueAfterFirstEncounter();

                }

            }
        );


        /*
         * Add overlay to document.
         */

        document.body.appendChild(
            overlay
        );


        this.firstEncounterOverlay =
            overlay;


        /*
         * Focus CONTINUE automatically.
         */

        setTimeout(
            () => {

                if (
                    continueButton
                ) {

                    continueButton.focus();

                }

            },
            0
        );


        /*
         * Warning sound.
         */

        if (
            window.gameAudio &&
            window.gameAudio.warning
        ) {

            window.gameAudio.warning();

        }

    }


    /*
     * =============================================================
     * CONTINUE AFTER FIRST ENCOUNTER
     * =============================================================
     */

    continueAfterFirstEncounter() {

        /*
         * Only valid while the first warning is pausing the game.
         */

        if (
            !this.paused
        ) {

            return;

        }


        /*
         * Remove warning overlay.
         */

        if (
            this.firstEncounterOverlay
        ) {

            this.firstEncounterOverlay.remove();

            this.firstEncounterOverlay =
                null;

        }

        else {

            const overlay =
                document.getElementById(
                    "maze-first-encounter-warning"
                );


            if (
                overlay
            ) {

                overlay.remove();

            }

        }


        /*
         * Resume game.
         */

        this.paused =
            false;


        /*
         * Start the ghost immediately after CONTINUE.
         */

        if (
            this.pendingHazard
        ) {

            const hazard =
                this.pendingHazard;


            this.pendingHazard =
                null;


            hazard.beginChase();


            /*
             * Chase audio.
             */

            if (
                window.gameAudio
            ) {

                if (
                    window.gameAudio.blockAppear
                ) {

                    window.gameAudio.blockAppear();

                }


                if (
                    window.gameAudio.chaseStart
                ) {

                    window.gameAudio.chaseStart();

                }

            }

        }


        /*
         * Reset frame timing so the paused time is not counted
         * against the timer.
         */

        this.lastTime =
            performance.now();


        this.render();

    }


    /*
     * =============================================================
     * NORMAL HAZARD WARNING
     * =============================================================
     *
     * IMPORTANT:
     *
     * This no longer waits for warningTime.
     *
     * The warning sound, ghost appearance and chase all start
     * immediately.
     */

    startHazardWarning(hazards) {

        const encounterGhosts =
            Array.isArray(hazards) ? hazards : [hazards];

        /*
         * There is no pending delayed hazard anymore.
         */

        this.pendingHazard =
            null;


        this.warningActive =
            false;


        this.warningRemaining =
            0;


        /*
         * =========================================================
         * RED WARNING FLASH
         * =========================================================
         */

        this.ui.setWarningText(
            encounterGhosts.length > 1
                ? `⚠  ${encounterGhosts.length} GHOSTS ARE COMING`
                : "⚠  SOMETHING IS COMING"
        );


        this.ui.showWarning();


        /*
         * =========================================================
         * WARNING SOUND
         * =========================================================
         *
         * This plays immediately when the trigger is reached.
         */

        if (
            window.gameAudio &&
            window.gameAudio.warning
        ) {

            window.gameAudio.warning();

        }


        /*
         * =========================================================
         * GHOST STARTS IMMEDIATELY
         * =========================================================
         */

        for (const ghost of encounterGhosts) {

            if (ghost && ghost.isWarning()) {
                ghost.beginChase();
            }
        }


        /*
         * =========================================================
         * GHOST APPEAR + CHASE AUDIO
         * ========================================================= */

        if (
            window.gameAudio
        ) {

            if (
                window.gameAudio.blockAppear
            ) {

                window.gameAudio.blockAppear();

            }


            if (
                window.gameAudio.chaseStart
            ) {

                window.gameAudio.chaseStart();

            }

        }


        /*
         * =========================================================
         * HIDE THE WARNING FLASH
         * =========================================================
         *
         * The flash is only visual.
         *
         * It does NOT delay the ghost.
         */

        setTimeout(
            () => {

                if (
                    this.running &&
                    !this.gameOver
                ) {

                    this.ui.hideWarning();

                }

            },
            350
        );

    }


    /*
     * =============================================================
     * POINTS / COLLECTIBLES
     * =============================================================
     */

    createCollectibles() {
        const safe = new Set((this.randomEscapePath || []).map(p => `${p.x},${p.y}`));
        const blocked = new Set();
        for (const h of this.hazards || []) blocked.add(`${h.trigger.x},${h.trigger.y}`);

        const candidates = [];
        for (let y = 0; y < this.maze.rows; y++) {
            for (let x = 0; x < this.maze.cols; x++) {
                if (!this.maze.isWalkable(x, y)) continue;
                if ((x === this.maze.start.x && y === this.maze.start.y) || (x === this.maze.exit.x && y === this.maze.exit.y)) continue;
                if (blocked.has(`${x},${y}`)) continue;
                const key = `${x},${y}`;
                const degree = this.maze.getDegree({x, y});
                let value = safe.has(key) ? 10 : 15;
                if (degree >= 3) value += 5;
                candidates.push({x, y, value, collected: false});
            }
        }

        // Spread collectibles through the maze instead of clustering them.
        this.maze.shuffle(candidates);
        const chosen = [];
        const targetCount = Math.min(14 + this.levelIndex * 3, 28);
        for (const c of candidates) {
            if (chosen.some(o => Math.abs(o.x-c.x)+Math.abs(o.y-c.y) < 4)) continue;
            chosen.push(c);
            if (chosen.length >= targetCount) break;
        }
        this.collectibles = chosen;
    }

    collectPlayerPoints() {
        if (!this.collectibles) return;
        for (const item of this.collectibles) {
            if (item.collected) continue;
            if (item.x !== this.player.x || item.y !== this.player.y) continue;
            item.collected = true;
            this.combo += 1;
            const bonus = this.combo % 5 === 0 ? 25 : 0;
            const gained = item.value + bonus;
            this.score += gained;
            this.levelScore += gained;
            this.updateScoreUI();
            if (window.gameAudio && window.gameAudio.collect) window.gameAudio.collect();
        }
    }

    updateScoreUI() {
        if (this.ui && this.ui.updateScore) this.ui.updateScore(this.score, this.levelScore);
    }

    /*
     * =============================================================
     * RENDER
     * =============================================================
     */

    render() {

        if (
            !this.renderer ||
            !this.player
        ) {

            return;

        }


        this.renderer.draw(

            this.player,

            this.hazards,

            this.collectibles

        );

    }


    /*
     * =============================================================
     * PAUSE
     * =============================================================
     */

    pause() {

        /*
         * Do not replace the special first encounter warning.
         */

        if (
            this.firstEncounterOverlay
        ) {

            return;

        }


        if (

            this.paused ||

            this.gameOver ||

            !this.running

        ) {

            return;

        }


        this.paused =
            true;


        this.ui.showPause(

            () =>
                this.resume(),

            () =>
                this.exitToMenu()

        );


        /*
         * Pause audio.
         */

        if (

            window.gameAudio &&

            window.gameAudio.pause

        ) {

            window.gameAudio.pause();

        }

    }


    /*
     * =============================================================
     * RESUME
     * =============================================================
     */

    resume() {

        /*
         * Never resume through the normal pause button while
         * first-encounter warning is active.
         */

        if (
            this.firstEncounterOverlay
        ) {

            return;

        }


        if (
            !this.paused
        ) {

            return;

        }


        this.paused =
            false;


        this.ui.hidePause();


        /*
         * Reset timing.
         */

        this.lastTime =
            performance.now();


        /*
         * Resume audio.
         */

        if (

            window.gameAudio &&

            window.gameAudio.resume

        ) {

            window.gameAudio.resume();

        }

    }


    /*
     * =============================================================
     * LEVEL COMPLETE
     * =============================================================
     */

    finishLevel() {

        /*
         * Prevent the exit tile from calling finishLevel repeatedly.
         */

        if (
            this.levelFinished
        ) {

            return;

        }


        this.levelFinished =
            true;


        /*
         * Remove first warning if necessary.
         */

        if (
            this.firstEncounterOverlay
        ) {

            this.firstEncounterOverlay.remove();

            this.firstEncounterOverlay =
                null;

        }


        this.paused =
            false;


        this.warningActive =
            false;


        this.warningRemaining =
            0;


        this.pendingHazard =
            null;


        this.gameOver =
            true;


        /*
         * Stop chase audio and play completion sound.
         */

        if (
            window.gameAudio
        ) {

            if (
                window.gameAudio.stopChase
            ) {

                window.gameAudio.stopChase();

            }


            if (
                window.gameAudio.levelComplete
            ) {

                window.gameAudio.levelComplete();

            }

        }


        /*
         * =========================================================
         * MORE LEVELS
         * =========================================================
         */

        if (

            this.levelIndex <
            LEVELS.length - 1

        ) {

            this.ui.showLevelComplete(

                "You escaped this level."

            );


            this.ui.setRestartAction(
                () => {

                    this.restartLevel(

                        this.levelIndex + 1

                    );

                }
            );


            return;

        }


        /*
         * =========================================================
         * ALL LEVELS COMPLETE
         * =========================================================
         */

        if (

            window.gameAudio &&

            window.gameAudio.gameComplete

        ) {

            window.gameAudio.gameComplete();

        }


        this.ui.showGameComplete(this.score);


        /*
         * PLAY AGAIN starts from Level 1.
         */

        this.ui.setRestartAction(
            () => {

                this.restartLevel(
                    0
                );

            }
        );

    }


    /*
     * =============================================================
     * GAME OVER
     * =============================================================
     */

    failLevel(message) {

        /*
         * Remove first encounter warning if necessary.
         */

        if (
            this.firstEncounterOverlay
        ) {

            this.firstEncounterOverlay.remove();

            this.firstEncounterOverlay =
                null;

        }


        this.paused =
            false;


        /*
         * Prevent duplicate game-over calls.
         */

        if (
            this.gameOver
        ) {

            return;

        }


        this.gameOver =
            true;


        /*
         * Stop warning state.
         */

        this.warningActive =
            false;


        this.warningRemaining =
            0;


        this.pendingHazard =
            null;


        this.ui.hideWarning();


        /*
         * Audio.
         */

        if (
            window.gameAudio
        ) {

            if (
                window.gameAudio.stopChase
            ) {

                window.gameAudio.stopChase();

            }


            if (
                message === "TIME UP"
            ) {

                if (
                    window.gameAudio.timeUp
                ) {

                    window.gameAudio.timeUp();

                }

            }

            else {

                if (
                    window.gameAudio.caught
                ) {

                    window.gameAudio.caught();

                }

            }

        }


        /*
         * Show GAME OVER.
         */

        this.ui.showGameOver(
            message,
            this.score
        );

        /* Retry always starts a completely new run at Level 1,
         * including a fresh collectible/score state. */
        this.ui.setRestartAction(
            () => {
                this.restartLevel(0);
            }
        );

        if (this.ui.setGameOverExitAction) {
            this.ui.setGameOverExitAction(() => this.exitToMenu());
        }

    }


    /*
     * =============================================================
     * RESTART LEVEL
     * =============================================================
     */

    restartLevel(index) {

        /*
         * Restarting Level 1 means a completely new game.
         *
         * Therefore the special first encounter warning can appear
         * again.
         */

        if (
            index === 0
        ) {

            this.firstEncounterWarningShown =
                false;

            /* A retry is a completely fresh run. */
            this.score = 0;
            this.levelScore = 0;
            this.combo = 0;

        }


        /*
         * Remove special warning overlay.
         */

        if (
            this.firstEncounterOverlay
        ) {

            this.firstEncounterOverlay.remove();

            this.firstEncounterOverlay =
                null;

        }


        /*
         * Reset state.
         */

        this.paused =
            false;


        this.gameOver =
            false;


        this.levelFinished =
            false;


        /*
         * Stop old animation loop logically.
         */

        this.running =
            false;


        /*
         * Hide old overlays.
         */

        this.ui.hideWarning();

        this.ui.hideOverlay();

        this.ui.hidePause();

        this.ui.hideExit();


        /*
         * Start the new level.
         */

        this.running =
            true;


        this.loadLevel(
            index
        );


        /*
         * Reset frame timing.
         */

        this.lastTime =
            performance.now();


        /*
         * Start a fresh animation loop.
         */

        requestAnimationFrame(
            (time) => {

                this.gameLoop(
                    time
                );

            }
        );

    }


    /*
     * =============================================================
     * EXIT TO MENU
     * =============================================================
     */

    exitToMenu() {

        /*
         * Remove special warning overlay.
         */

        if (
            this.firstEncounterOverlay
        ) {

            this.firstEncounterOverlay.remove();

            this.firstEncounterOverlay =
                null;

        }


        /*
         * Stop gameplay.
         */

        this.paused =
            false;


        this.running =
            false;


        this.gameOver =
            false;


        this.warningActive =
            false;


        this.warningRemaining =
            0;


        this.pendingHazard =
            null;


        /*
         * Stop audio.
         */

        if (

            window.gameAudio &&

            window.gameAudio.exit

        ) {

            window.gameAudio.exit();

        }


        /*
         * Hide pause/warning UI.
         */

        this.ui.hidePause();

        this.ui.hideWarning();


        /*
         * Show exit screen.
         */

        this.ui.showExit(this.score);


        /*
         * PLAY AGAIN starts a completely new game.
         */

        this.ui.setRestartAction(
            () => {

                this.restartLevel(
                    0
                );

            }
        );

    }

}
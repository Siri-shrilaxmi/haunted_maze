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
         * SAFE ROUTE
         * =========================================================
         */

        const recentSafeRoutes =
            this.recentSafeRouteSignatures.get(
                level.id
            ) || [];


        const routePlan =
            this.maze.chooseRandomEscapeRoute(
                recentSafeRoutes
            );


        /*
         * Remember the selected safe route.
         */

        if (
            routePlan.path &&
            routePlan.path.length
        ) {

            const signature =
                this.maze.routeSignature(
                    routePlan.path
                );


            const updatedHistory = [

                ...recentSafeRoutes.filter(
                    item =>
                        item !== signature
                ),

                signature

            ].slice(-5);


            this.recentSafeRouteSignatures.set(
                level.id,
                updatedHistory
            );

        }


        this.randomEscapePath =
            routePlan.path || [];

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


        this.hazardTemplates =
            [
                chaseTemplate
            ];


        /*
         * =========================================================
         * CREATE HIDDEN TRIGGERS
         * =========================================================
         */

        this.hazards =
            (
                routePlan.gates ||
                []
            ).map(
                (
                    gate,
                    index
                ) => {

                    return new ChaseBlock(

                        this.maze,

                        {

                            ...chaseTemplate,

                            id:
                                `random-route-${level.id}-${index + 1}`,

                            trigger: {

                                x:
                                    gate.x,

                                y:
                                    gate.y

                            },

                            routeIndex:
                                gate.routeIndex,

                            plannedDirection:
                                gate.direction
                                    ? {

                                        x:
                                            gate.direction.x,

                                        y:
                                            gate.direction.y

                                    }
                                    : null,

                            plannedSpawn:
                                gate.spawn
                                    ? {

                                        x:
                                            gate.spawn.x,

                                        y:
                                            gate.spawn.y

                                    }
                                    : null,

                            plannedSpawnPath:
                                gate.spawnPath
                                    ? gate.spawnPath.map(
                                        point => ({

                                            x:
                                                point.x,

                                            y:
                                                point.y

                                        })
                                    )
                                    : []

                        }

                    );

                }
            );


        console.info(

            `[Maze Escape] Level ${level.id}: ` +

            `${routePlan.routeCount || 0} actual S->E routes; ` +

            `safe route index = ${routePlan.safeRouteIndex}; ` +

            `non-safe routes = ${routePlan.nonSafeRouteCount || 0}; ` +

            `hidden triggers = ${this.hazards.length}`

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
     * Build distinct spawn locations for a single trigger.
     * The preferred locations are behind the player (ambush), with
     * progressively different distances. Side/forward corridors are
     * used as fallbacks when the maze geometry is tight.
     */
    getGhostSpawnCandidates(hazard, direction) {

        const dx = Math.sign(direction?.x || 0);
        const dy = Math.sign(direction?.y || 0);

        if ((dx === 0 && dy === 0) || (dx !== 0 && dy !== 0)) {
            return [];
        }

        const behind = { x: -dx, y: -dy };
        const forward = { x: dx, y: dy };
        const left = { x: dy, y: -dx };
        const right = { x: -dy, y: dx };

        const base = Math.max(3, Math.floor(hazard.config.spawnDistance || 5));
        const candidates = [];
        const seen = new Set();

        /*
         * Do NOT make "behind" the default anymore.
         * A good ambush should force the player to make a decision:
         * the ghost can appear behind, ahead, or on either side.
         * Several distances are sampled so the encounter does not feel
         * like the same scripted event every time.
         */
        const directionPool = [
            { dir: behind, lane: "behind" },
            { dir: forward, lane: "forward" },
            { dir: left, lane: "left" },
            { dir: right, lane: "right" },
            { dir: behind, lane: "behind" },
            { dir: forward, lane: "forward" },
            { dir: left, lane: "left" },
            { dir: right, lane: "right" }
        ];

        for (const entry of directionPool) {
            /* Small random distance variation prevents fixed spawn spots. */
            const distance = base + Math.floor(Math.random() * 4);
            const result = this.maze.findSixStepsAhead(
                hazard.trigger,
                entry.dir,
                distance
            );

            if (!result) continue;

            const key = `${result.x},${result.y}`;
            if (seen.has(key)) continue;
            if (this.usedGhostSpawnCells && this.usedGhostSpawnCells.has(key)) continue;

            const playerDistance =
                Math.abs(result.x - this.player.x) +
                Math.abs(result.y - this.player.y);

            if (playerDistance < 3) continue;

            if (this.maze.exit &&
                result.x === this.maze.exit.x &&
                result.y === this.maze.exit.y) {
                continue;
            }

            if ((this.hazards || []).some(h =>
                h && h.active && h.x === result.x && h.y === result.y)) {
                continue;
            }

            seen.add(key);
            candidates.push({
                x: result.x,
                y: result.y,
                path: result.path || [],
                lane: entry.lane,
                preferred: entry.lane !== "behind"
            });
        }

        /*
         * Shuffle equally rather than sorting behind-first.  This is
         * deliberately random: the player must not learn that running
         * forward always escapes a ghost encounter.
         */
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        return candidates;
    }


    /**
     * Check whether the player still has a real route to the exit when
     * the proposed ghost spawn tiles are treated as temporarily blocked.
     * This prevents the engine from creating an unavoidable trap.
     */
    hasFairEscapeRoute(blockedSpawns, minimumSteps = 4) {

        if (!this.maze || !this.player || !this.maze.exit) return false;

        const blocked = new Set(
            blockedSpawns.map(p => `${p.x},${p.y}`)
        );

        const startKey = `${this.player.x},${this.player.y}`;
        const exitKey = `${this.maze.exit.x},${this.maze.exit.y}`;

        if (blocked.has(startKey) || blocked.has(exitKey)) return false;

        const queue = [{ x: this.player.x, y: this.player.y, d: 0 }];
        const visited = new Set([startKey]);

        while (queue.length) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;

            if (key === exitKey) {
                return current.d >= minimumSteps;
            }

            for (const next of this.maze.getNeighbors(current)) {
                const nextKey = `${next.x},${next.y}`;

                if (visited.has(nextKey) || blocked.has(nextKey)) continue;
                if (!this.maze.isWalkable(next.x, next.y)) continue;

                visited.add(nextKey);
                queue.push({ x: next.x, y: next.y, d: current.d + 1 });
            }
        }

        return false;
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
                this.getGhostSpawnCandidates(
                    hazard,
                    movedDirection
                );

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
             * Build the encounter in random order, but avoid the old
             * "all ghosts behind the player" pattern.  If possible,
             * the encounter contains at least one forward/side ghost.
             * This makes simply holding the forward key unreliable.
             */
            const nonBehind = spawnCandidates.filter(c => c.lane !== "behind");
            const behindCandidates = spawnCandidates.filter(c => c.lane === "behind");

            const shuffled = (items) => {
                const result = [...items];
                for (let i = result.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [result[i], result[j]] = [result[j], result[i]];
                }
                return result;
            };

            /* For a multi-ghost encounter, deliberately seed one ghost
             * away from behind whenever a fair position exists. */
            const preferredOrder = ghostCount > 1 && nonBehind.length
                ? [...shuffled(nonBehind), ...shuffled(behindCandidates)]
                : shuffled(spawnCandidates);

            for (const candidate of preferredOrder) {
                if (selectedSpawns.length >= ghostCount) break;

                const proposed = [...selectedSpawns, candidate];

                if (!this.hasFairEscapeRoute(proposed, 4)) continue;

                selectedSpawns.push(candidate);
            }

            /* If we got only a behind spawn for a multi-ghost encounter,
             * try explicitly to replace/add a non-behind position. */
            if (ghostCount > 1 &&
                selectedSpawns.length > 1 &&
                selectedSpawns.every(c => c.lane === "behind")) {

                for (const candidate of shuffled(nonBehind)) {
                    const withoutBehind = selectedSpawns.slice(1);
                    const proposed = [candidate, ...withoutBehind];
                    if (this.hasFairEscapeRoute(proposed, 4)) {
                        selectedSpawns.splice(0, selectedSpawns.length, ...proposed);
                        break;
                    }
                }
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

                const prepared = targetHazard.prepareSpawn(
                    movedDirection,
                    selectedSpawns[i]
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

            /* Mark this physical trigger permanently activated. */
            this.trapTriggeredCells.add(triggerKey);
            this.triggeredEvents.add(hazard.config.id);
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
            `${message} | FINAL SCORE: ${String(this.score).padStart(5, "0")}`
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
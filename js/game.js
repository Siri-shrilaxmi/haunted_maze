class Game {

    constructor(canvas, ui) {

        this.canvas =
            canvas;

        this.ui =
            ui;


        this.levelIndex =
            0;


        this.maze =
            null;

        this.player =
            null;

        this.hazards =
            [];

        // Level chase settings are used as templates. The actual
        // trigger position is selected dynamically from the route
        // the player chooses during the current run.
        this.hazardTemplates =
            [];

        this.trapTriggeredCells =
            new Set();


        /*
         * Keep the original Renderer.
         */
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
         * WARNING STATE
         * =========================================================
         *
         * While warningActive is true:
         *
         * - Player does not move
         * - Timer does not decrease
         * - Ghost does not move
         *
         */

        this.warningActive =
            false;

        this.warningRemaining =
            0;

        this.pendingHazard =
            null;


        /*
         * Events that have already been triggered.
         *
         * Once an event is triggered it cannot trigger again
         * during this level.
         */
        this.triggeredEvents =
            new Set();

        /*
         * Recent safe-route history, kept separately for each level.
         * We use this to make repeated restarts visibly random instead of
         * merely hoping Math.random does not select the same route again.
         */
        this.recentSafeRouteSignatures = new Map();

    }


    /*
     * =============================================================
     * START GAME
     * =============================================================
     */

    start() {

        /*
         * Prevent accidentally creating multiple
         * animation loops.
         */
        if (this.running) {
            return;
        }


        this.running =
            true;


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
         * LEVEL THEME
         * =========================================================
         *
         * Store the theme on the maze.
         *
         * The Renderer reads this value to decide how the
         * current level should look.
         *
         * Level 1:
         *     "Digital World"
         *
         * Level 2:
         *     "Forgotten Jungle"
         *
         * Level 3:
         *     "Frozen Wilderness"
         *
         * Level 4:
         *     "Forgotten Palace"
         *
         */

        this.maze.theme =
            level.theme;


        /*
         * =========================================================
         * PLAYER
         * =========================================================
         *
         * Keep the existing Player API.
         */

        this.player =
            new Player(
                this.maze
            );


        /*
         * =========================================================
         * RANDOM SAFE ROUTE + RANDOM HIDDEN TRIGGERS
         * =========================================================
         *
         * Every fresh load generates a new gameplay layout from the
         * EXISTING physical maze. The map strings are never changed.
         *
         * Maze chooses:
         *   1. one S -> E route that contains no triggers
         *   2. one hidden trigger on EVERY competing S -> E route
         *   3. six maze steps of spawn clearance; those steps may turn
         *
         * The triggers are created now, but remain invisible until
         * the player actually steps on one.
         */

        this.hazardTemplates = [];
        this.hazards = [];
        this.trapTriggeredCells.clear();

        /*
         * One route is safe for this entire round. Every other actual
         * S -> E route receives one hidden trigger. There is deliberately
         * NO maxTriggers cap here: a cap would violate the mandatory
         * one-trigger-per-non-safe-route rule.
         */
        const recentSafeRoutes =
            this.recentSafeRouteSignatures.get(level.id) || [];

        const routePlan =
            this.maze.chooseRandomEscapeRoute(
                recentSafeRoutes
            );

        if (routePlan.path && routePlan.path.length) {
            const signature =
                this.maze.routeSignature(routePlan.path);

            const updatedHistory = [
                ...recentSafeRoutes.filter(item => item !== signature),
                signature
            ].slice(-5);

            this.recentSafeRouteSignatures.set(
                level.id,
                updatedHistory
            );
        }

        this.randomEscapePath =
            routePlan.path || [];

        /*
         * Store the level's chase settings in one template. There are
         * no fixed trigger coordinates in levels.js anymore.
         */
        const chaseTemplate = {
            spawnDistance: level.spawnDistance || 6,
            warningTime: level.warningTime || 1500,
            speed: level.speed || 3.5,
            maxDuration: level.maxDuration || 3,
            maxDistance: level.maxDistance || 10
        };

        this.hazardTemplates = [chaseTemplate];

        this.hazards =
            (routePlan.gates || []).map((gate, index) => {
                return new ChaseBlock(
                    this.maze,
                    {
                        ...chaseTemplate,
                        id: `random-route-${level.id}-${index + 1}`,
                        trigger: {
                            x: gate.x,
                            y: gate.y
                        },
                        routeIndex: gate.routeIndex,
                        plannedDirection: gate.direction
                            ? { x: gate.direction.x, y: gate.direction.y }
                            : null,
                        plannedSpawn: gate.spawn
                            ? { x: gate.spawn.x, y: gate.spawn.y }
                            : null,
                        plannedSpawnPath: gate.spawnPath
                            ? gate.spawnPath.map(point => ({ x: point.x, y: point.y }))
                            : []
                    }
                );
            });

        console.info(
            `[Maze Escape] Level ${level.id}: ${routePlan.routeCount || 0} actual S->E routes; safe route index = ${routePlan.safeRouteIndex}; non-safe routes = ${routePlan.nonSafeRouteCount || 0}; hidden triggers = ${this.hazards.length}`
        );

        this.trapTriggeredCells.clear();


        /*
         * =========================================================
         * RENDERER
         * =========================================================
         *
         * The Renderer automatically checks:
         *
         *     this.maze.theme
         *
         * and changes the visual appearance accordingly.
         *
         * The actual gameplay logic is unchanged.
         */

        this.renderer =
            new Renderer(
                this.canvas,
                this.maze
            );


        /*
         * =========================================================
         * RESET GAME STATE
         * =========================================================
         */

        this.remainingTime =
            level.timeLimit;


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


        /*
         * Every level gets a fresh set of trigger events.
         */
        this.triggeredEvents.clear();


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
         * RESET OVERLAYS
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
         * Immediately draw the freshly loaded level.
         */
        this.render();

    }


    /*
     * =============================================================
     * MAIN GAME LOOP
     * =============================================================
     */

    gameLoop(currentTime) {

        /*
         * If the game was exited, stop this loop.
         *
         * restartLevel() creates a fresh loop.
         */
        if (!this.running) {

            return;

        }


        /*
         * Calculate frame time.
         */
        let deltaTime =
            (
                currentTime -
                this.lastTime
            ) / 1000;


        this.lastTime =
            currentTime;


        /*
         * Prevent huge time jumps.
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
         * While paused:
         *
         * - timer stops
         * - player stops
         * - hazards stop
         *
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
         * WARNING
         * =========================================================
         *
         * IMPORTANT:
         *
         * The warning timer is separate from the main
         * level timer.
         *
         * Therefore the player gets the full warning period
         * without losing game time.
         */

        if (
            this.warningActive
        ) {

            this.warningRemaining -=
                deltaTime;


            /*
             * Warning finished.
             */
            if (
                this.warningRemaining <=
                0
            ) {

                this.warningRemaining =
                    0;


                this.warningActive =
                    false;


                this.ui.hideWarning();


                /*
                 * =================================================
                 * SPAWN GHOST
                 * =================================================
                 */

                if (
                    this.pendingHazard
                ) {

                    const hazard =
                        this.pendingHazard;


                    this.pendingHazard =
                        null;


                    /*
                     * Ghost appears at the position calculated
                     * when the player entered the trigger.
                     */
                    hazard.beginChase();


                    /*
                     * Audio.
                     */
                    if (
                        window.gameAudio
                    ) {

                        if (
                            window.gameAudio
                                .blockAppear
                        ) {

                            window.gameAudio
                                .blockAppear();

                        }


                        if (
                            window.gameAudio
                                .chaseStart
                        ) {

                            window.gameAudio
                                .chaseStart();

                        }

                    }

                }


                /*
                 * Reset the frame clock so that the warning
                 * duration does not accidentally become a
                 * giant frame delta.
                 */
                this.lastTime =
                    performance.now();

            }


            /*
             * Draw warning / current scene.
             */
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
         * GAME OVER / COMPLETE SCREEN
         * =========================================================
         *
         * Keep rendering the final scene while the overlay
         * is visible.
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
         * LEVEL TIMER
         * =========================================================
         */

        this.remainingTime -=
            deltaTime;


        /*
         * Time expired.
         */
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
         * PLAYER
         * =========================================================
         */

        const previousPlayerPosition = {

            x:
                this.player.x,

            y:
                this.player.y

        };


        /*
         * Keep the existing Player API.
         */
        this.player.update(
            window.keys || {},
            currentTime
        );


        /*
         * =========================================================
         * ACTUAL MOVEMENT DIRECTION
         * =========================================================
         *
         * This is IMPORTANT for dynamic ghost spawning.
         *
         * Example:
         *
         * Player moves RIGHT onto trigger:
         *
         *     PLAYER ---> TRIGGER
         *
         * Ghost spawns:
         *
         *     PLAYER ---> TRIGGER ---> GHOST
         *
         *
         * Player moves DOWN onto trigger:
         *
         *          PLAYER
         *             |
         *             v
         *          TRIGGER
         *             |
         *             v
         *           GHOST
         *
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
         * CHASE TRIGGERS
         * =========================================================
         */

        this.checkChaseTriggers(

            previousPlayerPosition,

            movedDirection

        );


        /*
         * =========================================================
         * WARNING STARTED THIS FRAME
         * =========================================================
         *
         * Stop immediately.
         *
         * This ensures the player cannot move another frame
         * after activating the trigger.
         */

        if (
            this.warningActive
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
         * HAZARDS
         * =========================================================
         */

        for (
            const hazard of
            this.hazards
        ) {

            /*
             * Remember whether it was chasing before update.
             */
            const wasChasing =
                hazard.isChasing();


            /*
             * Update ghost movement.
             *
             * The ChaseBlock itself follows Maze.findPath(),
             * so it cannot move through walls.
             */
            hazard.update(

                deltaTime,

                this.player

            );


            /*
             * =====================================================
             * PLAYER CAUGHT
             * =====================================================
             */

            if (
                hazard.isColliding(
                    this.player
                )
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
             *
             * The ghost now remains permanently on the
             * trigger tile.
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
         *
         * Player must reach the E tile.
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
         * Continue loop.
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
     * CHASE TRIGGER CHECK
     * =============================================================
     */

    checkChaseTriggers(
        previousPlayerPosition,
        movedDirection
    ) {

        if (this.warningActive) {
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

        const x = this.player.x;
        const y = this.player.y;
        const cellKey = `${x},${y}`;

        /*
         * Check only the trigger cells that were randomly generated
         * when this run started.
         *
         * This is the critical difference from the previous version:
         * simply stepping onto ANY off-safe-route cell no longer creates
         * a trap. Only a hidden trigger selected by Maze can activate.
         */
        for (const hazard of this.hazards) {

            if (!hazard || !hazard.isWaiting()) {
                continue;
            }

            const triggerKey =
                `${hazard.trigger.x},${hazard.trigger.y}`;

            if (this.trapTriggeredCells.has(triggerKey)) {
                continue;
            }

            if (
                x !== hazard.trigger.x ||
                y !== hazard.trigger.y
            ) {
                continue;
            }

            /*
             * IMPORTANT:
             *
             * Pass the player's ACTUAL movement direction.
             * Never pass previousPlayerPosition as the spawn direction.
             */
            const prepared =
                hazard.prepareSpawn(movedDirection);

            if (!prepared) {
                /*
                 * Trigger generation already guarantees six clear tiles,
                 * so reaching this branch indicates an unexpected state.
                 * Do not invent a different trigger position here.
                 */
                console.warn(
                    `[Maze Escape] Trigger ${triggerKey} could not prepare a six-tile spawn.`
                );
                continue;
            }

            this.trapTriggeredCells.add(triggerKey);
            this.triggeredEvents.add(hazard.config.id);

            this.startHazardWarning(hazard);

            /* Only one warning/chase can begin at a time. */
            break;
        }
    }

    startHazardWarning(hazard) {

        this.pendingHazard =
            hazard;

        this.warningActive =
            true;

        this.warningRemaining =
            (
                hazard.config.warningTime ||
                1500
            ) / 1000;

        this.ui.setWarningText(
            "SOMETHING IS COMING"
        );

        this.ui.showWarning();

        if (
            window.gameAudio &&
            window.gameAudio.warning
        ) {
            window.gameAudio.warning();
        }
    }


    /*
     * =============================================================
     * RENDER
     * =============================================================
     *
     * IMPORTANT:
     *
     * Do not draw anything manually here.
     *
     * Your existing Renderer handles:
     *
     * - maze
     * - walls
     * - door / exit
     * - player
     * - ghost
     *
     */

    render() {

        if (
            !this.renderer ||
            !this.player
        ) {

            return;

        }


        /*
         * Keep the existing Renderer API.
         */
        this.renderer.draw(

            this.player,

            this.hazards

        );

    }


    /*
     * =============================================================
     * PAUSE
     * =============================================================
     */

    pause() {

        /*
         * Do not pause twice.
         */
        if (

            this.paused ||

            this.gameOver ||

            !this.running

        ) {

            return;

        }


        this.paused =
            true;


        /*
         * Show pause menu.
         *
         * Continue button calls resume().
         *
         * Exit button calls exitToMenu().
         */
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

        if (
            !this.paused
        ) {

            return;

        }


        this.paused =
            false;


        this.ui.hidePause();


        /*
         * Reset frame clock.
         *
         * This prevents the time spent in the pause menu
         * from being counted as gameplay time.
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

        this.gameOver =
            true;


        /*
         * Stop chase audio first.
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


            /*
             * Button says NEXT LEVEL.
             */
            this.ui.setRestartAction(
                () => {

                    this.restartLevel(

                        this.levelIndex + 1

                    );

                }
            );

        }

        /*
         * =========================================================
         * ALL LEVELS COMPLETE
         * =========================================================
         */

        else {

            if (

                window.gameAudio &&

                window.gameAudio.gameComplete

            ) {

                window.gameAudio.gameComplete();

            }


            this.ui.showGameComplete();


            /*
             * PLAY AGAIN starts Level 1 again.
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


    /*
     * =============================================================
     * GAME OVER
     * =============================================================
     */

    failLevel(message) {

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
         * Stop chase and play appropriate sound.
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

            } else {

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
            message
        );


        /*
         * PLAY AGAIN restarts the current level.
         */
        this.ui.setRestartAction(
            () => {

                this.restartLevel(

                    this.levelIndex

                );

            }
        );

    }


    /*
     * =============================================================
     * RESTART LEVEL
     * =============================================================
     *
     * This fixes:
     *
     * PLAY AGAIN -> game stuck
     *
     * because loadLevel() alone does not restart an animation
     * loop when running was previously false.
     *
     */

    restartLevel(index) {

        /*
         * Stop the old game loop logically.
         *
         * Any old requestAnimationFrame that is still pending
         * will see the new state on its next execution.
         */
        this.running =
            false;


        /*
         * Hide old overlays before loading.
         */
        this.ui.hideWarning();

        this.ui.hideOverlay();

        this.ui.hidePause();

        this.ui.hideExit();


        /*
         * Make the game active again.
         */
        this.running =
            true;


        /*
         * Load fresh level state.
         */
        this.loadLevel(
            index
        );


        /*
         * Reset clock.
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
     * EXIT
     * =============================================================
     */

    exitToMenu() {

        /*
         * Stop gameplay.
         */
        this.paused =
            false;


        this.running =
            false;


        /*
         * Stop all game audio.
         */
        if (

            window.gameAudio &&

            window.gameAudio.exit

        ) {

            window.gameAudio.exit();

        }


        /*
         * Hide pause menu.
         */
        this.ui.hidePause();


        /*
         * Show exit screen.
         */
        this.ui.showExit();


        /*
         * =========================================================
         * PLAY AGAIN FROM EXIT SCREEN
         * =========================================================
         *
         * This explicitly restarts the animation loop.
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
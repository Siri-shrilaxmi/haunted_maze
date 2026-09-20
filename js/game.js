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


        this.hazardTemplates =
            [];


        this.trapTriggeredCells =
            new Set();


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
             * Prepare the ghost spawn using the player's ACTUAL
             * approach direction.
             */

            const prepared =
                hazard.prepareSpawn(
                    movedDirection
                );


            if (
                !prepared
            ) {

                console.warn(

                    `[Maze Escape] Trigger ${triggerKey} ` +
                    `could not prepare a six-tile spawn.`

                );


                continue;

            }


            /*
             * Mark this trigger permanently activated.
             */

            this.trapTriggeredCells.add(
                triggerKey
            );


            this.triggeredEvents.add(
                hazard.config.id
            );


            /*
             * =====================================================
             * HAZARD TRIGGER
             * =====================================================
             *
             * There is no special first-encounter interruption.
             * Every triggered ghost uses the same behavior:
             *
             *     red flash + warning sound
             *     ghost appears immediately
             *     chase starts immediately
             *
             * This keeps the first encounter clear and avoids making
             * the player think something went wrong with the game.
             */

            this.startHazardWarning(
                hazard
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

    startHazardWarning(hazard) {

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
            "⚠  SOMETHING IS COMING"
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

        hazard.beginChase();


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


        this.ui.showGameComplete();


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
            message
        );


        /*
         * Restart current level.
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

        this.ui.showExit();


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
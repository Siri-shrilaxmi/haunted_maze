class Maze {

    constructor(map) {

        this.map = map;

        this.rows = map.length;

        this.cols = map[0].length;

        this.tileSize = 32;


        this.start =
            this.findTile("S");

        this.exit =
            this.findTile("E");


        if (!this.start) {

            throw new Error(
                "Start position (S) not found in maze."
            );

        }


        if (!this.exit) {

            throw new Error(
                "Exit position (E) not found in maze."
            );

        }


        this.blockedTiles =
            new Set();


        this.safePath =
            [];


        this.safePathSet =
            new Set();


        this.lastSafeRouteSignature =
            null;


        /*
         * Number of safe-route candidates tested.
         *
         * Game.loadLevel() can overwrite this value
         * from levels.js.
         */
        this.safeRouteAttempts = 30;

    }


    /*
     * =============================================================
     * FIND TILE
     * =============================================================
     */

    findTile(tile) {

        for (
            let y = 0;
            y < this.rows;
            y++
        ) {

            for (
                let x = 0;
                x < this.cols;
                x++
            ) {

                if (
                    this.map[y][x] === tile
                ) {

                    return {
                        x,
                        y
                    };

                }

            }

        }

        return null;

    }


    /*
     * =============================================================
     * KEYS
     * =============================================================
     */

    key(x, y) {

        return `${x},${y}`;

    }


    pointKey(point) {

        return this.key(
            point.x,
            point.y
        );

    }


    /*
     * =============================================================
     * WALL / BLOCK
     * =============================================================
     */

    isWall(x, y) {

        if (
            x < 0 ||
            x >= this.cols ||
            y < 0 ||
            y >= this.rows
        ) {

            return true;

        }


        return (
            this.map[y][x] === "#"
        );

    }


    isBlocked(x, y) {

        return this.blockedTiles.has(
            this.key(x, y)
        );

    }


    isWalkable(x, y) {

        return (
            !this.isWall(x, y) &&
            !this.isBlocked(x, y)
        );

    }


    /*
     * =============================================================
     * SIZE
     * =============================================================
     */

    getWidth() {

        return (
            this.cols *
            this.tileSize
        );

    }


    getHeight() {

        return (
            this.rows *
            this.tileSize
        );

    }


    /*
     * =============================================================
     * BLOCKING
     * =============================================================
     */

    addBlock(x, y) {

        if (
            this.isWall(x, y)
        ) {

            return false;

        }


        this.blockedTiles.add(
            this.key(x, y)
        );


        return true;

    }


    blockTile(x, y) {

        return this.addBlock(
            x,
            y
        );

    }


    removeBlock(x, y) {

        this.blockedTiles.delete(
            this.key(x, y)
        );

    }


    unblockAll() {

        this.blockedTiles.clear();

    }


    /*
     * =============================================================
     * SAFE PATH
     * =============================================================
     */

    isOnSafePath(x, y) {

        return this.safePathSet.has(
            this.key(x, y)
        );

    }


    getSafePath() {

        return this.safePath.map(
            point => ({
                x: point.x,
                y: point.y
            })
        );

    }


    /*
     * =============================================================
     * NEIGHBORS
     * =============================================================
     */

    getNeighbors(point) {

        const directions = [

            {
                x: 1,
                y: 0
            },

            {
                x: -1,
                y: 0
            },

            {
                x: 0,
                y: 1
            },

            {
                x: 0,
                y: -1
            }

        ];


        const neighbors = [];


        for (
            const direction
            of directions
        ) {

            const x =
                point.x +
                direction.x;

            const y =
                point.y +
                direction.y;


            if (
                !this.isWall(
                    x,
                    y
                )
            ) {

                neighbors.push({
                    x,
                    y
                });

            }

        }


        return neighbors;

    }


    /*
     * =============================================================
     * DEGREE
     * =============================================================
     */

    getDegree(point) {

        return this.getNeighbors(
            point
        ).length;

    }


    /*
     * =============================================================
     * SHUFFLE
     * =============================================================
     */

    shuffle(array) {

        for (
            let i = array.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );


            [
                array[i],
                array[j]
            ] = [
                array[j],
                array[i]
            ];

        }


        return array;

    }


    /*
     * =============================================================
     * FIND PATH
     * =============================================================
     *
     * Normal BFS pathfinding used by the ghost.
     *
     * The ghost cannot walk through walls or blocked tiles.
     */

    findPath(start, goal) {

        if (
            !start ||
            !goal
        ) {

            return [];

        }


        if (
            !this.isWalkable(
                start.x,
                start.y
            )
        ) {

            return [];

        }


        if (
            !this.isWalkable(
                goal.x,
                goal.y
            )
        ) {

            return [];

        }


        const queue = [

            {
                x: start.x,
                y: start.y
            }

        ];


        const previous =
            new Map();


        previous.set(
            this.pointKey(start),
            null
        );


        let queueIndex = 0;


        while (
            queueIndex <
            queue.length
        ) {

            const current =
                queue[
                    queueIndex++
                ];


            if (

                current.x ===
                    goal.x &&

                current.y ===
                    goal.y

            ) {

                break;

            }


            for (
                const next
                of this.getNeighbors(
                    current
                )
            ) {

                const nextKey =
                    this.pointKey(next);


                if (
                    !this.isWalkable(
                        next.x,
                        next.y
                    )
                ) {

                    continue;

                }


                if (
                    previous.has(
                        nextKey
                    )
                ) {

                    continue;

                }


                previous.set(
                    nextKey,
                    current
                );


                queue.push(
                    next
                );

            }

        }


        const goalKey =
            this.pointKey(goal);


        if (
            !previous.has(
                goalKey
            )
        ) {

            return [];

        }


        const path = [];


        let current = {

            x: goal.x,
            y: goal.y

        };


        while (
            current
        ) {

            path.push({

                x: current.x,
                y: current.y

            });


            current =
                previous.get(
                    this.pointKey(
                        current
                    )
                );

        }


        return path.reverse();

    }


    /*
     * =============================================================
     * FIND SIMPLE S -> E PATHS
     * =============================================================
     *
     * IMPORTANT PERFORMANCE FIX
     * -------------------------
     *
     * The old Level 5 implementation attempted to discover up to
     * 10,000 complete simple paths.
     *
     * The Haunted Cave contains many loops and branches. That
     * caused route generation to become extremely expensive before
     * Renderer could even be created.
     *
     * We only need a reasonable collection of distinct routes for
     * gameplay. We do NOT need every mathematically possible route.
     *
     * Default limit is now 24.
     */

    findAllSimplePaths(
        maxPaths = 24
    ) {

        const routes = [];


        /*
         * Hard safety cap.
         *
         * Even if another file accidentally requests a huge
         * number, Level 5 cannot start an enormous DFS search.
         */
        const routeLimit =
            Math.min(
                Math.max(
                    Number(maxPaths) || 24,
                    1
                ),
                24
            );


        const start = {

            x: this.start.x,
            y: this.start.y

        };


        const stack = [

            {

                point: start,

                path: [
                    start
                ],

                visited:
                    new Set([
                        this.pointKey(
                            start
                        )
                    ])

            }

        ];


        while (

            stack.length &&

            routes.length <
                routeLimit

        ) {

            const state =
                stack.pop();


            /*
             * Reached E.
             */
            if (

                state.point.x ===
                    this.exit.x &&

                state.point.y ===
                    this.exit.y

            ) {

                routes.push(
                    state.path
                );

                continue;

            }


            let neighbors =
                this.getNeighbors(
                    state.point
                );


            /*
             * Randomize branch exploration.
             *
             * This means a different set of useful routes can be
             * selected on different rounds.
             */
            this.shuffle(
                neighbors
            );


            for (
                const next
                of neighbors
            ) {

                const nextKey =
                    this.pointKey(
                        next
                    );


                if (
                    state.visited.has(
                        nextKey
                    )
                ) {

                    continue;

                }


                const visited =
                    new Set(
                        state.visited
                    );


                visited.add(
                    nextKey
                );


                stack.push({

                    point: {

                        x: next.x,
                        y: next.y

                    },

                    path: [

                        ...state.path,

                        {

                            x: next.x,
                            y: next.y

                        }

                    ],

                    visited

                });

            }

        }


        return routes;

    }


    /*
     * =============================================================
     * ROUTE SIGNATURE
     * =============================================================
     */

    routeSignature(route) {

        return route
            .map(
                point =>
                    this.pointKey(
                        point
                    )
            )
            .join("|");

    }


    /*
     * =============================================================
     * SIX STEPS AHEAD
     * =============================================================
     *
     * The first step is forced to be in the direction the player
     * entered the trigger.
     *
     * The remaining steps can turn around walls.
     */

    findSixStepsAhead(
        start,
        direction,
        distance = 6
    ) {

        if (
            !start ||
            !direction ||
            distance < 1
        ) {

            return null;

        }


        const dx =
            Math.sign(
                direction.x || 0
            );


        const dy =
            Math.sign(
                direction.y || 0
            );


        /*
         * Only cardinal directions.
         */
        if (
            Math.abs(dx) +
            Math.abs(dy) !== 1
        ) {

            return null;

        }


        /*
         * FIRST STEP
         *
         * Must be directly ahead of the player.
         */

        const first = {

            x:
                start.x + dx,

            y:
                start.y + dy

        };


        if (
            !this.isWalkable(
                first.x,
                first.y
            )
        ) {

            return null;

        }


        const path = [

            {
                x: first.x,
                y: first.y
            }

        ];


        const visited =
            new Set([

                this.pointKey(
                    start
                ),

                this.pointKey(
                    first
                )

            ]);


        /*
         * Search exactly `distance` maze steps.
         */
        const search =
            point => {

                if (
                    path.length ===
                    distance
                ) {

                    return {

                        x: point.x,

                        y: point.y,

                        path:
                            path.map(
                                step => ({

                                    x:
                                        step.x,

                                    y:
                                        step.y

                                })
                            )

                    };

                }


                let neighbors =
                    this.getNeighbors(
                        point
                    );


                this.shuffle(
                    neighbors
                );


                for (
                    const next
                    of neighbors
                ) {

                    const nextKey =
                        this.pointKey(
                            next
                        );


                    if (
                        visited.has(
                            nextKey
                        )
                    ) {

                        continue;

                    }


                    if (
                        !this.isWalkable(
                            next.x,
                            next.y
                        )
                    ) {

                        continue;

                    }


                    visited.add(
                        nextKey
                    );


                    path.push({

                        x: next.x,
                        y: next.y

                    });


                    const result =
                        search(
                            next
                        );


                    if (
                        result
                    ) {

                        return result;

                    }


                    path.pop();


                    visited.delete(
                        nextKey
                    );

                }


                return null;

            };


        return search(
            first
        );

    }


    /*
     * =============================================================
     * ROUTE TRIGGER CANDIDATES
     * =============================================================
     *
     * Candidate positions for one non-safe route.
     *
     * Trigger:
     *
     * - cannot be S
     * - cannot be E
     * - cannot be on safe route
     * - has enough room for six steps ahead
     */

    getRouteTriggerCandidates(
        route,
        safeSet,
        distance = 6
    ) {

        const candidates = [];


        if (
            !route ||
            route.length <
                distance + 3
        ) {

            return candidates;

        }


        /*
         * Leave enough room after the trigger.
         */
        const lastUsableIndex =
            route.length -
            distance -
            1;


        for (
            let index = 1;
            index <= lastUsableIndex;
            index++
        ) {

            const point =
                route[index];


            const triggerKey =
                this.pointKey(
                    point
                );


            /*
             * Never put a trigger on the safe route.
             */
            if (
                safeSet.has(
                    triggerKey
                )
            ) {

                continue;

            }


            /*
             * Never use S.
             */
            if (

                point.x ===
                    this.start.x &&

                point.y ===
                    this.start.y

            ) {

                continue;

            }


            /*
             * Never use E.
             */
            if (

                point.x ===
                    this.exit.x &&

                point.y ===
                    this.exit.y

            ) {

                continue;

            }


            /*
             * Direction in which the player entered the trigger.
             */
            const previous =
                route[
                    index - 1
                ];


            const approachDirection = {

                x:
                    point.x -
                    previous.x,

                y:
                    point.y -
                    previous.y

            };


            /*
             * Must be cardinal.
             */
            if (
                Math.abs(
                    approachDirection.x
                ) +
                Math.abs(
                    approachDirection.y
                ) !== 1
            ) {

                continue;

            }


            /*
             * Ghost must be six maze steps ahead.
             */
            const spawn =
                this.findSixStepsAhead(

                    point,

                    approachDirection,

                    distance

                );


            if (
                !spawn
            ) {

                continue;

            }


            candidates.push({

                x:
                    point.x,

                y:
                    point.y,

                approachDirection: {

                    x:
                        approachDirection.x,

                    y:
                        approachDirection.y

                },

                spawn: {

                    x:
                        spawn.x,

                    y:
                        spawn.y

                },

                spawnPath:
                    spawn.path.map(
                        step => ({

                            x:
                                step.x,

                            y:
                                step.y

                        })
                    ),

                routeIndex:
                    index

            });

        }


        return candidates;

    }


    /*
     * =============================================================
     * RANDOMIZE CANDIDATES
     * =============================================================
     */

    randomizeCandidates(
        candidates
    ) {

        const copy =
            [
                ...candidates
            ];


        this.shuffle(
            copy
        );


        return copy;

    }


    /*
     * =============================================================
     * MATCH TRIGGERS TO ROUTES
     * =============================================================
     */

    findRouteTriggerMatching(
        routeCandidates
    ) {

        const routeCount =
            routeCandidates.length;


        if (
            routeCount === 0
        ) {

            return [];

        }


        /*
         * Randomized options.
         */
        const options =
            routeCandidates.map(
                candidates => {

                    const copy =
                        [
                            ...candidates
                        ];


                    this.shuffle(
                        copy
                    );


                    return copy;

                }
            );


        /*
         * Routes with fewer options first.
         */
        const order =
            Array.from(
                {
                    length:
                        routeCount
                },
                (
                    _,
                    index
                ) => index
            );


        order.sort(
            (
                a,
                b
            ) => {

                return (
                    options[a].length -
                    options[b].length
                );

            }
        );


        const tileOwner =
            new Map();


        const assigned =
            new Array(
                routeCount
            ).fill(
                null
            );


        /*
         * =========================================================
         * BIPARTITE MATCHING
         * =========================================================
         */

        const tryAssign =
            (
                routeIndex,
                seenTiles
            ) => {

                for (
                    const candidate
                    of options[
                        routeIndex
                    ]
                ) {

                    const tileKey =
                        this.key(
                            candidate.x,
                            candidate.y
                        );


                    if (
                        seenTiles.has(
                            tileKey
                        )
                    ) {

                        continue;

                    }


                    seenTiles.add(
                        tileKey
                    );


                    const owner =
                        tileOwner.get(
                            tileKey
                        );


                    if (
                        owner ===
                        undefined
                    ) {

                        tileOwner.set(
                            tileKey,
                            routeIndex
                        );


                        assigned[
                            routeIndex
                        ] =
                            candidate;


                        return true;

                    }


                    if (
                        tryAssign(
                            owner,
                            seenTiles
                        )
                    ) {

                        tileOwner.set(
                            tileKey,
                            routeIndex
                        );


                        assigned[
                            routeIndex
                        ] =
                            candidate;


                        return true;

                    }

                }


                return false;

            };


        let perfect =
            true;


        for (
            const routeIndex
            of order
        ) {

            if (
                !tryAssign(
                    routeIndex,
                    new Set()
                )
            ) {

                perfect =
                    false;

                break;

            }

        }


        if (
            perfect &&
            assigned.every(
                Boolean
            )
        ) {

            return assigned;

        }


        /*
         * =========================================================
         * FALLBACK MATCHING
         * =========================================================
         */

        const usage =
            new Map();


        const fallback =
            new Array(
                routeCount
            ).fill(
                null
            );


        const fallbackOrder =
            Array.from(
                {
                    length:
                        routeCount
                },
                (
                    _,
                    index
                ) => index
            );


        this.shuffle(
            fallbackOrder
        );


        for (
            const routeIndex
            of fallbackOrder
        ) {

            const candidates =
                [
                    ...options[
                        routeIndex
                    ]
                ];


            if (
                !candidates.length
            ) {

                continue;

            }


            candidates.sort(
                (
                    a,
                    b
                ) => {

                    const aKey =
                        this.key(
                            a.x,
                            a.y
                        );


                    const bKey =
                        this.key(
                            b.x,
                            b.y
                        );


                    return (

                        (
                            usage.get(
                                aKey
                            ) || 0
                        ) -

                        (
                            usage.get(
                                bKey
                            ) || 0
                        )

                    );

                }
            );


            const minimumUsage =
                usage.get(
                    this.key(
                        candidates[0].x,
                        candidates[0].y
                    )
                ) || 0;


            const pool =
                candidates.filter(
                    candidate => {

                        const key =
                            this.key(
                                candidate.x,
                                candidate.y
                            );


                        return (
                            (
                                usage.get(
                                    key
                                ) || 0
                            ) ===
                            minimumUsage
                        );

                    }
                );


            this.shuffle(
                pool
            );


            const selected =
                pool[0];


            if (
                !selected
            ) {

                continue;

            }


            fallback[
                routeIndex
            ] =
                selected;


            const selectedKey =
                this.key(
                    selected.x,
                    selected.y
                );


            usage.set(

                selectedKey,

                (
                    usage.get(
                        selectedKey
                    ) || 0
                ) + 1

            );

        }


        return fallback;

    }


    /*
     * =============================================================
     * CHOOSE RANDOM ESCAPE ROUTE
     * =============================================================
     *
     * LEVEL 5 PERFORMANCE FIX
     *
     * We deliberately do NOT enumerate every mathematically
     * possible S -> E path.
     *
     * A highly connected maze can contain thousands of simple
     * routes. The game only needs a playable collection of routes.
     *
     * We therefore:
     *
     *   1. Discover at most 24 routes.
     *   2. Test only a limited number of safe routes.
     *   3. Create triggers for the discovered competing routes.
     *
     * This keeps Level 5 responsive while preserving the physical
     * maze.
     */

    chooseRandomEscapeRoute(
        avoidSafeRouteSignatures = []
    ) {

        /*
         * =========================================================
         * DISCOVER A LIMITED NUMBER OF ROUTES
         * =========================================================
         */

        const MAX_GAME_ROUTES = 24;


        const routes =
            this.findAllSimplePaths(
                MAX_GAME_ROUTES
            );


        /*
         * No route.
         */
        if (
            !routes.length
        ) {

            console.error(
                "[Maze Escape] No S -> E route exists."
            );


            return {

                path: [],

                gates: [],

                routeCount: 0,

                safeRouteIndex: -1,

                nonSafeRouteCount: 0

            };

        }


        console.info(

            `[Maze Escape] Discovered ${routes.length} playable S -> E route(s).`

        );


        /*
         * Randomize discovered routes.
         */
        this.shuffle(
            routes
        );


        /*
         * =========================================================
         * RECENT SAFE ROUTES
         * =========================================================
         */

        const recent =
            Array.isArray(
                avoidSafeRouteSignatures
            )

                ? new Set(
                    avoidSafeRouteSignatures
                )

                : new Set(
                    avoidSafeRouteSignatures
                        ? [
                            avoidSafeRouteSignatures
                        ]
                        : []
                );


        /*
         * Prefer a route not recently used.
         */
        let candidateSafeRoutes =
            routes.filter(
                route => {

                    return !recent.has(
                        this.routeSignature(
                            route
                        )
                    );

                }
            );


        /*
         * If every discovered route is in history,
         * use all discovered routes.
         */
        if (
            !candidateSafeRoutes.length
        ) {

            candidateSafeRoutes =
                [
                    ...routes
                ];

        }


        this.shuffle(
            candidateSafeRoutes
        );


        /*
         * =========================================================
         * SAFE ROUTE TEST LIMIT
         * =========================================================
         *
         * Even if levels.js requests 100 attempts, we don't need
         * to test 100 routes.
         *
         * This is especially important for Haunted Cave.
         */

        const requestedAttempts =
            Number(
                this.safeRouteAttempts
            ) || 30;


        const maxAttempts =
            Math.min(
                Math.max(
                    requestedAttempts,
                    5
                ),
                12
            );


        candidateSafeRoutes =
            candidateSafeRoutes.slice(
                0,
                maxAttempts
            );


        console.info(

            `[Maze Escape] Testing ${candidateSafeRoutes.length} safe-route candidate(s).`

        );


        /*
         * =========================================================
         * TEST SAFE ROUTES
         * ========================================================= */

        for (
            const safeRoute
            of candidateSafeRoutes
        ) {

            /*
             * Fast safe-route lookup.
             */
            const safeSet =
                new Set(
                    safeRoute.map(
                        point =>
                            this.pointKey(
                                point
                            )
                    )
                );


            const routeCandidates =
                [];


            let valid =
                true;


            /*
             * Find trigger candidates for every competing route.
             */
            for (
                const route
                of routes
            ) {

                /*
                 * This is the selected safe route.
                 */
                if (
                    route ===
                    safeRoute
                ) {

                    continue;

                }


                const candidates =
                    this.getRouteTriggerCandidates(

                        route,

                        safeSet,

                        6

                    );


                /*
                 * This route cannot currently be used if there
                 * is nowhere suitable for the six-step ghost.
                 */
                if (
                    !candidates.length
                ) {

                    valid =
                        false;

                    break;

                }


                routeCandidates.push(
                    candidates
                );

            }


            /*
             * Try another safe route.
             */
            if (
                !valid
            ) {

                continue;

            }


            /*
             * Assign unique trigger tiles where possible.
             */
            const matching =
                this.findRouteTriggerMatching(
                    routeCandidates
                );


            if (
                !matching
            ) {

                continue;

            }


            if (
                matching.length !==
                routes.length - 1
            ) {

                continue;

            }


            /*
             * Every competing route needs a trigger.
             */
            if (
                matching.some(
                    candidate =>
                        !candidate
                )
            ) {

                continue;

            }


            /*
             * =====================================================
             * SAFE ROUTE ACCEPTED
             * ===================================================== */

            this.safePath =
                safeRoute.map(
                    point => ({

                        x:
                            point.x,

                        y:
                            point.y

                    })
                );


            this.safePathSet =
                new Set(
                    this.safePath.map(
                        point =>
                            this.pointKey(
                                point
                            )
                    )
                );


            /*
             * =====================================================
             * BUILD GATES
             * ===================================================== */

            const gates =
                matching.map(
                    (
                        candidate,
                        nonSafeIndex
                    ) => {

                        return {

                            x:
                                candidate.x,

                            y:
                                candidate.y,

                            routeIndex:
                                nonSafeIndex,

                            direction:
                                candidate.approachDirection
                                    ? {

                                        x:
                                            candidate
                                                .approachDirection
                                                .x,

                                        y:
                                            candidate
                                                .approachDirection
                                                .y

                                    }
                                    : null,

                            approachDirection:
                                candidate.approachDirection
                                    ? {

                                        x:
                                            candidate
                                                .approachDirection
                                                .x,

                                        y:
                                            candidate
                                                .approachDirection
                                                .y

                                    }
                                    : null,

                            spawn: {

                                x:
                                    candidate.spawn.x,

                                y:
                                    candidate.spawn.y

                            },

                            spawnPath:
                                candidate.spawnPath.map(
                                    point => ({

                                        x:
                                            point.x,

                                        y:
                                            point.y

                                    })
                                )

                        };

                    }
                );


            /*
             * Randomize trigger ordering.
             */
            this.shuffle(
                gates
            );


            const safeRouteIndex =
                routes.indexOf(
                    safeRoute
                );


            console.info(

                `[Maze Escape] Safe route selected. ` +

                `Safe route index: ${safeRouteIndex}. ` +

                `Playable routes: ${routes.length}. ` +

                `Non-safe routes: ${routes.length - 1}. ` +

                `Triggers: ${gates.length}.`

            );


            return {

                path:
                    this.safePath.map(
                        point => ({

                            x:
                                point.x,

                            y:
                                point.y

                        })
                    ),

                gates,

                routeCount:
                    routes.length,

                safeRouteIndex,

                nonSafeRouteCount:
                    routes.length - 1

            };

        }


        /*
         * =========================================================
         * FALLBACK
         * =========================================================
         *
         * A fallback is preferable to leaving the game stuck on
         * the loading screen.
         */

        console.warn(

            "[Maze Escape] Normal trigger planning failed. " +
            "Using fallback route."

        );


        const fallbackRoute =
            candidateSafeRoutes[0] ||
            routes[0];


        const fallbackSafeSet =
            new Set(
                fallbackRoute.map(
                    point =>
                        this.pointKey(
                            point
                        )
                )
            );


        this.safePath =
            fallbackRoute.map(
                point => ({

                    x:
                        point.x,

                    y:
                        point.y

                })
            );


        this.safePathSet =
            new Set(
                this.safePath.map(
                    point =>
                        this.pointKey(
                            point
                        )
                )
            );


        const fallbackCandidates =
            [];


        /*
         * Find usable triggers for all competing routes.
         */
        for (
            const route
            of routes
        ) {

            if (
                route ===
                fallbackRoute
            ) {

                continue;

            }


            const candidates =
                this.getRouteTriggerCandidates(

                    route,

                    fallbackSafeSet,

                    6

                );


            if (
                candidates.length
            ) {

                fallbackCandidates.push(
                    candidates
                );

            }

        }


        const fallbackMatching =
            this.findRouteTriggerMatching(
                fallbackCandidates
            );


        const fallbackGates =
            fallbackMatching

                ? fallbackMatching
                    .filter(
                        Boolean
                    )
                    .map(
                        (
                            candidate,
                            index
                        ) => {

                            return {

                                x:
                                    candidate.x,

                                y:
                                    candidate.y,

                                routeIndex:
                                    index,

                                direction:
                                    candidate
                                        .approachDirection
                                        ? {

                                            x:
                                                candidate
                                                    .approachDirection
                                                    .x,

                                            y:
                                                candidate
                                                    .approachDirection
                                                    .y

                                        }
                                        : null,

                                approachDirection:
                                    candidate
                                        .approachDirection
                                        ? {

                                            x:
                                                candidate
                                                    .approachDirection
                                                    .x,

                                            y:
                                                candidate
                                                    .approachDirection
                                                    .y

                                        }
                                        : null,

                                spawn: {

                                    x:
                                        candidate.spawn.x,

                                    y:
                                        candidate.spawn.y

                                },

                                spawnPath:
                                    candidate.spawnPath.map(
                                        point => ({

                                            x:
                                                point.x,

                                            y:
                                                point.y

                                        })
                                    )

                            };

                        }
                    )

                : [];


        this.shuffle(
            fallbackGates
        );


        console.warn(

            `[Maze Escape] Fallback created ` +
            `${fallbackGates.length} trigger(s) ` +
            `for ${routes.length - 1} competing route(s).`

        );


        return {

            path:
                this.safePath.map(
                    point => ({

                        x:
                            point.x,

                        y:
                            point.y

                    })
                ),

            gates:
                fallbackGates,

            routeCount:
                routes.length,

            safeRouteIndex:
                routes.indexOf(
                    fallbackRoute
                ),

            nonSafeRouteCount:
                routes.length - 1

        };

    }

}
class Maze {
    constructor(map) {
        this.map = map;
        this.rows = map.length;
        this.cols = map[0].length;
        this.tileSize = 32;

        this.start = this.findTile("S");
        this.exit = this.findTile("E");

        if (!this.start) {
            throw new Error("Start position (S) not found in maze.");
        }
        if (!this.exit) {
            throw new Error("Exit position (E) not found in maze.");
        }

        this.blockedTiles = new Set();
        this.safePath = [];
        this.safePathSet = new Set();
        this.lastSafeRouteSignature = null;
    }

    findTile(tile) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.map[y][x] === tile) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    key(x, y) {
        return `${x},${y}`;
    }

    pointKey(point) {
        return this.key(point.x, point.y);
    }

    isWall(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return true;
        }
        return this.map[y][x] === "#";
    }

    isBlocked(x, y) {
        return this.blockedTiles.has(this.key(x, y));
    }

    isWalkable(x, y) {
        return !this.isWall(x, y) && !this.isBlocked(x, y);
    }

    getWidth() {
        return this.cols * this.tileSize;
    }

    getHeight() {
        return this.rows * this.tileSize;
    }

    addBlock(x, y) {
        if (this.isWall(x, y)) {
            return false;
        }
        this.blockedTiles.add(this.key(x, y));
        return true;
    }

    blockTile(x, y) {
        return this.addBlock(x, y);
    }

    removeBlock(x, y) {
        this.blockedTiles.delete(this.key(x, y));
    }

    unblockAll() {
        this.blockedTiles.clear();
    }

    isOnSafePath(x, y) {
        return this.safePathSet.has(this.key(x, y));
    }

    getSafePath() {
        return this.safePath.map(point => ({ x: point.x, y: point.y }));
    }

    getNeighbors(point) {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        const neighbors = [];

        for (const direction of directions) {
            const x = point.x + direction.x;
            const y = point.y + direction.y;

            if (!this.isWall(x, y)) {
                neighbors.push({ x, y });
            }
        }

        return neighbors;
    }

    getDegree(point) {
        return this.getNeighbors(point).length;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    findPath(start, goal) {
        if (!start || !goal) return [];
        if (!this.isWalkable(start.x, start.y)) return [];
        if (!this.isWalkable(goal.x, goal.y)) return [];

        const queue = [{ x: start.x, y: start.y }];
        const previous = new Map();
        previous.set(this.pointKey(start), null);

        let queueIndex = 0;

        while (queueIndex < queue.length) {
            const current = queue[queueIndex++];

            if (current.x === goal.x && current.y === goal.y) {
                break;
            }

            for (const next of this.getNeighbors(current)) {
                const nextKey = this.pointKey(next);

                if (!this.isWalkable(next.x, next.y)) continue;
                if (previous.has(nextKey)) continue;

                previous.set(nextKey, current);
                queue.push(next);
            }
        }

        const goalKey = this.pointKey(goal);
        if (!previous.has(goalKey)) return [];

        const path = [];
        let current = { x: goal.x, y: goal.y };

        while (current) {
            path.push({ x: current.x, y: current.y });
            current = previous.get(this.pointKey(current));
        }

        return path.reverse();
    }

    /*
     * Enumerate the actual simple S -> E paths in the physical maze.
     * The supplied maps are small enough for this to be practical.
     */
    findAllSimplePaths(maxPaths = 10000) {
        const routes = [];
        const start = { x: this.start.x, y: this.start.y };

        const stack = [{
            point: start,
            path: [start],
            visited: new Set([this.pointKey(start)])
        }];

        while (stack.length && routes.length < maxPaths) {
            const state = stack.pop();

            if (state.point.x === this.exit.x && state.point.y === this.exit.y) {
                routes.push(state.path);
                continue;
            }

            const neighbors = this.shuffle(this.getNeighbors(state.point));

            for (const next of neighbors) {
                const nextKey = this.pointKey(next);
                if (state.visited.has(nextKey)) continue;

                const visited = new Set(state.visited);
                visited.add(nextKey);

                stack.push({
                    point: { x: next.x, y: next.y },
                    path: [
                        ...state.path,
                        { x: next.x, y: next.y }
                    ],
                    visited
                });
            }
        }

        return routes;
    }

    routeSignature(route) {
        return route.map(point => this.pointKey(point)).join("|");
    }

    /*
     * Return a six-step maze path beginning with the supplied direction.
     * Only the FIRST step is forced to be straight ahead. The following
     * five steps may turn normally through the maze.
     */
    findSixStepsAhead(start, direction, distance = 6) {
        if (!start || !direction || distance < 1) return null;

        const dx = Math.sign(direction.x || 0);
        const dy = Math.sign(direction.y || 0);

        /* Only a real cardinal movement direction is accepted. */
        if (Math.abs(dx) + Math.abs(dy) !== 1) {
            return null;
        }

        /*
         * First step is HARD-FORCED to be the direction in which the
         * player entered the trigger. After that, the search can turn
         * freely. A depth-limited DFS is used instead of a normal BFS so
         * that we specifically find a SIX-STEP route, not merely a route
         * to a nearby cell.
         */
        const first = {
            x: start.x + dx,
            y: start.y + dy
        };

        if (!this.isWalkable(first.x, first.y)) {
            return null;
        }

        const path = [{ x: first.x, y: first.y }];
        const visited = new Set([
            this.pointKey(start),
            this.pointKey(first)
        ]);

        const search = point => {
            if (path.length === distance) {
                return {
                    x: point.x,
                    y: point.y,
                    path: path.map(step => ({
                        x: step.x,
                        y: step.y
                    }))
                };
            }

            const neighbors = this.shuffle(this.getNeighbors(point));

            for (const next of neighbors) {
                const nextKey = this.pointKey(next);

                if (visited.has(nextKey)) continue;
                if (!this.isWalkable(next.x, next.y)) continue;

                visited.add(nextKey);
                path.push({ x: next.x, y: next.y });

                const result = search(next);
                if (result) return result;

                path.pop();
                visited.delete(nextKey);
            }

            return null;
        };

        return search(first);
    }

    /*
     * Candidate positions for ONE particular S -> E route.
     *
     * The trigger belongs to this exact route. The six-step spawn path
     * is also taken from this exact route, so "six tiles ahead" means
     * six maze steps and the route is allowed to turn.
     *
     * This is deliberately NOT a straight-line test.
     */
    getRouteTriggerCandidates(route, safeSet, distance = 6) {
        const candidates = [];

        if (!route || route.length < distance + 3) {
            return candidates;
        }

        /* Keep the trigger away from E so the player has room to react. */
        const lastUsableIndex = route.length - distance - 1;

        for (let index = 1; index <= lastUsableIndex; index++) {
            const point = route[index];
            const triggerKey = this.pointKey(point);

            if (safeSet.has(triggerKey)) continue;
            if (point.x === this.start.x && point.y === this.start.y) continue;
            if (point.x === this.exit.x && point.y === this.exit.y) continue;

            const previous = route[index - 1];
            const approachDirection = {
                x: point.x - previous.x,
                y: point.y - previous.y
            };

            if (
                Math.abs(approachDirection.x) +
                    Math.abs(approachDirection.y) !== 1
            ) {
                continue;
            }

            /*
             * IMPORTANT:
             *
             * The first spawn step is the SAME direction in which the
             * player entered the trigger. This is what keeps the ghost in
             * front of the player rather than behind or to the side.
             *
             * After that first step, the six-step search may turn freely.
             */
            const spawn = this.findSixStepsAhead(
                point,
                approachDirection,
                distance
            );

            if (!spawn) continue;

            candidates.push({
                x: point.x,
                y: point.y,
                approachDirection: {
                    x: approachDirection.x,
                    y: approachDirection.y
                },
                spawn: {
                    x: spawn.x,
                    y: spawn.y
                },
                spawnPath: spawn.path.map(step => ({
                    x: step.x,
                    y: step.y
                })),
                routeIndex: index
            });
        }

        return candidates;
    }

    /*
     * Create a random order without always preferring the branch entrance.
     * Candidates from different depths are mixed rather than sorted.
     */
    randomizeCandidates(candidates) {
        const copy = [...candidates];
        this.shuffle(copy);
        return copy;
    }

    /*
     * Give EVERY non-safe route one trigger.
     *
     * A trigger tile is not allowed to be reused when a different tile is
     * available. This is important: 19 non-safe routes should not collapse
     * into one shared trigger just because the routes share a corridor.
     *
     * The small backtracking matcher is randomized so the trigger positions
     * change between rounds while still covering every route.
     */
    findRouteTriggerMatching(routeCandidates) {
        const routeCount = routeCandidates.length;
        if (routeCount === 0) return [];

        const options = routeCandidates.map(candidates => {
            const copy = [...candidates];
            this.shuffle(copy);
            return copy;
        });

        /*
         * Fast randomized bipartite matching.
         *
         * Left side  = non-safe routes.
         * Right side = physical trigger tiles.
         *
         * We try to give every route a different tile. Unlike the old
         * repeated backtracking attempts, this is linear-ish in the number
         * of route/candidate edges and stays fast on Level 3.
         */
        const order = Array.from({ length: routeCount }, (_, i) => i);
        order.sort((a, b) => options[a].length - options[b].length);

        const tileOwner = new Map();
        const assigned = new Array(routeCount).fill(null);

        const tryAssign = (routeIndex, seenTiles) => {
            for (const candidate of options[routeIndex]) {
                const tileKey = this.key(candidate.x, candidate.y);

                if (seenTiles.has(tileKey)) continue;
                seenTiles.add(tileKey);

                const owner = tileOwner.get(tileKey);

                if (owner === undefined || tryAssign(owner, seenTiles)) {
                    tileOwner.set(tileKey, routeIndex);
                    assigned[routeIndex] = candidate;
                    return true;
                }
            }

            return false;
        };

        let perfect = true;

        for (const routeIndex of order) {
            if (!tryAssign(routeIndex, new Set())) {
                perfect = false;
                break;
            }
        }

        if (perfect && assigned.every(Boolean)) {
            return assigned;
        }

        /*
         * Unique physical trigger tiles are preferable, but they are not a
         * requirement of the game. If two S->E routes share every possible
         * trigger tile, we still MUST give both routes a trigger assignment.
         * Choose the least-used candidate for each route.
         */
        const usage = new Map();
        const fallback = new Array(routeCount).fill(null);

        const fallbackOrder = Array.from(
            { length: routeCount },
            (_, i) => i
        );
        this.shuffle(fallbackOrder);

        for (const routeIndex of fallbackOrder) {
            const candidates = [...options[routeIndex]];

            candidates.sort((a, b) => {
                const aKey = this.key(a.x, a.y);
                const bKey = this.key(b.x, b.y);
                return (usage.get(aKey) || 0) - (usage.get(bKey) || 0);
            });

            const minimumUsage = candidates.length
                ? usage.get(this.key(candidates[0].x, candidates[0].y)) || 0
                : 0;

            const pool = candidates.filter(candidate => {
                return (
                    usage.get(this.key(candidate.x, candidate.y)) || 0
                ) === minimumUsage;
            });

            this.shuffle(pool);
            const selected = pool[0];

            if (!selected) return null;

            fallback[routeIndex] = selected;

            const selectedKey = this.key(selected.x, selected.y);
            usage.set(
                selectedKey,
                (usage.get(selectedKey) || 0) + 1
            );
        }

        return fallback;
    }

    /*
     * Choose ONE safe S -> E route for the whole round.
     *
     * Then assign ONE hidden trigger to EVERY other actual simple S -> E
     * route. There is intentionally no maxTriggers cap here.
     *
     * The selected safe route and all trigger positions are frozen until
     * the round ends.
     */
    chooseRandomEscapeRoute(avoidSafeRouteSignatures = []) {
        const routes = this.findAllSimplePaths();

        if (!routes.length) {
            return {
                path: [],
                gates: [],
                routeCount: 0,
                safeRouteIndex: -1,
                nonSafeRouteCount: 0
            };
        }

        /*
         * findAllSimplePaths already returns every actual S -> E route.
         * Shuffle so route indices do not become a fixed safe-route choice.
         */
        this.shuffle(routes);

        const validPlans = [];

        for (let safeIndex = 0; safeIndex < routes.length; safeIndex++) {
            const safeRoute = routes[safeIndex];
            const safeSet = new Set(
                safeRoute.map(point => this.pointKey(point))
            );

            const routeCandidates = [];
            let valid = true;

            for (let routeIndex = 0; routeIndex < routes.length; routeIndex++) {
                if (routeIndex === safeIndex) continue;

                const candidates = this.getRouteTriggerCandidates(
                    routes[routeIndex],
                    safeSet,
                    6
                );

                if (!candidates.length) {
                    valid = false;
                    break;
                }

                routeCandidates.push(candidates);
            }

            if (!valid) continue;

            const matching = this.findRouteTriggerMatching(routeCandidates);

            if (!matching || matching.length !== routes.length - 1) {
                continue;
            }

            if (matching.some(candidate => !candidate)) {
                continue;
            }

            validPlans.push({
                safeIndex,
                safeRoute,
                matching
            });
        }

        if (!validPlans.length) {
            console.error(
                "[Maze Escape] Could not construct a round with one trigger for every non-safe S->E route."
            );

            return {
                path: [],
                gates: [],
                routeCount: routes.length,
                safeRouteIndex: -1,
                nonSafeRouteCount: Math.max(0, routes.length - 1)
            };
        }

        /*
         * Do not repeat the immediately previous safe route when another
         * valid safe route exists. This makes repeated restarts visibly
         * random instead of merely relying on probability.
         */
        let pool = validPlans;

        /*
         * Prefer a safe route that has not been used in the recent rounds.
         * This is stronger than relying on Math.random alone: restarting a
         * level repeatedly will not keep handing back the same route when
         * other valid routes are available.
         */
        const recent = Array.isArray(avoidSafeRouteSignatures)
            ? new Set(avoidSafeRouteSignatures)
            : new Set(
                avoidSafeRouteSignatures
                    ? [avoidSafeRouteSignatures]
                    : []
            );

        if (recent.size) {
            const alternatives = validPlans.filter(plan => {
                return !recent.has(this.routeSignature(plan.safeRoute));
            });

            if (alternatives.length) {
                pool = alternatives;
            }
        }

        this.shuffle(pool);
        const selectedPlan = pool[0];
        const safeRoute = selectedPlan.safeRoute;

        this.safePath = safeRoute.map(point => ({
            x: point.x,
            y: point.y
        }));

        this.safePathSet = new Set(
            this.safePath.map(point => this.pointKey(point))
        );

        const gates = selectedPlan.matching.map((candidate, nonSafeIndex) => ({
            x: candidate.x,
            y: candidate.y,
            routeIndex: nonSafeIndex,
            direction: candidate.approachDirection
                ? {
                    x: candidate.approachDirection.x,
                    y: candidate.approachDirection.y
                }
                : null,
            approachDirection: candidate.approachDirection
                ? {
                    x: candidate.approachDirection.x,
                    y: candidate.approachDirection.y
                }
                : null,
            spawn: {
                x: candidate.spawn.x,
                y: candidate.spawn.y
            },
            spawnPath: candidate.spawnPath.map(point => ({
                x: point.x,
                y: point.y
            }))
        }));

        /*
         * Trigger order has no gameplay meaning, so randomize it too.
         * The trigger positions themselves remain frozen for this round.
         */
        this.shuffle(gates);

        return {
            path: this.safePath.map(point => ({
                x: point.x,
                y: point.y
            })),
            gates,
            routeCount: routes.length,
            safeRouteIndex: selectedPlan.safeIndex,
            nonSafeRouteCount: routes.length - 1
        };
    }

}

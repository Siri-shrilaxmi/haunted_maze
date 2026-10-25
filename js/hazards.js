class ChaseBlock {

    constructor(maze, config) {

        this.maze = maze;
        this.config = config;

        this.x = 0;
        this.y = 0;

        this.trigger = {
            x: config.trigger.x,
            y: config.trigger.y
        };

        this.spawn = null;
        this.spawnPath = [];
        this.direction = null;
        this.spawnIndex = 0;
        this.encounterId = null;

        this.state = "waiting";

        this.active = false;

        this.path = [];
        this.pathIndex = 0;

        this.chaseTime = 0;
        this.chaseDistance = 0;

        this.currentTarget = null;

        this.pathRefreshTimer = 0;
        this.pathRefreshRate = 0.08;

        this.appearanceTime = 0;
        this.lastPlayerDirection = { x: 0, y: 0 };
        this.speedRamp = 0;
        this.stuckTime = 0;
        this.fadeTime = 0;
        this.fadeDuration = 0.55;
    }


    reset() {

        this.x = 0;
        this.y = 0;

        this.spawn = null;
        this.spawnPath = [];
        this.direction = null;
        this.spawnIndex = 0;
        this.encounterId = null;

        this.state = "waiting";

        this.active = false;

        this.path = [];
        this.pathIndex = 0;

        this.chaseTime = 0;
        this.chaseDistance = 0;

        this.currentTarget = null;

        this.pathRefreshTimer = 0;

        this.appearanceTime = 0;
        this.lastPlayerDirection = { x: 0, y: 0 };
        this.speedRamp = 0;
        this.stuckTime = 0;
        this.fadeTime = 0;
    }


    isWaiting() {
        return this.state === "waiting";
    }


    isWarning() {
        return this.state === "warning";
    }


    isChasing() {
        return this.state === "chasing";
    }


    isBlocking() {
        return this.state === "blocking";
    }


    isFading() {
        return this.state === "fading";
    }


    isReadyForRespawn() {
        return this.state === "waiting" && this.fadeTime >= this.fadeDuration;
    }


    /*
     * ============================================================
     * LETHAL STATE
     * ============================================================
     *
     * The ghost is dangerous in BOTH active states:
     *
     *      chasing  -> can kill the player
     *      blocking -> can also kill the player
     *
     * The blocking ghost is therefore NOT just a normal wall.
     *
     * It remains a permanent lethal ghost on the trigger tile.
     */
    isLethal() {

        return (
            this.active &&
            (
                this.state === "chasing" ||
                this.state === "blocking"
            )
        );
    }


    /*
     * Spawn only in the direction from which
     * the player entered the trigger.
     *
     * No sideways spawning.
     * No diagonal spawning.
     * No spawning behind the player.
     */
    findFrontSpawn(direction, distanceOverride = null) {

        if (!direction) return null;

        const dx = Math.sign(direction.x || 0);
        const dy = Math.sign(direction.y || 0);

        if ((dx !== 0 && dy !== 0) || (dx === 0 && dy === 0)) {
            return null;
        }

        /*
         * Ambush behavior: after the player crosses a trigger, the
         * ghost prefers to materialize BEHIND the player. This makes
         * the event a chase rather than a predictable wall appearing
         * directly in front of the player.
         */
        const ambushDirection = { x: -dx, y: -dy };
        const distance = Math.max(3, Math.floor(
            distanceOverride ?? this.config.spawnDistance ?? 5
        ));

        let spawnPath = this.maze.findSixStepsAhead(
            this.trigger,
            ambushDirection,
            distance
        );

        /* If the corridor behind is too short, use the forward side
           rather than cancelling the encounter. */
        if (!spawnPath) {
            spawnPath = this.maze.findSixStepsAhead(
                this.trigger,
                { x: dx, y: dy },
                distance
            );
        }

        if (!spawnPath) return null;

        return { x: spawnPath.x, y: spawnPath.y, path: spawnPath.path };
    }

    prepareSpawn(direction, spawnOverride = null) {

        if (this.state !== "waiting") {
            return false;
        }

        const spawn =
            spawnOverride || this.findFrontSpawn(direction);

        if (!spawn) {

            console.warn(
                `Chase event "${this.config.id}" cannot find six maze steps in front of the player.`
            );

            return false;
        }

        this.direction = {
            x: Math.sign(direction.x || 0),
            y: Math.sign(direction.y || 0)
        };

        this.spawn = {
            x: spawn.x,
            y: spawn.y
        };

        this.spawnPath =
            spawn.path || [];

        this.state = "warning";

        this.active = false;

        return true;
    }


    startWarning() {

        if (this.state !== "warning") {
            return;
        }

        /*
         * Ghost is invisible and non-lethal
         * during the warning.
         */
        this.active = false;
    }


    /*
     * ============================================================
     * BEGIN CHASE
     * ============================================================
     */

    beginChase() {

        if (
            this.state !== "warning" ||
            !this.spawn
        ) {
            return false;
        }

        this.x = this.spawn.x;
        this.y = this.spawn.y;

        this.state = "chasing";

        /*
         * Chasing ghost is active and lethal.
         */
        this.active = true;

        this.path = [];
        this.pathIndex = 0;

        this.chaseTime = 0;
        this.chaseDistance = 0;

        this.currentTarget = null;

        this.pathRefreshTimer = 0;
        this.appearanceTime = 0;
        this.speedRamp = 0;
        this.stuckTime = 0;

        return true;
    }


    /*
     * ============================================================
     * FINISH CHASE
     * ============================================================
     *
     * IMPORTANT:
     *
     * The ghost does NOT disappear.
     *
     * It moves permanently to the trigger tile and becomes
     * a stationary lethal ghost.
     */
    finishChase() {

        /*
         * A completed chase should feel like the ghost vanishes back
         * into the maze, not like it permanently becomes a second wall.
         * The ghost remains visible for a short fade-out and is then
         * recycled by the Game into a new trigger elsewhere.
         */
        this.state = "fading";
        /* Fading ghosts are visual only; they cannot kill the player. */
        this.active = false;
        this.fadeTime = 0;

        this.path = [];
        this.pathIndex = 0;
        this.currentTarget = null;
    }


    getGridPosition() {

        return {
            x: Math.round(this.x),
            y: Math.round(this.y)
        };
    }


    /*
     * ============================================================
     * UPDATE
     * ============================================================
     */

    update(
        deltaTime,
        player
    ) {

        if (this.state === "fading") {
            this.fadeTime += deltaTime;
            if (this.fadeTime >= this.fadeDuration) {
                this.active = false;
                this.state = "waiting";
                this.fadeTime = this.fadeDuration;
            }
            return;
        }

        if (this.state === "blocking" || this.state !== "chasing" || !player) {
            return;
        }

        this.chaseTime += deltaTime;
        this.appearanceTime += deltaTime;

        if (this.config.maxDuration && this.chaseTime >= this.config.maxDuration) {
            this.finishChase();
            return;
        }

        const dx = Math.sign(player.x - this.x);
        const dy = Math.sign(player.y - this.y);
        if (Math.abs(dx) + Math.abs(dy) === 1) {
            this.lastPlayerDirection = { x: dx, y: dy };
        }

        this.pathRefreshTimer -= deltaTime;
        if (this.pathRefreshTimer <= 0 || this.path.length === 0 || this.pathIndex >= this.path.length) {
            this.calculatePath(player);
            this.pathRefreshTimer = this.pathRefreshRate;
        }

        this.moveAlongPath(deltaTime, player);

        if (this.config.maxDistance && this.chaseDistance >= this.config.maxDistance) {
            this.finishChase();
        }
    }

    calculatePath(player) {

        const start = {

            x: Math.round(
                this.x
            ),

            y: Math.round(
                this.y
            )
        };


        const lead = this.chaseTime < 0.8 ? 1 : 2;
        const predicted = {
            x: Math.round(player.x + this.lastPlayerDirection.x * lead),
            y: Math.round(player.y + this.lastPlayerDirection.y * lead)
        };

        const goal = this.maze.isWalkable(predicted.x, predicted.y)
            ? predicted
            : { x: Math.round(player.x), y: Math.round(player.y) };


        this.currentTarget =
            goal;


        const newPath =
            this.maze.findPath(
                start,
                goal
            );


        if (
            !newPath ||
            newPath.length === 0
        ) {

            this.path = [];

            this.pathIndex = 0;

            return;
        }


        this.path =
            newPath;

        this.pathIndex = 1;
    }


    moveAlongPath(
        deltaTime,
        player
    ) {

        if (
            !this.path ||
            this.path.length === 0
        ) {
            return;
        }


        if (
            this.pathIndex >=
            this.path.length
        ) {
            return;
        }


        const target =
            this.path[
                this.pathIndex
            ];


        const dx =
            target.x -
            this.x;


        const dy =
            target.y -
            this.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance < 0.001
        ) {

            this.x =
                target.x;

            this.y =
                target.y;

            this.pathIndex++;

            return;
        }


        // Global movement scale: keep the entire chase noticeably slower
        // while preserving the same proportional acceleration/proximity behavior.
        const MOVEMENT_SPEED_SCALE = 0.60;
        const baseSpeed = this.config.speed || 3.5;
        const ramp = Math.min(1, this.chaseTime / 3.5);
        const proximity = player
            ? Math.max(0, 1 - Math.hypot(player.x - this.x, player.y - this.y) / 8)
            : 0;
        const speed = (baseSpeed + ramp * 1.8 + proximity * 1.2) * MOVEMENT_SPEED_SCALE;

        const movement = speed * deltaTime;


        if (
            movement >= distance
        ) {

            this.x =
                target.x;

            this.y =
                target.y;


            this.chaseDistance +=
                distance;


            this.pathIndex++;

        } else {

            this.x +=
                (
                    dx /
                    distance
                ) *
                movement;


            this.y +=
                (
                    dy /
                    distance
                ) *
                movement;


            this.chaseDistance +=
                movement;
        }
    }


    /*
     * ============================================================
     * COLLISION
     * ============================================================
     *
     * BOTH types of ghost are lethal:
     *
     * 1. Moving/chasing ghost
     * 2. Stationary/blocking ghost
     *
     * Warning state is NOT lethal because active=false.
     */
    isColliding(player) {

        if (
            !this.isLethal() ||
            !player
        ) {
            return false;
        }


        const dx =
            this.x -
            player.x;


        const dy =
            this.y -
            player.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        return distance < 0.55;
    }


    /*
     * ============================================================
     * GHOST ICON
     * ============================================================
     */

    draw(ctx, tileSize) {

        if (!this.active && this.state !== "fading") {
            return;
        }

        const fadeProgress = this.state === "fading"
            ? Math.min(1, this.fadeTime / this.fadeDuration)
            : 0;
        /* Ease the disappearance instead of leaving a fully visible
           stationary ghost for a noticeable pause. The first frame of
           fading immediately starts reducing opacity and size. */
        const easedFade = fadeProgress * fadeProgress;
        const ghostAlpha = this.state === "fading"
            ? Math.max(0, 1 - easedFade)
            : 1;
        ctx.save();
        ctx.globalAlpha = ghostAlpha;


        const centerX =
            this.x *
            tileSize +
            tileSize / 2;


        const centerY =
            this.y *
            tileSize +
            tileSize / 2;


        const size =
            tileSize * (0.78 * (1 - 0.18 * fadeProgress));


        /*
         * Ghost glow.
         */
        const glow =
            ctx.createRadialGradient(

                centerX,
                centerY,
                2,

                centerX,
                centerY,
                tileSize * 1.15

            );


        glow.addColorStop(
            0,
            "rgba(220,230,255,0.30)"
        );


        glow.addColorStop(
            0.5,
            "rgba(160,175,220,0.10)"
        );


        glow.addColorStop(
            1,
            "rgba(160,175,220,0)"
        );


        ctx.fillStyle =
            glow;


        ctx.fillRect(

            centerX -
                tileSize * 1.2,

            centerY -
                tileSize * 1.2,

            tileSize * 2.4,

            tileSize * 2.4

        );


        /*
         * Ghost dimensions.
         */
        const left =
            centerX -
            size / 2;


        const right =
            centerX +
            size / 2;


        const top =
            centerY -
            size * 0.48;


        const bottom =
            centerY +
            size * 0.50;


        const radius =
            size * 0.38;


        /*
         * Ghost body.
         */
        ctx.beginPath();


        ctx.moveTo(
            left,
            bottom
        );


        ctx.lineTo(
            left,
            centerY -
                size * 0.05
        );


        ctx.arcTo(
            left,
            top,
            centerX,
            top,
            radius
        );


        ctx.arcTo(
            right,
            top,
            right,
            centerY -
                size * 0.05,
            radius
        );


        ctx.lineTo(
            right,
            bottom
        );


        /*
         * Wavy bottom.
         */
        ctx.lineTo(
            right -
                size * 0.17,
            bottom -
                size * 0.12
        );


        ctx.lineTo(
            right -
                size * 0.34,
            bottom
        );


        ctx.lineTo(
            centerX,
            bottom -
                size * 0.12
        );


        ctx.lineTo(
            left +
                size * 0.34,
            bottom
        );


        ctx.lineTo(
            left +
                size * 0.17,
            bottom -
                size * 0.12
        );


        ctx.closePath();


        /*
         * Ghost body.
         */
        ctx.fillStyle =
            "#e8edf7";


        ctx.fill();


        ctx.strokeStyle =
            "rgba(255,255,255,0.55)";


        ctx.lineWidth =
            1.5;


        ctx.stroke();


        /*
         * Ghost eyes.
         */
        const eyeY =
            centerY -
            size * 0.08;


        const eyeOffset =
            size * 0.18;


        ctx.fillStyle =
            "#171b25";


        ctx.beginPath();


        ctx.ellipse(

            centerX -
                eyeOffset,

            eyeY,

            size * 0.065,

            size * 0.105,

            0,

            0,

            Math.PI * 2

        );


        ctx.fill();


        ctx.beginPath();


        ctx.ellipse(

            centerX +
                eyeOffset,

            eyeY,

            size * 0.065,

            size * 0.105,

            0,

            0,

            Math.PI * 2

        );


        ctx.fill();

        ctx.restore();

    }

}
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

        this.state = "waiting";

        this.active = false;

        this.path = [];
        this.pathIndex = 0;

        this.chaseTime = 0;
        this.chaseDistance = 0;

        this.currentTarget = null;

        this.pathRefreshTimer = 0;
        this.pathRefreshRate = 0.12;
    }


    reset() {

        this.x = 0;
        this.y = 0;

        this.spawn = null;
        this.spawnPath = [];
        this.direction = null;

        this.state = "waiting";

        this.active = false;

        this.path = [];
        this.pathIndex = 0;

        this.chaseTime = 0;
        this.chaseDistance = 0;

        this.currentTarget = null;

        this.pathRefreshTimer = 0;
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


    /*
     * Spawn only in the direction from which
     * the player entered the trigger.
     *
     * No sideways spawning.
     * No diagonal spawning.
     * No spawning behind the player.
     */
    findFrontSpawn(direction) {

        if (!direction) {
            return null;
        }

        const dx = Math.sign(direction.x || 0);
        const dy = Math.sign(direction.y || 0);

        if (
            (dx !== 0 && dy !== 0) ||
            (dx === 0 && dy === 0)
        ) {
            return null;
        }

        /*
         * SIX MAZE STEPS, not six straight tiles.
         *
         * The first step is forced to be the direction the player used
         * to enter the trigger. After that the path is allowed to turn.
         */
        const distance = Math.max(1, Math.floor(this.config.spawnDistance || 6));
        const spawnPath = this.maze.findSixStepsAhead(
            this.trigger,
            { x: dx, y: dy },
            distance
        );

        if (!spawnPath) {
            return null;
        }

        return {
            x: spawnPath.x,
            y: spawnPath.y,
            path: spawnPath.path
        };
    }

    prepareSpawn(direction) {

        if (this.state !== "waiting") {
            return false;
        }

        const spawn = this.findFrontSpawn(direction);

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

        this.spawnPath = spawn.path || [];
        this.state = "warning";
        this.active = false;

        return true;
    }

    startWarning() {

        if (this.state !== "warning") {
            return;
        }

        this.active = false;
    }

    /*
     * Called after the warning disappears.
     */
    beginChase() {

        if (this.state !== "warning" || !this.spawn) {
            return false;
        }

        this.x = this.spawn.x;
        this.y = this.spawn.y;

        this.state = "chasing";
        this.active = true;

        this.path = [];
        this.pathIndex = 0;
        this.chaseTime = 0;
        this.chaseDistance = 0;
        this.currentTarget = null;
        this.pathRefreshTimer = 0;

        return true;
    }

    /*
     * After the chase, the ghost remains permanently on the trigger tile
     * and the physical trigger tile becomes blocked.
     */
    finishChase() {

        this.x = this.trigger.x;
        this.y = this.trigger.y;

        this.state = "blocking";
        this.active = true;

        this.path = [];
        this.pathIndex = 0;
        this.currentTarget = null;

        if (this.maze && this.maze.addBlock) {
            this.maze.addBlock(this.trigger.x, this.trigger.y);
        }
    }

    getGridPosition() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y)
        };
    }

    update(
        deltaTime,
        player
    ) {

        if (
            this.state !== "chasing"
        ) {
            return;
        }


        if (!player) {
            return;
        }


        this.chaseTime +=
            deltaTime;


        /*
         * Maximum chase time.
         */
        if (
            this.config.maxDuration &&
            this.chaseTime >=
                this.config.maxDuration
        ) {

            this.finishChase();

            return;
        }


        this.pathRefreshTimer -=
            deltaTime;


        if (
            this.pathRefreshTimer <= 0 ||
            this.path.length === 0 ||
            this.pathIndex >=
                this.path.length
        ) {

            this.calculatePath(
                player
            );

            this.pathRefreshTimer =
                this.pathRefreshRate;
        }


        this.moveAlongPath(
            deltaTime
        );


        /*
         * Maximum chase distance.
         */
        if (
            this.config.maxDistance &&
            this.chaseDistance >=
                this.config.maxDistance
        ) {

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


        const goal = {

            x: Math.round(
                player.x
            ),

            y: Math.round(
                player.y
            )
        };


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
        deltaTime
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


        const speed =
            this.config.speed || 3;


        const movement =
            speed *
            deltaTime;


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


    isColliding(player) {

        if (
            !this.active ||
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

        if (!this.active) {
            return;
        }


        const centerX =
            this.x *
            tileSize +
            tileSize / 2;


        const centerY =
            this.y *
            tileSize +
            tileSize / 2;


        const size =
            tileSize * 0.78;


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

    }

}
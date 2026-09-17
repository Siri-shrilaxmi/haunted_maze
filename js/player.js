class Player {
    constructor(maze) {
        this.maze = maze;

        this.x = maze.start.x;
        this.y = maze.start.y;

        this.moveDelay = 120;
        this.lastMoveTime = 0;
    }

    move(dx, dy, currentTime) {
        if (currentTime - this.lastMoveTime < this.moveDelay) {
            return;
        }

        const newX = this.x + dx;
        const newY = this.y + dy;

        if (this.maze.isWalkable(newX, newY)) {
            this.x = newX;
            this.y = newY;

            this.lastMoveTime = currentTime;
        }
    }

    update(keys, currentTime) {
        let dx = 0;
        let dy = 0;

        if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
            dy = -1;
        } else if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
            dy = 1;
        } else if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
            dx = -1;
        } else if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
            dx = 1;
        }

        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy, currentTime);
        }
    }
}
class Renderer {
    constructor(canvas, maze) {
        this.canvas = canvas;
        this.maze = maze;
        this.ctx = canvas.getContext("2d");
        this.tileSize = maze.tileSize;

        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = this.maze.getWidth();
        this.canvas.height = this.maze.getHeight();
    }

    draw(player, hazards = []) {
        const ctx = this.ctx;
        const tileSize = this.tileSize;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const isDigital = this.maze.theme === "Digital World";
        const isJungle = this.maze.theme === "Forgotten Jungle";
        const isSnow = this.maze.theme === "Frozen Wilderness";
        const isPalace = this.maze.theme === "Forgotten Palace";

        // ------------------------------------------------------------
        // BACKGROUND
        // ------------------------------------------------------------
        if (isDigital) {
            ctx.fillStyle = "#030b08";
        } else if (isSnow) {
            ctx.fillStyle = "#07131d";
        } else if (isJungle) {
            ctx.fillStyle = "#07140d";
        } else if (isPalace) {
            ctx.fillStyle = "#120b05";
        } else {
            ctx.fillStyle = "#071018";
        }

        ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        // ------------------------------------------------------------
        // MAZE
        // ------------------------------------------------------------
        for (let y = 0; y < this.maze.rows; y++) {
            for (let x = 0; x < this.maze.cols; x++) {

                const tile = this.maze.map[y][x];

                const px = x * tileSize;
                const py = y * tileSize;

                if (tile === "#") {
                    if (isDigital) {
                        this.drawDigitalWall(ctx, px, py, tileSize, x, y);
                    } else if (isSnow) {
                        this.drawSnowWall(
                            ctx,
                            px,
                            py,
                            tileSize,
                            x,
                            y
                        );
                    } else if (isJungle) {
                        this.drawJungleWall(
                            ctx,
                            px,
                            py,
                            tileSize,
                            x,
                            y
                        );
                    } else if (isPalace) {
                        this.drawPalaceWall(
                            ctx,
                            px,
                            py,
                            tileSize,
                            x,
                            y
                        );
                    } else {
                        this.drawUndergroundWall(
                            ctx,
                            px,
                            py,
                            tileSize
                        );
                    }
                } else {
                    if (isDigital) {
                        this.drawDigitalFloor(ctx, px, py, tileSize, x, y);
                    } else if (isSnow) {
                        this.drawSnowFloor(
                            ctx,
                            px,
                            py,
                            tileSize,
                            x,
                            y
                        );
                    } else if (isJungle) {
                        this.drawJungleFloor(
                            ctx,
                            px,
                            py,
                            tileSize,
                            x,
                            y
                        );
                    } else if (isPalace) {
                        this.drawPalaceFloor(
                            ctx,
                            px,
                            py,
                            tileSize,
                            x,
                            y
                        );
                    } else {
                        this.drawUndergroundFloor(
                            ctx,
                            px,
                            py,
                            tileSize
                        );
                    }
                }

                // ----------------------------------------------------
                // START
                // ----------------------------------------------------
                if (tile === "S") {
                    this.drawStartIcon(
                        ctx,
                        px,
                        py,
                        tileSize
                    );
                }

                // ----------------------------------------------------
                // EXIT
                // ----------------------------------------------------
                if (tile === "E") {
                    this.drawDoorIcon(
                        ctx,
                        px,
                        py,
                        tileSize,
                        isJungle,
                        isSnow,
                        isDigital,
                        isPalace
                    );
                }
            }
        }

        // ------------------------------------------------------------
        // HAZARDS
        // ------------------------------------------------------------
        for (const hazard of hazards) {
            if (!hazard || !hazard.active) continue;

            this.drawGhostEmoji(
                ctx,
                hazard.x,
                hazard.y,
                tileSize,
                isJungle,
                isSnow,
                isDigital,
                isPalace
            );
        }

        // ------------------------------------------------------------
        // PLAYER
        // ------------------------------------------------------------
        if (player) {
            this.drawPlayer(
                ctx,
                player.x,
                player.y,
                tileSize,
                isJungle,
                isSnow,
                isDigital,
                isPalace
            );
        }
    }

    // ================================================================
    // UNDERGROUND THEME
    // ================================================================

    drawUndergroundWall(ctx, px, py, tileSize) {
        ctx.fillStyle = "#111c26";
        ctx.fillRect(px, py, tileSize, tileSize);

        ctx.strokeStyle = "#1e3445";
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, tileSize, tileSize);
    }

    drawUndergroundFloor(ctx, px, py, tileSize) {
        ctx.fillStyle = "#08121b";
        ctx.fillRect(px, py, tileSize, tileSize);

        ctx.strokeStyle = "rgba(50,80,100,0.12)";
        ctx.strokeRect(px, py, tileSize, tileSize);
    }

    // ================================================================
    // DIGITAL WORLD THEME
    // ================================================================

    drawDigitalWall(ctx, px, py, tileSize, x, y) {
        ctx.fillStyle = "#06130f";
        ctx.fillRect(px, py, tileSize, tileSize);

        ctx.fillStyle = "#09251b";
        ctx.fillRect(px + 3, py + 3, tileSize - 6, tileSize - 6);

        ctx.strokeStyle = "rgba(56, 255, 170, 0.32)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

        if ((x * 11 + y * 7) % 4 === 0) {
            ctx.fillStyle = "rgba(75, 255, 180, 0.20)";
            ctx.fillRect(px + 7, py + 8, tileSize * 0.22, 2);
            ctx.fillRect(px + 15, py + 15, tileSize * 0.32, 2);
        }
    }

    drawDigitalFloor(ctx, px, py, tileSize, x, y) {
        ctx.fillStyle = "#03100c";
        ctx.fillRect(px, py, tileSize, tileSize);

        ctx.strokeStyle = "rgba(38, 210, 145, 0.12)";
        ctx.strokeRect(px, py, tileSize, tileSize);

        if ((x * 17 + y * 13) % 6 === 0) {
            ctx.fillStyle = "rgba(62, 255, 170, 0.16)";
            ctx.fillRect(px + tileSize * 0.25, py + tileSize * 0.3, 3, 3);
            ctx.fillRect(px + tileSize * 0.62, py + tileSize * 0.62, 2, 2);
        }
    }

    // ================================================================
    // JUNGLE THEME
    // ================================================================

    drawJungleWall(ctx, px, py, tileSize, x, y) {
        // Deep jungle wall
        ctx.fillStyle = "#10291a";
        ctx.fillRect(px, py, tileSize, tileSize);

        // Dark inner rock/tree texture
        ctx.fillStyle = "#173d23";
        ctx.fillRect(
            px + 3,
            py + 3,
            tileSize - 6,
            tileSize - 6
        );

        // Deterministic vine/leaf details
        if ((x * 7 + y * 13) % 5 === 0) {
            ctx.strokeStyle = "rgba(66, 120, 65, 0.45)";
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(px + 5, py + 2);
            ctx.quadraticCurveTo(
                px + tileSize / 2,
                py + tileSize / 2,
                px + tileSize - 5,
                py + tileSize - 2
            );
            ctx.stroke();
        }

        if ((x * 11 + y * 3) % 7 === 0) {
            ctx.fillStyle = "rgba(78, 135, 67, 0.5)";

            ctx.beginPath();
            ctx.ellipse(
                px + tileSize * 0.28,
                py + tileSize * 0.35,
                4,
                2,
                -0.5,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(
                px + tileSize * 0.7,
                py + tileSize * 0.65,
                4,
                2,
                0.5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Border
        ctx.strokeStyle = "#24542d";
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, tileSize, tileSize);
    }

    drawJungleFloor(ctx, px, py, tileSize, x, y) {
        ctx.fillStyle = "#0b2115";
        ctx.fillRect(px, py, tileSize, tileSize);

        // Subtle grass texture
        if ((x * 17 + y * 9) % 6 === 0) {
            ctx.strokeStyle = "rgba(48, 100, 53, 0.25)";
            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(
                px + tileSize * 0.25,
                py + tileSize * 0.75
            );

            ctx.lineTo(
                px + tileSize * 0.3,
                py + tileSize * 0.58
            );

            ctx.moveTo(
                px + tileSize * 0.7,
                py + tileSize * 0.75
            );

            ctx.lineTo(
                px + tileSize * 0.74,
                py + tileSize * 0.6
            );

            ctx.stroke();
        }

        ctx.strokeStyle = "rgba(67, 110, 67, 0.12)";
        ctx.strokeRect(px, py, tileSize, tileSize);
    }

    // ================================================================
    // PALACE THEME
    // ================================================================

    drawPalaceWall(ctx, px, py, tileSize, x, y) {
        ctx.fillStyle = "#2a180b";
        ctx.fillRect(px, py, tileSize, tileSize);

        ctx.fillStyle = "#4a2d12";
        ctx.fillRect(px + 3, py + 3, tileSize - 6, tileSize - 6);

        ctx.strokeStyle = "#8b6332";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

        if ((x * 7 + y * 13) % 5 === 0) {
            ctx.fillStyle = "rgba(224, 184, 102, 0.30)";
            ctx.fillRect(px + 6, py + 6, 3, 3);
            ctx.fillRect(px + tileSize - 10, py + tileSize - 10, 2, 2);
        }
    }

    drawPalaceFloor(ctx, px, py, tileSize, x, y) {
        ctx.fillStyle = "#1b1008";
        ctx.fillRect(px, py, tileSize, tileSize);

        ctx.strokeStyle = "rgba(180, 135, 70, 0.16)";
        ctx.strokeRect(px, py, tileSize, tileSize);

        if ((x + y) % 6 === 0) {
            ctx.strokeStyle = "rgba(216, 175, 99, 0.18)";
            ctx.beginPath();
            ctx.moveTo(px + tileSize * 0.22, py + tileSize * 0.25);
            ctx.lineTo(px + tileSize * 0.78, py + tileSize * 0.75);
            ctx.stroke();
        }
    }

    // ================================================================
    // SNOW / FROZEN WILDERNESS THEME
    // ================================================================

    drawSnowWall(ctx, px, py, tileSize, x, y) {
        // Dark blue ice/rock wall
        ctx.fillStyle = "#152a3a";
        ctx.fillRect(px, py, tileSize, tileSize);

        // Icy inner surface
        ctx.fillStyle = "#203d50";
        ctx.fillRect(
            px + 3,
            py + 3,
            tileSize - 6,
            tileSize - 6
        );

        // Random-looking but deterministic frost streaks
        if ((x * 7 + y * 11) % 4 === 0) {
            ctx.strokeStyle = "rgba(180, 220, 238, 0.28)";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(
                px + tileSize * 0.2,
                py + tileSize * 0.15
            );
            ctx.lineTo(
                px + tileSize * 0.42,
                py + tileSize * 0.65
            );
            ctx.lineTo(
                px + tileSize * 0.75,
                py + tileSize * 0.3
            );
            ctx.stroke();
        }

        // Small snow cap on some wall tiles
        if ((x * 13 + y * 5) % 6 === 0) {
            ctx.fillStyle = "rgba(225, 242, 249, 0.75)";

            ctx.beginPath();
            ctx.moveTo(px + 2, py + 4);
            ctx.lineTo(px + tileSize * 0.42, py + 2);
            ctx.lineTo(px + tileSize - 3, py + 5);
            ctx.lineTo(px + tileSize - 3, py + 8);
            ctx.lineTo(px + 2, py + 7);
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = "#315269";
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, tileSize, tileSize);
    }

    drawSnowFloor(ctx, px, py, tileSize, x, y) {
        // Cold blue-gray snow floor
        ctx.fillStyle = "#102331";
        ctx.fillRect(px, py, tileSize, tileSize);

        // Soft icy patches
        if ((x * 17 + y * 9) % 5 === 0) {
            ctx.fillStyle = "rgba(176, 214, 230, 0.08)";

            ctx.beginPath();
            ctx.arc(
                px + tileSize * 0.32,
                py + tileSize * 0.38,
                tileSize * 0.18,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Tiny snow crystals
        if ((x * 19 + y * 7) % 7 === 0) {
            ctx.strokeStyle = "rgba(218, 239, 247, 0.30)";
            ctx.lineWidth = 1;

            const cx = px + tileSize * 0.68;
            const cy = py + tileSize * 0.32;
            const r = tileSize * 0.10;

            ctx.beginPath();
            ctx.moveTo(cx - r, cy);
            ctx.lineTo(cx + r, cy);
            ctx.moveTo(cx, cy - r);
            ctx.lineTo(cx, cy + r);
            ctx.moveTo(cx - r * 0.7, cy - r * 0.7);
            ctx.lineTo(cx + r * 0.7, cy + r * 0.7);
            ctx.moveTo(cx + r * 0.7, cy - r * 0.7);
            ctx.lineTo(cx - r * 0.7, cy + r * 0.7);
            ctx.stroke();
        }

        ctx.strokeStyle = "rgba(119, 163, 184, 0.18)";
        ctx.strokeRect(px, py, tileSize, tileSize);
    }

    // ================================================================
    // START ICON
    // ================================================================

    drawStartIcon(ctx, px, py, tileSize) {
        ctx.font =
            `${tileSize * 0.65}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "#dce8f5";

        ctx.fillText(
            "▶",
            px + tileSize / 2,
            py + tileSize / 2
        );
    }

    // ================================================================
    // GHOST
    // ================================================================

    drawGhostEmoji(ctx, x, y, tileSize, isJungle, isSnow, isDigital, isPalace) {
        const centerX =
            x * tileSize + tileSize / 2;

        const centerY =
            y * tileSize + tileSize / 2;

        const gradient =
            ctx.createRadialGradient(
                centerX,
                centerY,
                2,
                centerX,
                centerY,
                tileSize * 0.8
            );

        if (isSnow) {
            gradient.addColorStop(
                0,
                "rgba(190,235,255,0.24)"
            );
        } else {
            gradient.addColorStop(
                0,
                isJungle
                    ? "rgba(100,255,150,0.16)"
                    : "rgba(255,255,255,0.18)"
            );
        }

        gradient.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            tileSize * 0.8,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.font =
            `${tileSize * 0.72}px "Segoe UI Emoji", "Apple Color Emoji", Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "👻",
            centerX,
            centerY + 1
        );
    }

    // ================================================================
    // EXIT DOOR
    // ================================================================

    drawDoorIcon(ctx, px, py, tileSize, isJungle, isSnow, isDigital, isPalace) {
        const centerX =
            px + tileSize / 2;

        const centerY =
            py + tileSize / 2;

        const gradient =
            ctx.createRadialGradient(
                centerX,
                centerY,
                2,
                centerX,
                centerY,
                tileSize * 0.85
            );

        if (isSnow) {
            gradient.addColorStop(
                0,
                "rgba(145,225,255,0.32)"
            );
        } else if (isDigital) {
            gradient.addColorStop(
                0,
                "rgba(60,255,175,0.32)"
            );
        } else if (isPalace) {
            gradient.addColorStop(
                0,
                "rgba(230,190,100,0.30)"
            );
        } else {
            gradient.addColorStop(
                0,
                isJungle
                    ? "rgba(80,220,120,0.32)"
                    : "rgba(53,217,154,0.28)"
            );
        }

        gradient.addColorStop(
            1,
            "rgba(53,217,154,0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            tileSize * 0.85,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.font =
            `${tileSize * 0.72}px "Segoe UI Emoji", "Apple Color Emoji", Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "🚪",
            centerX,
            centerY + 1
        );
    }

    // ================================================================
    // PLAYER
    // ================================================================

    drawPlayer(ctx, x, y, tileSize, isJungle, isSnow, isDigital, isPalace) {
        const centerX =
            x * tileSize + tileSize / 2;

        const centerY =
            y * tileSize + tileSize / 2;

        const gradient =
            ctx.createRadialGradient(
                centerX,
                centerY,
                2,
                centerX,
                centerY,
                tileSize * 0.65
            );

        if (isSnow) {
            gradient.addColorStop(
                0,
                "rgba(190,235,255,0.42)"
            );
        } else if (isDigital) {
            gradient.addColorStop(
                0,
                "rgba(80,255,185,0.40)"
            );
        } else if (isPalace) {
            gradient.addColorStop(
                0,
                "rgba(235,195,110,0.36)"
            );
        } else {
            gradient.addColorStop(
                0,
                isJungle
                    ? "rgba(180,255,190,0.38)"
                    : "rgba(255,255,255,0.35)"
            );
        }

        gradient.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            tileSize * 0.65,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#dce8f5";

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            tileSize * 0.27,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;

        ctx.stroke();
    }
}

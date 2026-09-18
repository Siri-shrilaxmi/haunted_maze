class Renderer {

    constructor(canvas, maze) {

        this.canvas = canvas;
        this.maze = maze;
        this.ctx = canvas.getContext("2d");
        this.tileSize = maze.tileSize;

        this.resizeCanvas();
    }


    resizeCanvas() {

        this.canvas.width =
            this.maze.getWidth();

        this.canvas.height =
            this.maze.getHeight();
    }


    draw(player, hazards = []) {

        const ctx = this.ctx;
        const tileSize = this.tileSize;

        ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );


        const isDigital =
            this.maze.theme === "Digital World";

        const isJungle =
            this.maze.theme === "Forgotten Jungle";

        const isSnow =
            this.maze.theme === "Frozen Wilderness";

        const isPalace =
            this.maze.theme === "Magical Desert";

        const isHaunted =
            this.maze.theme === "Haunted Cave";


        // ============================================================
        // BACKGROUND
        // ============================================================

        if (isDigital) {

            ctx.fillStyle = "#020609";

        } else if (isSnow) {

            ctx.fillStyle = "#07131d";

        } else if (isJungle) {

            ctx.fillStyle = "#071008";

        } else if (isPalace) {

            ctx.fillStyle = "#160b0b";

        } else if (isHaunted) {

            ctx.fillStyle = "#080408";

        } else {

            ctx.fillStyle = "#071018";
        }


        ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );


        // ============================================================
        // MAZE
        // ============================================================

        for (
            let y = 0;
            y < this.maze.rows;
            y++
        ) {

            for (
                let x = 0;
                x < this.maze.cols;
                x++
            ) {

                const tile =
                    this.maze.map[y][x];

                const px =
                    x * tileSize;

                const py =
                    y * tileSize;


                // ----------------------------------------------------
                // WALL
                // ----------------------------------------------------

                if (tile === "#") {

                    if (isDigital) {

                        this.drawDigitalWall(
                            ctx,
                            px,
                            py,
                            tileSize,
                            x,
                            y
                        );

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

                    } else if (isHaunted) {

                        this.drawHauntedWall(
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


                }

                // ----------------------------------------------------
                // FLOOR
                // ----------------------------------------------------

                else {

                    if (isDigital) {

                        this.drawDigitalFloor(
                            ctx,
                            px,
                            py,
                            tileSize,
                            x,
                            y
                        );

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

                    } else if (isHaunted) {

                        this.drawHauntedFloor(
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


                // ====================================================
                // START
                // ====================================================

                if (tile === "S") {

                    this.drawStartIcon(
                        ctx,
                        px,
                        py,
                        tileSize
                    );
                }


                // ====================================================
                // EXIT
                // ====================================================

                if (tile === "E") {

                    this.drawDoorIcon(
                        ctx,
                        px,
                        py,
                        tileSize,
                        isJungle,
                        isSnow,
                        isDigital,
                        isPalace,
                        isHaunted
                    );
                }
            }
        }


        // ============================================================
        // HAZARDS
        // ============================================================

        for (const hazard of hazards) {

            if (
                !hazard ||
                !hazard.active
            ) {
                continue;
            }

            this.drawGhostEmoji(
                ctx,
                hazard.x,
                hazard.y,
                tileSize,
                isJungle,
                isSnow,
                isDigital,
                isPalace,
                isHaunted
            );
        }


        // ============================================================
        // PLAYER
        // ============================================================

        if (player) {

            this.drawPlayer(
                ctx,
                player.x,
                player.y,
                tileSize,
                isJungle,
                isSnow,
                isDigital,
                isPalace,
                isHaunted
            );
        }
    }


    // =================================================================
    // UNDERGROUND
    // =================================================================

    drawUndergroundWall(
        ctx,
        px,
        py,
        tileSize
    ) {

        ctx.fillStyle = "#111c26";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );

        ctx.fillStyle = "#182936";

        ctx.fillRect(
            px + 2,
            py + 2,
            tileSize - 4,
            tileSize - 4
        );

        ctx.strokeStyle = "#2a4558";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );
    }


    drawUndergroundFloor(
        ctx,
        px,
        py,
        tileSize
    ) {

        ctx.fillStyle = "#08121b";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );

        ctx.strokeStyle =
            "rgba(50,80,100,0.12)";

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );
    }


    // =================================================================
    // DIGITAL WORLD
    // =================================================================

    drawDigitalWall(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        ctx.fillStyle = "#050b10";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );

        ctx.fillStyle = "#0a1820";

        ctx.fillRect(
            px + 2,
            py + 2,
            tileSize - 4,
            tileSize - 4
        );

        ctx.strokeStyle =
            "rgba(0,220,255,0.45)";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            px + 1,
            py + 1,
            tileSize - 2,
            tileSize - 2
        );

        ctx.strokeStyle =
            "rgba(0,255,220,0.42)";

        const pattern =
            (x * 17 + y * 31) % 5;

        ctx.beginPath();

        if (pattern === 0) {

            ctx.moveTo(
                px + 4,
                py + tileSize * 0.28
            );

            ctx.lineTo(
                px + tileSize * 0.42,
                py + tileSize * 0.28
            );

            ctx.lineTo(
                px + tileSize * 0.42,
                py + tileSize * 0.65
            );

            ctx.lineTo(
                px + tileSize - 5,
                py + tileSize * 0.65
            );

        } else if (pattern === 1) {

            ctx.moveTo(
                px + tileSize * 0.25,
                py + 4
            );

            ctx.lineTo(
                px + tileSize * 0.25,
                py + tileSize * 0.48
            );

            ctx.lineTo(
                px + tileSize * 0.72,
                py + tileSize * 0.48
            );

            ctx.lineTo(
                px + tileSize * 0.72,
                py + tileSize - 4
            );

        } else if (pattern === 2) {

            ctx.moveTo(
                px + 4,
                py + tileSize * 0.72
            );

            ctx.lineTo(
                px + tileSize * 0.38,
                py + tileSize * 0.72
            );

            ctx.lineTo(
                px + tileSize * 0.38,
                py + tileSize * 0.30
            );

            ctx.lineTo(
                px + tileSize - 4,
                py + tileSize * 0.30
            );

        } else {

            ctx.moveTo(
                px + 5,
                py + tileSize * 0.5
            );

            ctx.lineTo(
                px + tileSize - 5,
                py + tileSize * 0.5
            );
        }

        ctx.stroke();


        if ((x * 11 + y * 7) % 3 === 0) {

            ctx.fillStyle = "#00e6c3";

            ctx.beginPath();

            ctx.arc(
                px + tileSize * 0.25,
                py + tileSize * 0.5,
                1.5,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        if ((x * 13 + y * 5) % 4 === 0) {

            ctx.fillStyle = "#00bfff";

            ctx.fillRect(
                px + tileSize * 0.68,
                py + tileSize * 0.2,
                3,
                2
            );
        }
    }


    drawDigitalFloor(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        ctx.fillStyle = "#02090d";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );

        ctx.strokeStyle =
            "rgba(0,210,255,0.13)";

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );

        if ((x * 17 + y * 13) % 5 === 0) {

            ctx.fillStyle =
                "rgba(0,255,210,0.38)";

            ctx.fillRect(
                px + tileSize * 0.22,
                py + tileSize * 0.28,
                2,
                2
            );

            ctx.fillRect(
                px + tileSize * 0.68,
                py + tileSize * 0.65,
                2,
                2
            );
        }
    }


    // =================================================================
    // FORGOTTEN JUNGLE
    // =================================================================

    drawJungleWall(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        ctx.fillStyle = "#122718";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );

        ctx.fillStyle = "#1d3a20";

        ctx.fillRect(
            px + 2,
            py + 2,
            tileSize - 4,
            tileSize - 4
        );


        // Moss

        if ((x * 7 + y * 13) % 3 === 0) {

            ctx.fillStyle =
                "rgba(83,145,58,0.55)";

            ctx.beginPath();

            ctx.arc(
                px + tileSize * 0.18,
                py + tileSize * 0.25,
                3,
                0,
                Math.PI * 2
            );

            ctx.arc(
                px + tileSize * 0.30,
                py + tileSize * 0.18,
                2.5,
                0,
                Math.PI * 2
            );

            ctx.arc(
                px + tileSize * 0.40,
                py + tileSize * 0.25,
                2,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        // Hanging vines

        if ((x * 11 + y * 3) % 4 === 0) {

            ctx.strokeStyle = "#39723a";

            ctx.lineWidth = 1.5;

            ctx.beginPath();

            ctx.moveTo(
                px + tileSize * 0.78,
                py
            );

            ctx.quadraticCurveTo(
                px + tileSize * 0.60,
                py + tileSize * 0.40,
                px + tileSize * 0.82,
                py + tileSize * 0.92
            );

            ctx.stroke();


            ctx.fillStyle = "#4f963f";

            ctx.beginPath();

            ctx.ellipse(
                px + tileSize * 0.68,
                py + tileSize * 0.34,
                4,
                2,
                -0.6,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.beginPath();

            ctx.ellipse(
                px + tileSize * 0.79,
                py + tileSize * 0.62,
                4,
                2,
                0.5,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        ctx.strokeStyle = "#2c5930";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );
    }


    drawJungleFloor(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        ctx.fillStyle = "#0b1b0e";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );


        if ((x * 13 + y * 7) % 3 === 0) {

            ctx.strokeStyle =
                "rgba(70,139,58,0.55)";

            ctx.lineWidth = 1;

            for (let i = 0; i < 3; i++) {

                const gx =
                    px + tileSize *
                    (0.22 + i * 0.23);

                ctx.beginPath();

                ctx.moveTo(
                    gx,
                    py + tileSize * 0.82
                );

                ctx.lineTo(
                    gx - 2,
                    py + tileSize *
                    (0.58 - i * 0.03)
                );

                ctx.stroke();

                ctx.beginPath();

                ctx.moveTo(
                    gx + 1,
                    py + tileSize * 0.82
                );

                ctx.lineTo(
                    gx + 4,
                    py + tileSize *
                    (0.63 - i * 0.02)
                );

                ctx.stroke();
            }
        }


        if ((x * 19 + y * 5) % 7 === 0) {

            ctx.fillStyle =
                "rgba(96,154,63,0.55)";

            ctx.beginPath();

            ctx.ellipse(
                px + tileSize * 0.70,
                py + tileSize * 0.30,
                4,
                2,
                -0.4,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        ctx.strokeStyle =
            "rgba(53,101,48,0.20)";

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );
    }


    // =================================================================
    // ROYAL PALACE
    // =================================================================

    drawPalaceWall(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        ctx.fillStyle = "#321415";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );


        const wallGradient =
            ctx.createLinearGradient(
                px,
                py,
                px + tileSize,
                py + tileSize
            );

        wallGradient.addColorStop(
            0,
            "#5b3a25"
        );

        wallGradient.addColorStop(
            0.5,
            "#7a5430"
        );

        wallGradient.addColorStop(
            1,
            "#3d2419"
        );

        ctx.fillStyle = wallGradient;

        ctx.fillRect(
            px + 3,
            py + 3,
            tileSize - 6,
            tileSize - 6
        );


        // Gold architectural trim

        ctx.strokeStyle =
            "rgba(224,180,82,0.78)";

        ctx.lineWidth = 1.2;

        ctx.strokeRect(
            px + 1.5,
            py + 1.5,
            tileSize - 3,
            tileSize - 3
        );


        // Inner trim

        ctx.strokeStyle =
            "rgba(121,75,25,0.85)";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            px + 5,
            py + 5,
            tileSize - 10,
            tileSize - 10
        );


        const pattern =
            (x * 7 + y * 13) % 6;


        // Royal diamond

        if (
            pattern === 0 ||
            pattern === 3
        ) {

            const cx =
                px + tileSize / 2;

            const cy =
                py + tileSize / 2;

            ctx.fillStyle =
                "rgba(235,195,102,0.55)";

            ctx.beginPath();

            ctx.moveTo(
                cx,
                cy - 4
            );

            ctx.lineTo(
                cx + 4,
                cy
            );

            ctx.lineTo(
                cx,
                cy + 4
            );

            ctx.lineTo(
                cx - 4,
                cy
            );

            ctx.closePath();

            ctx.fill();
        }


        // Gold studs

        ctx.fillStyle =
            "rgba(245,205,110,0.62)";

        ctx.beginPath();

        ctx.arc(
            px + 6,
            py + 6,
            1.3,
            0,
            Math.PI * 2
        );

        ctx.arc(
            px + tileSize - 6,
            py + tileSize - 6,
            1.3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    drawPalaceFloor(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        const floorGradient =
            ctx.createLinearGradient(
                px,
                py,
                px + tileSize,
                py + tileSize
            );

        floorGradient.addColorStop(
            0,
            "#514034"
        );

        floorGradient.addColorStop(
            0.5,
            "#806d55"
        );

        floorGradient.addColorStop(
            1,
            "#403128"
        );

        ctx.fillStyle = floorGradient;

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );


        ctx.strokeStyle =
            "rgba(221,190,130,0.30)";

        ctx.strokeRect(
            px + 1,
            py + 1,
            tileSize - 2,
            tileSize - 2
        );


        // Gold diamond floor inlay

        if ((x + y) % 4 === 0) {

            const cx =
                px + tileSize / 2;

            const cy =
                py + tileSize / 2;

            ctx.strokeStyle =
                "rgba(224,180,78,0.48)";

            ctx.beginPath();

            ctx.moveTo(
                cx,
                py + 5
            );

            ctx.lineTo(
                px + tileSize - 5,
                cy
            );

            ctx.lineTo(
                cx,
                py + tileSize - 5
            );

            ctx.lineTo(
                px + 5,
                cy
            );

            ctx.closePath();

            ctx.stroke();
        }
    }


    // =================================================================
    // HAUNTED CAVE
    // =================================================================

    drawHauntedWall(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        // ------------------------------------------------------------
        // Dark cave rock
        // ------------------------------------------------------------

        ctx.fillStyle = "#100a12";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );


        // Irregular inner rock

        ctx.fillStyle = "#211421";

        ctx.fillRect(
            px + 2,
            py + 2,
            tileSize - 4,
            tileSize - 4
        );


        // ------------------------------------------------------------
        // Purple stone shading
        // ------------------------------------------------------------

        if ((x * 13 + y * 17) % 4 === 0) {

            ctx.fillStyle =
                "rgba(91,45,105,0.45)";

            ctx.beginPath();

            ctx.arc(
                px + tileSize * 0.25,
                py + tileSize * 0.28,
                tileSize * 0.22,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        // ------------------------------------------------------------
        // Cave cracks
        // ------------------------------------------------------------

        if ((x * 7 + y * 19) % 3 === 0) {

            ctx.strokeStyle =
                "rgba(112,76,120,0.55)";

            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(
                px + tileSize * 0.20,
                py + tileSize * 0.10
            );

            ctx.lineTo(
                px + tileSize * 0.42,
                py + tileSize * 0.42
            );

            ctx.lineTo(
                px + tileSize * 0.30,
                py + tileSize * 0.78
            );

            ctx.stroke();
        }


        // ------------------------------------------------------------
        // Pale mineral streak
        // ------------------------------------------------------------

        if ((x * 11 + y * 5) % 6 === 0) {

            ctx.strokeStyle =
                "rgba(173,130,180,0.30)";

            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(
                px + tileSize * 0.72,
                py + tileSize * 0.15
            );

            ctx.lineTo(
                px + tileSize * 0.58,
                py + tileSize * 0.48
            );

            ctx.lineTo(
                px + tileSize * 0.75,
                py + tileSize * 0.82
            );

            ctx.stroke();
        }


        // ------------------------------------------------------------
        // Small glowing cave crystal
        // ------------------------------------------------------------

        if ((x * 23 + y * 11) % 8 === 0) {

            ctx.fillStyle =
                "rgba(180,90,220,0.55)";

            ctx.beginPath();

            ctx.moveTo(
                px + tileSize * 0.78,
                py + tileSize * 0.72
            );

            ctx.lineTo(
                px + tileSize * 0.84,
                py + tileSize * 0.50
            );

            ctx.lineTo(
                px + tileSize * 0.90,
                py + tileSize * 0.72
            );

            ctx.closePath();

            ctx.fill();
        }


        // ------------------------------------------------------------
        // Rock border
        // ------------------------------------------------------------

        ctx.strokeStyle =
            "rgba(90,65,100,0.75)";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );
    }


    drawHauntedFloor(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        // ------------------------------------------------------------
        // Wet cave floor
        // ------------------------------------------------------------

        ctx.fillStyle = "#0b070d";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );


        // ------------------------------------------------------------
        // Uneven stone patches
        // ------------------------------------------------------------

        if ((x * 17 + y * 7) % 4 === 0) {

            ctx.fillStyle =
                "rgba(72,52,76,0.35)";

            ctx.beginPath();

            ctx.ellipse(
                px + tileSize * 0.35,
                py + tileSize * 0.62,
                tileSize * 0.25,
                tileSize * 0.12,
                -0.25,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        // ------------------------------------------------------------
        // Wet reflection
        // ------------------------------------------------------------

        if ((x * 11 + y * 13) % 5 === 0) {

            ctx.strokeStyle =
                "rgba(130,105,145,0.20)";

            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(
                px + tileSize * 0.18,
                py + tileSize * 0.30
            );

            ctx.quadraticCurveTo(
                px + tileSize * 0.48,
                py + tileSize * 0.18,
                px + tileSize * 0.78,
                py + tileSize * 0.34
            );

            ctx.stroke();
        }


        // ------------------------------------------------------------
        // Tiny cave stones
        // ------------------------------------------------------------

        if ((x * 5 + y * 19) % 7 === 0) {

            ctx.fillStyle =
                "rgba(105,82,110,0.45)";

            ctx.beginPath();

            ctx.arc(
                px + tileSize * 0.72,
                py + tileSize * 0.70,
                2,
                0,
                Math.PI * 2
            );

            ctx.arc(
                px + tileSize * 0.80,
                py + tileSize * 0.76,
                1.5,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        // ------------------------------------------------------------
        // Faint purple cave glow
        // ------------------------------------------------------------

        if ((x * 29 + y * 7) % 11 === 0) {

            const gradient =
                ctx.createRadialGradient(
                    px + tileSize * 0.5,
                    py + tileSize * 0.5,
                    1,
                    px + tileSize * 0.5,
                    py + tileSize * 0.5,
                    tileSize * 0.6
                );

            gradient.addColorStop(
                0,
                "rgba(135,65,170,0.14)"
            );

            gradient.addColorStop(
                1,
                "rgba(135,65,170,0)"
            );

            ctx.fillStyle = gradient;

            ctx.fillRect(
                px,
                py,
                tileSize,
                tileSize
            );
        }


        ctx.strokeStyle =
            "rgba(70,48,78,0.25)";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );
    }


    // =================================================================
    // SNOW
    // =================================================================

    drawSnowWall(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        ctx.fillStyle = "#152a3a";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );

        ctx.fillStyle = "#203d50";

        ctx.fillRect(
            px + 3,
            py + 3,
            tileSize - 6,
            tileSize - 6
        );


        if ((x * 7 + y * 11) % 4 === 0) {

            ctx.strokeStyle =
                "rgba(180,220,238,0.28)";

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


        if ((x * 13 + y * 5) % 6 === 0) {

            ctx.fillStyle =
                "rgba(225,242,249,0.75)";

            ctx.beginPath();

            ctx.moveTo(
                px + 2,
                py + 4
            );

            ctx.lineTo(
                px + tileSize * 0.42,
                py + 2
            );

            ctx.lineTo(
                px + tileSize - 3,
                py + 5
            );

            ctx.lineTo(
                px + tileSize - 3,
                py + 8
            );

            ctx.lineTo(
                px + 2,
                py + 7
            );

            ctx.closePath();

            ctx.fill();
        }


        ctx.strokeStyle = "#315269";

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );
    }


    drawSnowFloor(
        ctx,
        px,
        py,
        tileSize,
        x,
        y
    ) {

        ctx.fillStyle = "#102331";

        ctx.fillRect(
            px,
            py,
            tileSize,
            tileSize
        );


        if ((x * 17 + y * 9) % 5 === 0) {

            ctx.fillStyle =
                "rgba(176,214,230,0.08)";

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


        if ((x * 19 + y * 7) % 7 === 0) {

            ctx.strokeStyle =
                "rgba(218,239,247,0.30)";

            const cx =
                px + tileSize * 0.68;

            const cy =
                py + tileSize * 0.32;

            const r =
                tileSize * 0.10;

            ctx.beginPath();

            ctx.moveTo(
                cx - r,
                cy
            );

            ctx.lineTo(
                cx + r,
                cy
            );

            ctx.moveTo(
                cx,
                cy - r
            );

            ctx.lineTo(
                cx,
                cy + r
            );

            ctx.moveTo(
                cx - r * 0.7,
                cy - r * 0.7
            );

            ctx.lineTo(
                cx + r * 0.7,
                cy + r * 0.7
            );

            ctx.moveTo(
                cx + r * 0.7,
                cy - r * 0.7
            );

            ctx.lineTo(
                cx - r * 0.7,
                cy + r * 0.7
            );

            ctx.stroke();
        }


        ctx.strokeStyle =
            "rgba(119,163,184,0.18)";

        ctx.strokeRect(
            px,
            py,
            tileSize,
            tileSize
        );
    }


    // =================================================================
    // START
    // =================================================================

    drawStartIcon(
        ctx,
        px,
        py,
        tileSize
    ) {

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


    // =================================================================
    // GHOST
    // =================================================================

    drawGhostEmoji(
        ctx,
        x,
        y,
        tileSize,
        isJungle,
        isSnow,
        isDigital,
        isPalace,
        isHaunted
    ) {

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


        if (isHaunted) {

            gradient.addColorStop(
                0,
                "rgba(190,80,230,0.30)"
            );

        } else if (isSnow) {

            gradient.addColorStop(
                0,
                "rgba(190,235,255,0.24)"
            );

        } else if (isDigital) {

            gradient.addColorStop(
                0,
                "rgba(0,255,220,0.22)"
            );

        } else if (isPalace) {

            gradient.addColorStop(
                0,
                "rgba(255,205,110,0.20)"
            );

        } else {

            gradient.addColorStop(
                0,
                isJungle
                    ? "rgba(100,255,150,0.18)"
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


    // =================================================================
    // EXIT
    // =================================================================

    drawDoorIcon(
        ctx,
        px,
        py,
        tileSize,
        isJungle,
        isSnow,
        isDigital,
        isPalace,
        isHaunted
    ) {

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


        if (isHaunted) {

            gradient.addColorStop(
                0,
                "rgba(185,75,230,0.42)"
            );

        } else if (isSnow) {

            gradient.addColorStop(
                0,
                "rgba(145,225,255,0.32)"
            );

        } else if (isDigital) {

            gradient.addColorStop(
                0,
                "rgba(0,255,210,0.36)"
            );

        } else if (isPalace) {

            gradient.addColorStop(
                0,
                "rgba(255,205,100,0.40)"
            );

        } else {

            gradient.addColorStop(
                0,
                isJungle
                    ? "rgba(90,220,100,0.36)"
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


    // =================================================================
    // PLAYER
    // =================================================================

    drawPlayer(
        ctx,
        x,
        y,
        tileSize,
        isJungle,
        isSnow,
        isDigital,
        isPalace,
        isHaunted
    ) {

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


        if (isHaunted) {

            gradient.addColorStop(
                0,
                "rgba(200,90,240,0.42)"
            );

        } else if (isSnow) {

            gradient.addColorStop(
                0,
                "rgba(190,235,255,0.42)"
            );

        } else if (isDigital) {

            gradient.addColorStop(
                0,
                "rgba(0,255,210,0.42)"
            );

        } else if (isPalace) {

            gradient.addColorStop(
                0,
                "rgba(255,205,105,0.40)"
            );

        } else {

            gradient.addColorStop(
                0,
                isJungle
                    ? "rgba(145,255,130,0.40)"
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
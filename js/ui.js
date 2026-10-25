class UI {

    constructor() {

        // =========================================================
        // HUD
        // =========================================================

        this.levelNumber =
            document.getElementById("levelNumber");

        this.levelName =
            document.getElementById("levelName");

        this.timer =
            document.getElementById("timer");

        this.score =
            document.getElementById("score");


        // =========================================================
        // WARNING
        // =========================================================

        this.warningOverlay =
            document.getElementById("warningOverlay");

        this.warningText =
            document.getElementById("warningText");


        // =========================================================
        // GAME OVER / LEVEL COMPLETE
        // =========================================================

        this.gameOverlay =
            document.getElementById("gameOverlay");

        this.overlayTitle =
            document.getElementById("overlayTitle");

        this.overlayMessage =
            document.getElementById("overlayMessage");

        this.restartButton =
            document.getElementById("restartButton");

        this.gameOverExitButton =
            document.getElementById("gameOverExitButton");

        this.finalScoreLine =
            document.getElementById("finalScoreLine");


        // =========================================================
        // PAUSE
        // =========================================================

        this.pauseOverlay =
            document.getElementById("pauseOverlay");

        this.continueButton =
            document.getElementById("continueButton");

        this.exitButton =
            document.getElementById("exitButton");


        // =========================================================
        // EXIT
        // =========================================================

        this.exitOverlay =
            document.getElementById("exitOverlay");

        this.exitRestartButton =
            document.getElementById("exitRestartButton");


        // =========================================================
        // CALLBACKS
        // =========================================================

        this.restartAction = null;

        this.continueAction = null;

        this.exitAction = null;

        this.gameOverExitAction = null;


        // =========================================================
        // WARNING TIMER
        // =========================================================

        this.warningTimeout = null;


        // =========================================================
        // BUTTON EVENTS
        // =========================================================

        if (this.restartButton) {

            this.restartButton.addEventListener(
                "click",
                () => {

                    if (this.restartAction) {

                        this.restartAction();

                    }

                }
            );

        }


        if (this.gameOverExitButton) {

            this.gameOverExitButton.addEventListener(
                "click",
                () => {
                    if (this.gameOverExitAction) {
                        this.gameOverExitAction();
                    }
                }
            );

        }


        if (this.continueButton) {

            this.continueButton.addEventListener(
                "click",
                () => {

                    if (this.continueAction) {

                        this.continueAction();

                    }

                }
            );

        }


        if (this.exitButton) {

            this.exitButton.addEventListener(
                "click",
                () => {

                    if (this.exitAction) {

                        this.exitAction();

                    }

                }
            );

        }


        if (this.exitRestartButton) {

            this.exitRestartButton.addEventListener(
                "click",
                () => {

                    if (this.restartAction) {

                        this.restartAction();

                    }

                }
            );

        }


        // =========================================================
        // INITIAL STATE
        // =========================================================

        this.hideWarning();

        this.hideOverlay();

        this.hidePause();

        this.hideExit();

    }


    // =============================================================
    // LEVEL
    // =============================================================

    updateLevel(text) {

        if (!text) return;


        const parts =
            text.split("—");


        if (
            parts.length >= 2
        ) {

            if (this.levelNumber) {

                this.levelNumber.textContent =
                    parts[0].trim().toUpperCase();

            }


            if (this.levelName) {

                this.levelName.textContent =
                    parts
                        .slice(1)
                        .join("—")
                        .trim();

            }

        } else {

            if (this.levelName) {

                this.levelName.textContent =
                    text;

            }

        }

    }


    // =============================================================
    // TIMER
    // =============================================================

    updateTimer(seconds) {

        if (!this.timer) return;


        const safeSeconds =
            Math.max(
                0,
                seconds
            );


        const minutes =
            Math.floor(
                safeSeconds / 60
            );


        const secs =
            Math.floor(
                safeSeconds % 60
            );


        this.timer.textContent =
            `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    }



    updateScore(total, levelScore = total) {
        if (!this.score) return;

        const safeTotal = Math.max(0, Number(total) || 0);
        this.score.textContent = safeTotal.toLocaleString("en-US");
        this.score.setAttribute("aria-label", `Score ${safeTotal}`);
    }

    // =============================================================
    // WARNING
    // =============================================================

    setWarningText(text) {

        if (this.warningText) {

            this.warningText.textContent =
                text;

        }

    }


    showWarning() {

        if (!this.warningOverlay) return;

        this.warningOverlay.classList.remove(
            "hidden"
        );

    }


    hideWarning() {

        if (!this.warningOverlay) return;

        this.warningOverlay.classList.add(
            "hidden"
        );

    }


    flashWarning(duration = 1200) {

        if (!this.warningOverlay) return;


        clearTimeout(
            this.warningTimeout
        );


        this.showWarning();


        this.warningTimeout =
            setTimeout(
                () => {

                    this.hideWarning();

                },
                duration
            );

    }


    // =============================================================
    // GAME OVER / LEVEL COMPLETE
    // =============================================================

    showOverlay(
        title,
        message
    ) {

        if (this.overlayTitle) {

            this.overlayTitle.textContent =
                title;

        }


        if (this.overlayMessage) {

            this.overlayMessage.textContent =
                message;

        }


        if (this.gameOverlay) {

            this.gameOverlay.classList.remove(
                "hidden"
            );

        }

    }


    hideOverlay() {

        if (!this.gameOverlay) return;

        this.gameOverlay.classList.add(
            "hidden"
        );

    }


    showGameOver(
        message = "You were caught!",
        score = 0
    ) {

        this.showOverlay(
            "GAME OVER",
            message
        );

        if (this.finalScoreLine) {
            this.finalScoreLine.textContent = `FINAL SCORE  ${Math.max(0, Number(score) || 0).toLocaleString("en-US")}`;
            this.finalScoreLine.classList.remove("hidden");
        }

        if (this.restartButton) {
            this.restartButton.textContent =
                "RETRY FROM LEVEL 1";
        }

    }


    showLevelComplete(
        message = "Level Complete!"
    ) {

        this.showOverlay(
            "LEVEL COMPLETE",
            message
        );

        if (this.finalScoreLine) {
            this.finalScoreLine.classList.add("hidden");
        }

        if (this.restartButton) {
            this.restartButton.textContent =
                "NEXT LEVEL";
        }

        if (this.gameOverExitButton) {
            this.gameOverExitButton.classList.add("hidden");
        }

    }


    showGameComplete(score = 0) {

        this.showOverlay(
            "YOU ESCAPED!",
            "All 5 levels completed. You survived the maze."
        );

        if (this.finalScoreLine) {
            this.finalScoreLine.textContent = `FINAL SCORE  ${Math.max(0, Number(score) || 0).toLocaleString("en-US")}`;
            this.finalScoreLine.classList.remove("hidden");
        }

        if (this.restartButton) {
            this.restartButton.textContent =
                "RETRY FROM LEVEL 1";
        }

        if (this.gameOverExitButton) {
            this.gameOverExitButton.classList.remove("hidden");
        }

    }


    // =============================================================
    // PAUSE
    // =============================================================

    showPause(
        continueAction,
        exitAction
    ) {

        this.continueAction =
            continueAction;

        this.exitAction =
            exitAction;


        if (this.pauseOverlay) {

            this.pauseOverlay.classList.remove(
                "hidden"
            );

        }

    }


    hidePause() {

        if (!this.pauseOverlay) return;

        this.pauseOverlay.classList.add(
            "hidden"
        );

    }


    // =============================================================
    // EXIT
    // =============================================================

    showExit(score = 0) {

        if (this.finalScoreLine) {
            this.finalScoreLine.textContent = `FINAL SCORE: ${String(score).padStart(5, "0")}`;
        }

        if (!this.exitOverlay) return;

        this.exitOverlay.classList.remove(
            "hidden"
        );

    }


    hideExit() {

        if (!this.exitOverlay) return;

        this.exitOverlay.classList.add(
            "hidden"
        );

    }


    setGameOverExitAction(action) {
        this.gameOverExitAction = action;
    }


    // =============================================================
    // RESTART CALLBACK
    // =============================================================

    setRestartAction(action) {

        this.restartAction =
            action;

    }

}
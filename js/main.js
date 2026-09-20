const canvas =
    document.getElementById(
        "gameCanvas"
    );


const ui =
    new UI();


const game =
    new Game(
        canvas,
        ui
    );


window.keys = {};


/* 
 * ================================================================
 * KEY DOWN
 * ================================================================
 */

window.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            event.preventDefault();


            if (
                window.gameAudio &&
                window.gameAudio.init
            ) {

                window.gameAudio.init();

            }


            if (
                !game.paused &&
                game.running &&
                !game.gameOver
            ) {

                game.pause();

            }

            return;

        }


        if (
            window.gameAudio &&
            window.gameAudio.init
        ) {

            window.gameAudio.init();

        }


        window.keys[
            event.key
        ] = true;


        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                " "
            ].includes(
                event.key
            )
        ) {

            event.preventDefault();

        }

    }

);


/*
 * ================================================================
 * KEY UP
 * ================================================================
 */

window.addEventListener(
    "keyup",
    (event) => {

        window.keys[
            event.key
        ] = false;

    }
);



/*
 * ================================================================
 * ON-SCREEN MOVEMENT CONTROLS
 * ================================================================
 *
 * These buttons use the exact same key-state system as the physical
 * keyboard. This means WASD and Arrow Keys continue to work on
 * keyboards, while touch / mouse / stylus users can use the arrows.
 */

const movementButtons =
    document.querySelectorAll(
        ".movement-key"
    );


const movementKeyMap = {

    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight"

};


function releaseMovementKey(button) {

    const direction =
        button.dataset.direction;

    const key =
        movementKeyMap[direction];

    if (!key) return;

    window.keys[key] = false;

    button.classList.remove("pressed");

}


movementButtons.forEach(
    (button) => {

        const press = (event) => {

            event.preventDefault();

            event.stopPropagation();

            
            if (
                window.gameAudio &&
                window.gameAudio.init
            ) {

                window.gameAudio.init();

            }

            const direction =
                button.dataset.direction;

            const key =
                movementKeyMap[direction];

            if (!key) return;

            window.keys[key] = true;
            button.classList.add("pressed");

            if (
                event.pointerId !== undefined &&
                button.setPointerCapture
            ) {

                try {
                    button.setPointerCapture(
                        event.pointerId
                    );
                } catch (error) {
                    // Pointer capture is optional.
                }

            }

        };


        const release = (event) => {

            event.preventDefault();
            event.stopPropagation();

            releaseMovementKey(button);

        };


        button.addEventListener(
            "pointerdown",
            press,
            { passive: false }
        );

        button.addEventListener(
            "pointerup",
            release,
            { passive: false }
        );

        button.addEventListener(
            "pointercancel",
            release,
            { passive: false }
        );

        button.addEventListener(
            "lostpointercapture",
            () => releaseMovementKey(button)
        );

        button.addEventListener(
            "pointerleave",
            (event) => {

                // Release mouse/stylus movement if the pointer
                // leaves the button while it is being held.
                if (event.buttons === 0) {
                    releaseMovementKey(button);
                }

            }
        );

    }
);


// Never leave an on-screen movement key stuck after the browser
// loses focus or the user changes tabs.
window.addEventListener(
    "blur",
    () => {

        movementButtons.forEach(
            (button) => releaseMovementKey(button)
        );

        Object.values(
            movementKeyMap
        ).forEach(
            (key) => {
                window.keys[key] = false;
            }
        );

    }
);

/*
 * ================================================================
 * START
 * ================================================================
 */

game.start();
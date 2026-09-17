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

        /*
         * ESC = PAUSE
         *
         * ESC does NOT resume.
         */

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


        /*
         * Stop browser scrolling
         * with movement keys.
         */

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
 * START
 * ================================================================
 */

game.start();
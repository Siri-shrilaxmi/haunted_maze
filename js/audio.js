class GameAudio {

    constructor() {

        this.context = null;

        this.masterGain = null;

        this.chaseOscillator = null;

        this.chaseGain = null;

        this.enabled = true;

    }


    // =============================================================
    // INITIALIZE
    // =============================================================

    init() {

        if (this.context) {

            if (
                this.context.state ===
                "suspended"
            ) {

                this.context.resume();

            }

            return;

        }


        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {

            this.enabled = false;

            return;

        }


        this.context =
            new AudioContext();


        this.masterGain =
            this.context.createGain();


        this.masterGain.gain.value =
            0.22;


        this.masterGain.connect(
            this.context.destination
        );

    }


    // =============================================================
    // ENSURE AUDIO
    // =============================================================

    ensure() {

        if (!this.enabled) return false;

        this.init();

        return !!this.context;

    }


    // =============================================================
    // BASIC TONE
    // =============================================================

    tone(
        frequency,
        duration,
        type = "sine",
        volume = 0.25,
        endFrequency = null
    ) {

        if (!this.ensure()) return;


        const now =
            this.context.currentTime;


        const oscillator =
            this.context.createOscillator();


        const gain =
            this.context.createGain();


        oscillator.type =
            type;


        oscillator.frequency.setValueAtTime(
            frequency,
            now
        );


        if (
            endFrequency !== null
        ) {

            oscillator.frequency.linearRampToValueAtTime(
                endFrequency,
                now + duration
            );

        }


        gain.gain.setValueAtTime(
            0.0001,
            now
        );


        gain.gain.exponentialRampToValueAtTime(
            volume,
            now + 0.01
        );


        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + duration
        );


        oscillator.connect(
            gain
        );


        gain.connect(
            this.masterGain
        );


        oscillator.start(
            now
        );


        oscillator.stop(
            now + duration + 0.02
        );

    }


    // =============================================================
    // WARNING
    // =============================================================

    warning() {

        this.tone(
            180,
            0.16,
            "square",
            0.25,
            100
        );


        setTimeout(
            () => {

                this.tone(
                    120,
                    0.2,
                    "square",
                    0.25,
                    70
                );

            },
            180
        );

    }


    // =============================================================
    // BLOCK APPEARS
    // =============================================================

    blockAppear() {

        this.tone(
            75,
            0.35,
            "sawtooth",
            0.3,
            35
        );

    }


    // =============================================================
    // CHASE START
    // =============================================================

    chaseStart() {

        if (!this.ensure()) return;


        if (
            this.chaseOscillator
        ) {

            return;

        }


        this.chaseOscillator =
            this.context.createOscillator();


        this.chaseGain =
            this.context.createGain();


        this.chaseOscillator.type =
            "sawtooth";


        this.chaseOscillator.frequency.value =
            55;


        this.chaseGain.gain.value =
            0.035;


        this.chaseOscillator.connect(
            this.chaseGain
        );


        this.chaseGain.connect(
            this.masterGain
        );


        this.chaseOscillator.start();

    }


    // =============================================================
    // STOP CHASE
    // =============================================================

    stopChase() {

        if (
            !this.chaseOscillator
        ) {

            return;

        }


        try {

            this.chaseOscillator.stop();

        } catch (error) {

            // Already stopped.

        }


        this.chaseOscillator =
            null;

        this.chaseGain =
            null;

    }


    // =============================================================
    // CAUGHT
    // =============================================================

    caught() {

        this.stopChase();


        this.tone(
            90,
            0.5,
            "sawtooth",
            0.35,
            25
        );


        setTimeout(
            () => {

                this.tone(
                    50,
                    0.7,
                    "square",
                    0.25,
                    20
                );

            },
            150
        );

    }


    // =============================================================
    // TIMER WARNING
    // =============================================================

    timerWarning() {

        this.tone(
            700,
            0.08,
            "square",
            0.15,
            500
        );

    }


    // =============================================================
    // TIME UP
    // =============================================================

    timeUp() {

        this.tone(
            120,
            0.7,
            "sawtooth",
            0.3,
            40
        );

    }


    // =============================================================
    // PAUSE
    // =============================================================

    pause() {

        this.stopChase();


        this.tone(
            330,
            0.12,
            "sine",
            0.12,
            220
        );

    }


    // =============================================================
    // RESUME
    // =============================================================

    resume() {

        this.tone(
            220,
            0.12,
            "sine",
            0.12,
            330
        );

    }


    // =============================================================
    // LEVEL COMPLETE
    // =============================================================

    levelComplete() {

        this.tone(
            440,
            0.15,
            "sine",
            0.18
        );


        setTimeout(
            () => {

                this.tone(
                    660,
                    0.2,
                    "sine",
                    0.18
                );

            },
            160
        );


        setTimeout(
            () => {

                this.tone(
                    880,
                    0.3,
                    "sine",
                    0.18
                );

            },
            340
        );

    }


    // =============================================================
    // GAME COMPLETE
    // =============================================================

    gameComplete() {

        this.levelComplete();


        setTimeout(
            () => {

                this.tone(
                    1100,
                    0.5,
                    "sine",
                    0.15,
                    700
                );

            },
            500
        );

    }


    // =============================================================
    // EXIT
    // =============================================================

    exit() {

        this.stopChase();


        this.tone(
            180,
            0.25,
            "sine",
            0.15,
            80
        );

    }

}


window.gameAudio =
    new GameAudio();
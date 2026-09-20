const LEVELS = [

    // ============================================================
    // LEVEL 1 — THE DIGITAL DESCENT
    // INTRODUCTORY LEVEL
    // ============================================================

    {
        id: 1,
        name: "The Digital Descent",
        theme: "Digital World",
        timeLimit: 90,

        map: [
            "#########################",
            "#S....#.....#...........#",
            "#.###.#.###.#.#####.###.#",
            "#...#.#...#.#.....#.....#",
            "###.#.###.#.#####.#.###.#",
            "#...#.....#.....#.#...#.#",
            "#.###########.#.#.###.#.#",
            "#...........#.#.#.....#.#",
            "#########.#.#.#.#####.#.#",
            "#.........#...#.....#...#",
            "#.###########.#####.###.#",
            "#.....#.......#...#.....#",
            "###.#.#.#####.#.#.#####.#",
            "#...#.#.....#...#.......#",
            "#.###.#####.###########.#",
            "#.....................E.#",
            "#########################"
        ],

        triggerMode: "one-per-non-safe-route",

        spawnDistance: 6,

        safeRouteAttempts: 30,

        warningTime: 1500,

        speed: 3.4,

        maxDuration: 3,
        maxDistance: 10
    },


    // ============================================================
    // LEVEL 2 — THE LOST JUNGLE
    // FIRST BRAIDED MAZE
    // ============================================================

    {
        id: 2,
        name: "The Lost Jungle",
        theme: "Forgotten Jungle",
        timeLimit: 90,

        /*
         * LEVEL 2 DESIGN
         *
         * Unlike Level 1, this maze contains several genuine
         * S -> E routes.
         *
         * The important design change is that alternate routes
         * reconnect with one another instead of simply ending
         * in dead ends.
         *
         * The player therefore cannot just follow the longest
         * visible corridor toward E.
         */

        map: [
            "#########################",
            "#S....#.......#.........#",
            "#####.###.#####.###.###.#",
            "#...#...#.#...#.....#...#",
            "#.#.###.#.#.#.#.#.###.###",
            "#...#...#...#...#...#...#",
            "###.#.###.#########.#####",
            "#.....#...........#.....#",
            "#.###.#######.#.#.###.#.#",
            "#.........#...#.#...#.#.#",
            "#.#####.#.#.###.###.###.#",
            "#.#.....#.......#.#.#...#",
            "#.###.###########.#.#.#.#",
            "#...#.#...........#...#.#",
            "###.#.#.#########.#####.#",
            "#.....#.........#......E#",
            "#########################"
        ],

        triggerMode: "one-per-non-safe-route",

        spawnDistance: 5,

        safeRouteAttempts: 35,

        warningTime: 1500,

        speed: 3.5,

        maxDuration: 3,
        maxDistance: 10
    },


    // ============================================================
    // LEVEL 3 — THE FROZEN PASSAGE
    // MULTIPLE DEEP ALTERNATIVE ROUTES
    // ============================================================

    {
        id: 3,
        name: "The Frozen Passage",
        theme: "Frozen Wilderness",
        timeLimit: 90,

        /*
         * LEVEL 3 DESIGN
         *
         * The number of route reconnections is increased.
         *
         * Several choices remain viable for a long time before
         * eventually merging into another section of the maze.
         *
         * A player can no longer reliably determine the correct
         * route simply by looking for the corridor that appears
         * to travel closest to the exit.
         *
         * There are approximately 80 simple S -> E routes.
         */

        map: [
            "#########################",
            "#S....#.......#.........#",
            "#####.###.#####.###.###.#",
            "#...#...#.#...#.....#...#",
            "#.#.###.#.#.#.#.#.###.###",
            "#...#...#...#...#...#...#",
            "###.#.###.#####.###.#####",
            "#.....#...........#.....#",
            "#.###.#.#####.#.#.###.#.#",
            "#.........#...#.#...#.#.#",
            "#.#####.#.#.###.###.###.#",
            "#.#.....#.......#.#.#...#",
            "#.###.###########.#.#.#.#",
            "#...#.#...........#...#.#",
            "###.#.#.#######.#.#####.#",
            "#.....#.........#......E#",
            "#########################"
        ],

        triggerMode: "one-per-non-safe-route",

        spawnDistance: 5,

        safeRouteAttempts: 50,

        warningTime: 1500,

        speed: 3.7,

        maxDuration: 3,

        maxDistance: 8
    },


    // ============================================================
    // LEVEL 4 — THE MAGICAL DESERT
    // HIGHLY BRAIDED / DECEPTIVE
    // ============================================================

    {
        id: 4,
        name: "The Magical Desert",
        theme: "Magical Desert",
        timeLimit: 90,

        /*
         * LEVEL 4 DESIGN
         *
         * This is a heavily braided maze.
         *
         * There are many points where:
         *
         *      Route A ----\
         *                    >---- shared section
         *      Route B ----/
         *
         * This makes several routes look equally legitimate.
         *
         * The player can enter one branch, travel deeply into
         * the maze, reconnect somewhere unexpected, and still
         * have several choices available.
         *
         * Approximately 344 simple S -> E routes exist.
         */

        map: [
            "#########################",
            "#S....#.......#.........#",
            "#####.###.#####.#.#.###.#",
            "#...#...#.#...#.....#...#",
            "#.#.###.#.#.#.#.#.###.###",
            "#...#...#...#...#.......#",
            "###.#.###.#####.###.#####",
            "#.....#...........#.....#",
            "#.###.#.#####.#.#.###.#.#",
            "#.........#...#.#...#.#.#",
            "#.#####.#.#.###.###.###.#",
            "#.#.....#.......#.#.#...#",
            "#.###.#########.#.#.#.#.#",
            "#...#.#...........#...#.#",
            "###.#.#.#######.#.#####.#",
            "#...............#......E#",
            "#########################"
        ],

        triggerMode: "one-per-non-safe-route",

        spawnDistance: 4,

        safeRouteAttempts: 70,

        warningTime: 1500,

        speed: 3.8,

        maxDuration: 3,

        maxDistance: 8
    },


    // ============================================================
    // LEVEL 5 — THE HAUNTED CAVE
    // EXTREME BRAIDED MAZE
    // ============================================================

    {
        id: 5,
        name: "The Haunted Cave",
        theme: "Haunted Cave",
        timeLimit: 90,

        /*
         * FINAL LEVEL
         *
         * This level is designed around ambiguity rather than
         * simply adding more dead ends.
         *
         * Multiple routes repeatedly reconnect.
         *
         * The player may:
         *
         *      choose LEFT
         *           |
         *       reconnect
         *           |
         *      choose RIGHT
         *           |
         *       reconnect
         *
         * and both choices can remain viable for a substantial
         * portion of the maze.
         *
         * This prevents the player from visually identifying
         * one obvious "longest path" to E.
         *
         * Approximately 1,028 simple S -> E routes exist.
         *
         * The route engine remains bounded by maze.js so that
         * route generation does not freeze the browser.
         */

        map: [
            "#########################",
            "#S....#.......#.........#",
            "#####.###.#####.#.#.###.#",
            "#...#...#.#...#.....#...#",
            "#.#.###.#.#.#.#.#.###.###",
            "#...#...#...#...#.......#",
            "###.#.###.#####.###.#####",
            "#.....#...........#.....#",
            "#.###.#.#####.#.#.###.#.#",
            "#.........#...#.#...#.#.#",
            "#.#####.#.#.###.###.###.#",
            "#.#.....#.......#.#.#...#",
            "#.###.#########.#.#.#.#.#",
            "#...#.#...........#...#.#",
            "###.#.#.#####.#.#.#####.#",
            "#...............#......E#",
            "#########################"
        ],

        /*
         * HARDEST SETTINGS
         *
         * Timer remains 90 seconds.
         * Difficulty comes from maze structure and ghost speed.
         */

        triggerMode: "one-per-non-safe-route",

        spawnDistance: 3,

        safeRouteAttempts: 100,

        warningTime: 1500,

        speed: 4.2,

        maxDuration: 3,

        maxDistance: 7
    }

];
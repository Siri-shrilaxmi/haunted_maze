const LEVELS = [

    // ============================================================
    // LEVEL 1 — THE FIRST DESCENT
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

        /*
         * The map contains the full maze.
         *
         * The engine chooses a different S -> E route each run.
         * That route is completely trigger-free.
         * Every competing S -> E route receives hidden chase
         * encounters somewhere in its middle.
         */
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
    // ============================================================

    {
        id: 2,
        name: "The Lost Jungle",
        theme: "Forgotten Jungle",
        timeLimit: 90,

        map: [
            "#########################",
            "#S....#.................#",
            "#####.#####.###.#.###.#.#",
            "#...#.......#.#.........#",
            "#.#.###.#####.#####.###.#",
            "#.#.....#.....#...#.....#",
            "#.###.###.#.#.###.#.#####",
            "#...#.....#.#.....#.....#",
            "###.#######.#####.###.#.#",
            "#...#...#...#...#...#.#.#",
            "#.#.#.#.#.#.#.#.###.#.#.#",
            "#.#...#.#...#.#.....#...#",
            "#.#####.###.#.#######.###",
            "#.....#...#.#.....#.....#",
            "#####.###.#.#####.###.#.#",
            "#.........#...........E.#",
            "#########################"
        ],

        /*
         * Level 2 has a denser maze.
         *
         * The route engine uses these values as difficulty/settings
         * for the dynamically generated chase encounters.
         */
        triggerMode: "one-per-non-safe-route",
        spawnDistance: 6,
        safeRouteAttempts: 35,
        warningTime: 1500,
        speed: 3.5,
        maxDuration: 3,
        maxDistance: 10
    },


    // ============================================================
    // LEVEL 3 — THE FROZEN PASSAGE
    // ============================================================

    {
        id: 3,
        name: "The Frozen Passage",
        theme: "Frozen Wilderness",
        timeLimit: 90,

        /*
         * A larger and more deceptive maze than Level 2.
         *
         * The map itself contains all the possible routes.
         * The route engine decides which S -> E route is safe
         * for the current run.
         *
         * Snow/ice theme is handled by Renderer.js.
         */
        map: [
            "#########################",
            "#S#.....................#",
            "#.#.#########.#.#.#####.#",
            "#...#.....#...#.#.#.....#",
            "#####.##..#.#####.#.#####",
            "#.#...#.......#...#.#...#",
            "#.#.#.#######.#.#####.#.#",
            "#...#.#.....#.#.......#.#",
            "#.###.#.###.#.#.#######.#",
            "#.#...#...#...#.......#.#",
            "###.#####.#############.#",
            "#...#.....#.........#...#",
            "#.#.#.#####.###.#.#.#.#.#",
            "#...#.....#.#.....#...#.#",
            "#.#######.#.#.###.#.#.#.#",
            "#.............#.......#E#",
            "#########################"
        ],

        /*
         * Level 3 increases the number of possible decisions and
         * maze twists while keeping the timer at 90 seconds.
         */
        triggerMode: "one-per-non-safe-route",
        spawnDistance: 6,
        safeRouteAttempts: 50,
        warningTime: 1500,
        speed: 3.7,
        maxDuration: 3,
        maxDistance: 10
    },


    // ============================================================
    // LEVEL 4 — THE FORGOTTEN PALACE
    // ============================================================

    {
        id: 4,
        name: "The Forgotten Palace",
        theme: "Forgotten Palace",
        timeLimit: 90,

        map: [
            "#########################",
            "#S#.....#.............#.#",
            "#.#.###.#####...#####.#.#",
            "#...#.#.....#.#.....#...#",
            "#####.#####.#.#####.#####",
            "#.......#...#.....#.....#",
            "#.#.###.#.###.#.#######.#",
            "#...#.#...#...#.........#",
            "#.###.#########.#######.#",
            "#...#.#.........#.....#.#",
            "###...#.#.##.####.###.#.#",
            "#...#...#.......#.#.#...#",
            "#.#####.#######.#.#.####",
            "#.#...#.#.......#...#...#",
            "#.#.#.#.#.#########.#.#.#",
            "#...#.....#...........#E#",
            "#########################"
        ],

        /*
         * Palace level: more route choices and more mandatory
         * non-safe-route encounters than the first three levels.
         */
        triggerMode: "one-per-non-safe-route",
        spawnDistance: 6,
        safeRouteAttempts: 70,
        warningTime: 1500,
        speed: 3.8,
        maxDuration: 3,
        maxDistance: 10
    }

];


const WIDTH = 10;
const HEIGHT = 25;
const YMARGIN = HEIGHT - 20; // This is the top margin of the game matrix that is part of the game board but invisible
const TETROMINO_START_Y = 1;

const PREVIEWS = 3;

const COMBO_TABLE = [
    0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5
];



class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}


const tetrominoData = [
    [new Point(1, 0), new Point(0, 0), new Point(-1, 0), new Point(1, -1)], // L
    [new Point(1, 0), new Point(0, 0), new Point(-1, 0), new Point(-1, -1)], // J
    [new Point(1, 0), new Point(0, 0), new Point(0, -1), new Point(-1, -1)], // Z
    [new Point(1, -1), new Point(0, -1), new Point(0, 0), new Point(-1, 0)], // S
    [new Point(-1, 0), new Point(0, -1), new Point(0, 0), new Point(1, 0)], // T
    [new Point(1, 0), new Point(0, 0), new Point(-1, 0), new Point(-2, 0)], // I
    [new Point(-1, -1), new Point(0, -1), new Point(-1, 0), new Point(0, 0)], // O
];


// The I rotation data is a bit different because the center block is not at the point of rotation.
// The other rotations can be computed at run time.
const IrotationData = [
    [new Point(1, 0), new Point(0, 0), new Point(-1, 0), new Point(-2, 0)],   // 0 (no rotation)
    [new Point(0, -1), new Point(0, 0), new Point(0, 1), new Point(0, 2)],    // 1 (CW rotation)
    [new Point(1, 1), new Point(0, 1), new Point(-1, 1), new Point(-2, 1)],   // 2 (180 rotation)
    [new Point(-1, -1), new Point(-1, 0), new Point(-1, 1), new Point(-1, 2)] // 3 (CCW rotation
];


const IwallKickData = [
    [ // 0
        [new Point(0, 0), new Point(-2, 0), new Point(1, 0), new Point(-2, 1), new Point(1, -2)], // R
        [new Point(0, 0), new Point(-1, 0), new Point(2, 0), new Point(-1, -2), new Point(2, 1)]  // L
    ],
    [ // R
        [new Point(0, 0), new Point(-1, 0), new Point(2, 0), new Point(-1, -2), new Point(2, 1)], // 2
        [new Point(0, 0), new Point(2, 0), new Point(-1, 0), new Point(2, -1), new Point(-1, 2)]  // 0
    ],
    [ // 2
        [new Point(0, 0), new Point(2, 0), new Point(-1, 0), new Point(2, -1), new Point(1, 2)],  // L
        [new Point(0, 0), new Point(1, 0), new Point(-2, 0), new Point(1, 2), new Point(-2, -1)]  // R
    ],
    [ // L
        [new Point(0, 0), new Point(1, 0), new Point(-2, 0), new Point(1, 2), new Point(-2, -1)],// 0
        [new Point(0, 0), new Point(-2, 0), new Point(1, 0), new Point(-2, 1), new Point(1, -2)]  // 2
    ]
];


const ZSTLJwallKickData = [
    [ // 0
        [new Point(0, 0), new Point(-1, 0), new Point(-1, -1), new Point(0, 2), new Point(-1, 2)], // R
        [new Point(0, 0), new Point(1, 0), new Point(1, -1), new Point(0, 2), new Point(1, 2)]     // L
    ],
    [ // R
        [new Point(0, 0), new Point(1, 0), new Point(1, 1), new Point(0, -2), new Point(1, -2)],  // 2
        [new Point(0, 0), new Point(1, 0), new Point(1, 1), new Point(0, -2), new Point(1, -2)]  // 0
    ],
    [ // 2
        [new Point(0, 0), new Point(1, 0), new Point(1, -1), new Point(0, 2), new Point(1, 2)],  // L
        [new Point(0, 0), new Point(-1, 0), new Point(-1, -1), new Point(0, 2), new Point(-1, 2)]  // R
    ],
    [ // L
        [new Point(0, 0), new Point(-1, 0), new Point(-1, 1), new Point(0, -2), new Point(-1, -2)],// 0
        [new Point(0, 0), new Point(-1, 0), new Point(-1, 1), new Point(0, -2), new Point(-1, -2)]  // 2
    ]
];




const MINO_L = 0;
const MINO_J = 1;
const MINO_Z = 2;
const MINO_S = 3;
const MINO_T = 4;
const MINO_I = 5;
const MINO_O = 6;
const GARBAGE = 7;
const UNCLEARABLE_GARBAGE = 8;


const NO_TSPIN = 0;
const TSPIN_MINI = 1;
const TSPIN = 2;


let CONTROLS = {
    LEFT: 37,
    RIGHT: 39,
    HARD_DROP: 32,
    SOFT_DROP: 40,
    ROTATE_CW: 38,
    ROTATE_CCW: 90,
    HOLD: 67,
    ROTATE_180: 88,
    RESTART: 82
};


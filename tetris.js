const canvas = document.getElementById("gameCanvas");
const nextCanvas = document.getElementById("nextCanvas");
const ctx = canvas.getContext("2d");
const nextCtx = nextCanvas.getContext("2d");
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-button");

const ROWS = 20;
const COLS = 20; // Making the playfield a square
const BLOCK_SIZE = 32;
let dropSpeed = 500; // Slower drop speed

const COLORS = ['cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'];
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1], [1, 1]], // O
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 0], [0, 1, 1]] // Z
];

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let currentTetromino, nextTetromino;
let xPos, yPos;
let score = 0;
let gameInterval;

let landed = false;
let directionChosen = false; // New flag to detect if direction has been chosen
let movingToEdge = null; // New variable to track which edge is being moved towards

function getRandomTetromino() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return { shape, color };
}

function initializeTetromino() {
    currentTetromino = nextTetromino || getRandomTetromino(); // If nextTetromino exists, use it
    nextTetromino = getRandomTetromino(); // Generate a new next tetromino
    xPos = Math.floor(COLS / 2) - Math.floor(currentTetromino.shape[0].length / 2);
    yPos = Math.floor(ROWS / 2) - Math.floor(currentTetromino.shape.length / 2); // Center vertically and horizontally
    directionChosen = false;
    movingToEdge = null;
}

function drawBlock(x, y, color, context) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = "#000";
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawGrid() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col]) {
                drawBlock(col, row, grid[row][col], ctx);
            } else {
                drawBlock(col, row, '#111', ctx);
            }
        }
    }
}

function drawTetromino(context = ctx) {
    currentTetromino.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell && yPos + y >= 0) { // Only draw when inside the grid
                drawBlock(xPos + x, yPos + y, currentTetromino.color, context);
            }
        });
    });
}

function drawNextTetromino() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextTetromino.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                drawBlock(x, y, nextTetromino.color, nextCtx);
            }
        });
    });
}

function isValidMove(offsetX, offsetY) {
    return currentTetromino.shape.every((row, y) => {
        return row.every((cell, x) => {
            if (cell) {
                const newX = xPos + x + offsetX;
                const newY = yPos + y + offsetY;
                return newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS && !grid[newY][newX];
            }
            return true;
        });
    });
}

function rotateTetromino() {
    const rotatedShape = currentTetromino.shape[0].map((_, colIndex) =>
        currentTetromino.shape.map(row => row[colIndex])
    ).reverse();

    const oldShape = currentTetromino.shape;
    currentTetromino.shape = rotatedShape;

    if (!isValidMove(0, 0)) {
        currentTetromino.shape = oldShape;
    }
}

function placeTetromino() {
    currentTetromino.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell && yPos + y >= 0) {
                grid[yPos + y][xPos + x] = currentTetromino.color;
            }
        });
    });

    if (movingToEdge === 'down') {
        clearFilledRows();
    } else if (movingToEdge === 'up') {
        clearFilledRowsTop();
    } else if (movingToEdge === 'left') {
        clearFilledColumnsLeft();
    } else if (movingToEdge === 'right') {
        clearFilledColumnsRight();
    }

    score += 10;
    scoreElement.textContent = `Score: ${score}`;

    initializeTetromino(); // Set up the next tetromino

    drawNextTetromino();

    if (!isValidMove(0, 0)) {
        clearInterval(gameInterval);
        alert('Game Over');
    }
}

function clearFilledRows() {
    grid = grid.filter(row => row.some(cell => !cell));
    while (grid.length < ROWS) {
        grid.unshift(Array(COLS).fill(0));
    }
}

function clearFilledRowsTop() {
    let cleared = 0;
    for (let y = 0; y < ROWS; y++) {
        if (grid[y].every(cell => cell)) {
            grid.splice(y, 1);
            grid.push(Array(COLS).fill(0));
            cleared++;
        }
    }
}

function clearFilledColumnsLeft() {
    let cleared = 0;
    for (let x = 0; x < COLS; x++) {
        if (grid.every(row => row[x])) {
            for (let y = 0; y < ROWS; y++) {
                grid[y].splice(x, 1);
                grid[y].push(0);
            }
            cleared++;
        }
    }
}

function clearFilledColumnsRight() {
    let cleared = 0;
    for (let x = COLS - 1; x >= 0; x--) {
        if (grid.every(row => row[x])) {
            for (let y = 0; y < ROWS; y++) {
                grid[y].splice(x, 1);
                grid[y].unshift(0);
            }
            cleared++;
        }
    }
}


function moveToEdge() {
    switch (movingToEdge) {
        case 'up':
            if (isValidMove(0, -1)) {
                yPos--;
            } else {
                landed = true;
            }
            break;
        case 'down':
            if (isValidMove(0, 1)) {
                yPos++;
            } else {
                landed = true;
            }
            break;
        case 'left':
            if (isValidMove(-1, 0)) {
                xPos--;
            } else {
                landed = true;
            }
            break;
        case 'right':
            if (isValidMove(1, 0)) {
                xPos++;
            } else {
                landed = true;
            }
            break;
    }
}

function gameLoop() {
    if (!landed) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawTetromino();

        if (directionChosen) {
            moveToEdge(); // Move towards the edge
        }
    } else {
        placeTetromino();
        landed = false;
    }
}

document.addEventListener("keydown", (event) => {
    if (!gameInterval) return;

    switch (event.key) {
        case 'ArrowLeft':
            if (directionChosen) {
                switch (movingToEdge) {
                    case 'down':
                        if (isValidMove(-1, 0)) xPos--; // Move left
                        break;
                    case 'right':
                        rotateTetromino(); // Rotate
                        break;
                    case 'left':
                        if (isValidMove(-1, 0)) xPos--; // Move towards left edge faster
                        break;
                    case 'up':
                        if (isValidMove(-1, 0)) xPos--; // Move left
                        break;
                }
            }
            break;
        case 'ArrowRight':
            if (directionChosen) {
                switch (movingToEdge) {
                    case 'down':
                        if (isValidMove(1, 0)) xPos++; // Move right
                        break;
                    case 'right':
                        if (isValidMove(1, 0)) xPos++; // Move towards right edge faster
                        break;
                    case 'left':
                        rotateTetromino(); // Rotate
                        break;
                    case 'up':
                        if (isValidMove(1, 0)) xPos++; // Move right
                        break;
                }
            }
            break;
        case 'ArrowDown':
            if (directionChosen) {
                switch (movingToEdge) {
                    case 'down':
                        if (isValidMove(0, 1)) yPos++; // Move down faster
                        break;
                    case 'right':
                        if (isValidMove(0, 1)) yPos++; // Move down
                        break;
                    case 'left':
                        if (isValidMove(0, 1)) yPos++; // Move down
                        break;
                    case 'up':
                        rotateTetromino(); // Rotate
                        break;
                }
            }
            break;
        case 'ArrowUp':
            if (directionChosen) {
                switch (movingToEdge) {
                    case 'down':
                        rotateTetromino(); // Rotate
                        break;
                    case 'right':
                        if (isValidMove(0, -1)) yPos--; // Move up
                        break;
                    case 'left':
                        if (isValidMove(0, -1)) yPos--; // Move up
                        break;
                    case 'up':
                        if (isValidMove(0, -1)) yPos--; // Move towards top edge faster
                        break;
                }
            }
            break;
        case 'w': // Move to the top edge
            if (!directionChosen) {
                directionChosen = true;
                movingToEdge = 'up';
            }
            break;
        case 'a': // Move to the left edge
            if (!directionChosen) {
                directionChosen = true;
                movingToEdge = 'left';
            }
            break;
        case 's': // Move to the bottom edge
            if (!directionChosen) {
                directionChosen = true;
                movingToEdge = 'down';
            }
            break;
        case 'd': // Move to the right edge
            if (!directionChosen) {
                directionChosen = true;
                movingToEdge = 'right';
            }
            break;
    }
});

startButton.addEventListener("click", () => {
    if (!gameInterval) {
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        score = 0;
        scoreElement.textContent = `Score: ${score}`;
        initializeTetromino(); // Initialize the first tetromino
        drawGrid();
        drawTetromino(); // Draw the first tetromino
        drawNextTetromino();
        gameInterval = setInterval(gameLoop, dropSpeed);
        startButton.textContent = "Restart Game";
    } else {
        clearInterval(gameInterval);
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        score = 0;
        scoreElement.textContent = `Score: ${score}`;
        initializeTetromino(); // Initialize a new tetromino
        drawGrid();
        drawTetromino(); // Draw the first tetromino
        drawNextTetromino();
        landed = false;
        directionChosen = false; // Reset the state
        gameInterval = setInterval(gameLoop, dropSpeed);
    }
});

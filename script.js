let chess = new Chess();
let currentPlayer = 'w';
let whiteTime, blackTime;
let interval;
let isOnlineGame = false;
let isAIGame = false;
let socket;

function startGame() {
    setupGame();
    createChessboard();
    startTimer();
}

function startOnlineGame() {
    isOnlineGame = true;
    setupGame();
    createChessboard();
    startTimer();
    setupWebSocket();
}

function startAIGame() {
    isAIGame = true;
    setupGame();
    createChessboard();
    startTimer();
}

function setupGame() {
    let timeLimit = parseInt(document.getElementById('time').value) * 60;
    if (isNaN(timeLimit) || timeLimit < 1 || timeLimit > 180 * 60) {
        alert("لطفاً زمان معتبر وارد کنید!");
        return;
    }

    whiteTime = timeLimit;
    blackTime = timeLimit;
    document.getElementById('white-time').innerText = formatTime(whiteTime);
    document.getElementById('black-time').innerText = formatTime(blackTime);

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
}

function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function startTimer() {
    interval = setInterval(() => {
        if (currentPlayer === 'w') {
            whiteTime--;
            document.getElementById('white-time').innerText = formatTime(whiteTime);
        } else {
            blackTime--;
            document.getElementById('black-time').innerText = formatTime(blackTime);
        }

        if (whiteTime <= 0 || blackTime <= 0) {
            clearInterval(interval);
            alert(`بازی تمام شد! ${whiteTime <= 0 ? 'سیاه' : 'سفید'} برنده شد!`);
        }
    }, 1000);
}

function createChessboard() {
    const boardElement = document.getElementById('chessboard');
    boardElement.innerHTML = '';

    let board = chess.board();
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            let piece = board[row][col];
            cell.innerText = piece ? getUnicodePiece(piece) : '';
            cell.addEventListener('click', () => handleMove(row, col));
            boardElement.appendChild(cell);
        }
    }
}

function getUnicodePiece(piece) {
    const unicodePieces = {
        'p': '♙', 'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔',
        'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚'
    };
    return unicodePieces[piece.type] || '';
}

function handleMove(row, col) {
    let square = String.fromCharCode(97 + col) + (8 - row);
    let moves = chess.moves({ square, verbose: true });

    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight'));

    moves.forEach(move => {
        let targetRow = 8 - parseInt(move.to[1]);
        let targetCol = move.to.charCodeAt(0) - 97;
        let targetCell = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
        if (targetCell) targetCell.classList.add('highlight');
    });

    if (moves.length > 0) {
        document.querySelector(`[data-row="${row}"][data-col="${col}"]`).addEventListener('click', () => makeMove(square, moves[0].to));
    }
}

function makeMove(from, to) {
    chess.move({ from, to });
    currentPlayer = chess.turn();
    createChessboard();

    if (chess.in_checkmate()) {
        alert(`کیش و مات! ${currentPlayer === 'w' ? 'سیاه' : 'سفید'} برنده شد!`);
        clearInterval(interval);
    } else if (chess.in_draw()) {
        alert("بازی مساوی شد!");
        clearInterval(interval);
    }
}

function resetGame() {
    clearInterval(interval);
    chess.reset();
    currentPlayer = 'w';
    createChessboard();
    startTimer();
}

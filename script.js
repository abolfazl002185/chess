document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const timeSelection = document.getElementById('time-selection');
    const gameContainer = document.getElementById('game-container');
    const gameTimeInput = document.getElementById('game-time');
    const startGameBtn = document.getElementById('start-game');
    const resetGameBtn = document.getElementById('reset-game');
    const whiteTimeDisplay = document.getElementById('white-time');
    const blackTimeDisplay = document.getElementById('black-time');
    const chessboard = document.getElementById('chessboard');
    const gameResult = document.getElementById('game-result');

    // Game variables
    let game;
    let timer;
    let selectedPiece = null;
    let possibleMoves = [];

    // Initialize the app
    function init() {
        startGameBtn.addEventListener('click', startGame);
        resetGameBtn.addEventListener('click', resetGame);
    }

    // Start a new game
    function startGame() {
        const minutes = parseInt(gameTimeInput.value);
        if (isNaN(minutes) || minutes < 1 || minutes > 180) {
            alert('لطفاً زمان بازی را بین 1 تا 180 دقیقه وارد کنید');
            return;
        }

        game = {
            board: createInitialBoard(),
            currentPlayer: 'white',
            whiteTime: minutes * 60,
            blackTime: minutes * 60,
            gameOver: false,
            whiteKingPos: { row: 7, col: 4 },
            blackKingPos: { row: 0, col: 4 },
            whiteCastling: { kingSide: true, queenSide: true },
            blackCastling: { kingSide: true, queenSide: true },
            enPassantTarget: null,
            halfMoveClock: 0,
            fullMoveNumber: 1
        };

        timeSelection.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        gameResult.classList.add('hidden');

        updateTimeDisplays();
        renderBoard();
        startTimer();
    }

    // Reset the game
    function resetGame() {
        clearInterval(timer);
        gameContainer.classList.add('hidden');
        timeSelection.classList.remove('hidden');
        gameResult.classList.add('hidden');
    }

    // Create initial chess board
    function createInitialBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));

        // Black pieces
        board[0][0] = { type: 'rook', color: 'black', hasMoved: false };
        board[0][1] = { type: 'knight', color: 'black' };
        board[0][2] = { type: 'bishop', color: 'black' };
        board[0][3] = { type: 'queen', color: 'black' };
        board[0][4] = { type: 'king', color: 'black', hasMoved: false };
        board[0][5] = { type: 'bishop', color: 'black' };
        board[0][6] = { type: 'knight', color: 'black' };
        board[0][7] = { type: 'rook', color: 'black', hasMoved: false };
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black', hasMoved: false };
        }

        // White pieces
        board[7][0] = { type: 'rook', color: 'white', hasMoved: false };
        board[7][1] = { type: 'knight', color: 'white' };
        board[7][2] = { type: 'bishop', color: 'white' };
        board[7][3] = { type: 'queen', color: 'white' };
        board[7][4] = { type: 'king', color: 'white', hasMoved: false };
        board[7][5] = { type: 'bishop', color: 'white' };
        board[7][6] = { type: 'knight', color: 'white' };
        board[7][7] = { type: 'rook', color: 'white', hasMoved: false };
        for (let i = 0; i < 8; i++) {
            board[6][i] = { type: 'pawn', color: 'white', hasMoved: false };
        }

        return board;
    }

    // Update time displays
    function updateTimeDisplays() {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };

        whiteTimeDisplay.textContent = formatTime(game.whiteTime);
        blackTimeDisplay.textContent = formatTime(game.blackTime);
    }

    // Start the game timer
    function startTimer() {
        clearInterval(timer);
        timer = setInterval(() => {
            if (game.gameOver) return;

            if (game.currentPlayer === 'white') {
                game.whiteTime--;
                if (game.whiteTime <= 0) {
                    endGame('سیاه به دلیل اتمام وقت سفید برنده شد!');
                    return;
                }
            } else {
                game.blackTime--;
                if (game.blackTime <= 0) {
                    endGame('سفید به دلیل اتمام وقت سیاه برنده شد!');
                    return;
                }
            }

            updateTimeDisplays();
        }, 1000);
    }

    // End the game
    function endGame(message) {
        game.gameOver = true;
        clearInterval(timer);
        gameResult.textContent = message;
        gameResult.classList.remove('hidden');
    }

    // Render the chess board
    function renderBoard() {
        chessboard.innerHTML = '';
        possibleMoves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = game.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.style.backgroundImage = `url('pieces/${piece.color}_${piece.type}.png')`;
                    square.appendChild(pieceElement);
                }

                square.addEventListener('click', () => handleSquareClick(row, col));
                chessboard.appendChild(square);
            }
        }
    }

    // Handle square click
    function handleSquareClick(row, col) {
        if (game.gameOver) return;

        const piece = game.board[row][col];

        // If no piece is selected and the clicked square has a piece of the current player's color
        if (!selectedPiece && piece && piece.color === game.currentPlayer) {
            selectedPiece = { row, col };
            possibleMoves = getPossibleMoves(row, col);
            highlightPossibleMoves();
            return;
        }

        // If a piece is already selected
        if (selectedPiece) {
            // If clicking on another piece of the same color, select that piece instead
            if (piece && piece.color === game.currentPlayer) {
                selectedPiece = { row, col };
                possibleMoves = getPossibleMoves(row, col);
                highlightPossibleMoves();
                return;
            }

            // Check if the move is valid
            const isValidMove = possibleMoves.some(move => move.row === row && move.col === col);
            if (isValidMove) {
                makeMove(selectedPiece.row, selectedPiece.col, row, col);
            }

            // Reset selection
            selectedPiece = null;
            possibleMoves = [];
            highlightPossibleMoves();
        }
    }

    // Highlight possible moves
    function highlightPossibleMoves() {
        const squares = chessboard.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('highlight', 'possible-move');
        });

        if (selectedPiece) {
            const selectedSquare = chessboard.querySelector(`[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`);
            if (selectedSquare) {
                selectedSquare.classList.add('highlight');
            }

            possibleMoves.forEach(move => {
                const square = chessboard.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
                if (square) {
                    square.classList.add('possible-move');
                }
            });
        }
    }

    // Get possible moves for a piece
    function getPossibleMoves(row, col) {
        const piece = game.board[row][col];
        if (!piece) return [];

        const moves = [];
        const opponentColor = piece.color === 'white' ? 'black' : 'white';

        switch (piece.type) {
            case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1;
                const startRow = piece.color === 'white' ? 6 : 1;

                // Move forward
                if (isInBounds(row + direction, col) && !game.board[row + direction][col]) {
                    moves.push({ row: row + direction, col });

                    // Double move from starting position
                    if (row === startRow && !game.board[row + 2 * direction][col] && !game.board[row + direction][col]) {
                        moves.push({ row: row + 2 * direction, col });
                    }
                }

                // Capture diagonally
                for (const dc of [-1, 1]) {
                    const newCol = col + dc;
                    if (isInBounds(row + direction, newCol)) {
                        // Normal capture
                        if (game.board[row + direction][newCol] && game.board[row + direction][newCol].color === opponentColor) {
                            moves.push({ row: row + direction, col: newCol });
                        }
                        // En passant
                        if (game.enPassantTarget && game.enPassantTarget.row === row + direction && game.enPassantTarget.col === newCol) {
                            moves.push({ row: row + direction, col: newCol, isEnPassant: true });
                        }
                    }
                }
                break;

            case 'rook':
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    let r = row + dr;
                    let c = col + dc;
                    while (isInBounds(r, c)) {
                        if (!game.board[r][c]) {
                            moves.push({ row: r, col: c });
                        } else {
                            if (game.board[r][c].color === opponentColor) {
                                moves.push({ row: r, col: c });
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                }
                break;

            case 'knight':
                for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
                    const r = row + dr;
                    const c = col + dc;
                    if (isInBounds(r, c) && (!game.board[r][c] || game.board[r][c].color === opponentColor)) {
                        moves.push({ row: r, col: c });
                    }
                }
                break;

            case 'bishop':
                for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    let r = row + dr;
                    let c = col + dc;
                    while (isInBounds(r, c)) {
                        if (!game.board[r][c]) {
                            moves.push({ row: r, col: c });
                        } else {
                            if (game.board[r][c].color === opponentColor) {
                                moves.push({ row: r, col: c });
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                }
                break;

            case 'queen':
                // Combine rook and bishop moves
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    let r = row + dr;
                    let c = col + dc;
                    while (isInBounds(r, c)) {
                        if (!game.board[r][c]) {
                            moves.push({ row: r, col: c });
                        } else {
                            if (game.board[r][c].color === opponentColor) {
                                moves.push({ row: r, col: c });
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                }
                break;

            case 'king':
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    const r = row + dr;
                    const c = col + dc;
                    if (isInBounds(r, c) && (!game.board[r][c] || game.board[r][c].color === opponentColor)) {
                        moves.push({ row: r, col: c });
                    }
                }

                // Castling
                if (!piece.hasMoved) {
                    const castling = piece.color === 'white' ? game.whiteCastling : game.blackCastling;
                    
                    // King-side castling
                    if (castling.kingSide) {
                        let canCastle = true;
                        for (let c = col + 1; c < 7; c++) {
                            if (game.board[row][c]) {
                                canCastle = false;
                                break;
                            }
                        }
                        if (canCastle && !game.board[row][7]?.hasMoved) {
                            moves.push({ row, col: col + 2, isCastle: true, rookCol: 7, newRookCol: col + 1 });
                        }
                    }

                    // Queen-side castling
                    if (castling.queenSide) {
                        let canCastle = true;
                        for (let c = col - 1; c > 0; c--) {
                            if (game.board[row][c]) {
                                canCastle = false;
                                break;
                            }
                        }
                        if (canCastle && !game.board[row][0]?.hasMoved) {
                            moves.push({ row, col: col - 2, isCastle: true, rookCol: 0, newRookCol: col - 1 });
                        }
                    }
                }
                break;
        }

        // Filter out moves that would leave the king in check
        return moves.filter(move => {
            // Simulate the move
            const originalBoard = JSON.parse(JSON.stringify(game.board));
            const originalKingPos = piece.type === 'king' ? { row, col } : 
                                  piece.color === 'white' ? {...game.whiteKingPos} : {...game.blackKingPos};
            
            makeMoveOnBoard(row, col, move.row, move.col, true);

            // Check if the king is in check after the move
            const kingPos = piece.type === 'king' ? { row: move.row, col: move.col } : originalKingPos;
            const isCheck = isSquareUnderAttack(kingPos.row, kingPos.col, piece.color);

            // Restore the board
            game.board = originalBoard;

            return !isCheck;
        });
    }

    // Make a move on the board
    function makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = game.board[fromRow][fromCol];
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);

        // Update piece position
        game.board[fromRow][fromCol] = null;
        game.board[toRow][toCol] = piece;

        // Handle special moves
        if (move?.isEnPassant) {
            // Remove the captured pawn
            game.board[fromRow][toCol] = null;
        } else if (move?.isCastle) {
            // Move the rook
            const rook = game.board[fromRow][move.rookCol];
            game.board[fromRow][move.rookCol] = null;
            game.board[fromRow][move.newRookCol] = rook;
            rook.hasMoved = true;
        } else if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            // Set en passant target
            game.enPassantTarget = { row: fromRow + (toRow - fromRow) / 2, col: fromCol };
        } else {
            game.enPassantTarget = null;
        }

        // Handle pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            // In a real game, you'd prompt the user to choose a piece
            // Here we'll automatically promote to queen for simplicity
            game.board[toRow][toCol] = { type: 'queen', color: piece.color };
        }

        // Update king position if moved
        if (piece.type === 'king') {
            if (piece.color === 'white') {
                game.whiteKingPos = { row: toRow, col: toCol };
            } else {
                game.blackKingPos = { row: toRow, col: toCol };
            }
        }

        // Update castling rights
        if (piece.type === 'king') {
            piece.hasMoved = true;
            if (piece.color === 'white') {
                game.whiteCastling = { kingSide: false, queenSide: false };
            } else {
                game.blackCastling = { kingSide: false, queenSide: false };
            }
        } else if (piece.type === 'rook') {
            piece.hasMoved = true;
            if (piece.color === 'white') {
                if (fromCol === 0) game.whiteCastling.queenSide = false;
                if (fromCol === 7) game.whiteCastling.kingSide = false;
            } else {
                if (fromCol === 0) game.blackCastling.queenSide = false;
                if (fromCol === 7) game.blackCastling.kingSide = false;
            }
        }

        // Update move clocks
        if (piece.type === 'pawn' || game.board[toRow][toCol]) {
            game.halfMoveClock = 0;
        } else {
            game.halfMoveClock++;
        }

        if (game.currentPlayer === 'black') {
            game.fullMoveNumber++;
        }

        // Switch player
        game.currentPlayer = game.currentPlayer === 'white' ? 'black' : 'white';

        // Check for game end conditions
        checkGameEnd();

        // Render the updated board
        renderBoard();
    }

    // Make a move on the board (without side effects, for simulation)
    function makeMoveOnBoard(fromRow, fromCol, toRow, toCol, isSimulation = false) {
        const piece = game.board[fromRow][fromCol];
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);

        game.board[fromRow][fromCol] = null;
        game.board[toRow][toCol] = piece;

        if (move?.isEnPassant) {
            game.board[fromRow][toCol] = null;
        } else if (move?.isCastle) {
            const rook = game.board[fromRow][move.rookCol];
            game.board[fromRow][move.rookCol] = null;
            game.board[fromRow][move.newRookCol] = rook;
            if (!isSimulation) rook.hasMoved = true;
        }

        // Update king position if moved
        if (piece.type === 'king') {
            if (piece.color === 'white') {
                game.whiteKingPos = { row: toRow, col: toCol };
            } else {
                game.blackKingPos = { row: toRow, col: toCol };
            }
        }
    }

    // Check if the game should end
    function checkGameEnd() {
        // Check for checkmate or stalemate
        const hasLegalMoves = hasAnyLegalMoves(game.currentPlayer);
        const isInCheck = isKingInCheck(game.currentPlayer);

        if (!hasLegalMoves) {
            if (isInCheck) {
                endGame(`${game.currentPlayer === 'white' ? 'سیاه' : 'سفید'} به دلیل کیش و مات برنده شد!`);
            } else {
                endGame('بازی به دلیل پات مساوی شد!');
            }
        } else if (isDrawByRepetition() || game.halfMoveClock >= 50) {
            endGame('بازی مساوی شد!');
        }
    }

    // Check if a player has any legal moves
    function hasAnyLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (piece && piece.color === color) {
                    const moves = getPossibleMoves(row, col);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Check if the king is in check
    function isKingInCheck(color) {
        const kingPos = color === 'white' ? game.whiteKingPos : game.blackKingPos;
        return isSquareUnderAttack(kingPos.row, kingPos.col, color);
    }

    // Check if a square is under attack
    function isSquareUnderAttack(row, col, color) {
        const opponentColor = color === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = game.board[r][c];
                if (piece && piece.color === opponentColor) {
                    // Temporarily remove any piece at the target square to check if it can be captured
                    const originalPiece = game.board[row][col];
                    game.board[row][col] = null;

                    const moves = getPossibleMovesForPiece(r, c, true);

                    // Restore the original piece
                    game.board[row][col] = originalPiece;

                    if (moves.some(move => move.row === row && move.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Get possible moves for a piece (without check validation)
    function getPossibleMovesForPiece(row, col, includeChecks = false) {
        const piece = game.board[row][col];
        if (!piece) return [];

        const moves = [];
        const opponentColor = piece.color === 'white' ? 'black' : 'white';

        switch (piece.type) {
            case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1;
                const startRow = piece.color === 'white' ? 6 : 1;

                // Move forward
                if (isInBounds(row + direction, col) && !game.board[row + direction][col]) {
                    moves.push({ row: row + direction, col });

                    // Double move from starting position
                    if (row === startRow && !game.board[row + 2 * direction][col] && !game.board[row + direction][col]) {
                        moves.push({ row: row + 2 * direction, col });
                    }
                }

                // Capture diagonally
                for (const dc of [-1, 1]) {
                    const newCol = col + dc;
                    if (isInBounds(row + direction, newCol)) {
                        if (game.board[row + direction][newCol] && game.board[row + direction][newCol].color === opponentColor) {
                            moves.push({ row: row + direction, col: newCol });
                        }
                    }
                }
                break;

            case 'rook':
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    let r = row + dr;
                    let c = col + dc;
                    while (isInBounds(r, c)) {
                        if (!game.board[r][c]) {
                            moves.push({ row: r, col: c });
                        } else {
                            if (game.board[r][c].color === opponentColor) {
                                moves.push({ row: r, col: c });
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                }
                break;

            case 'knight':
                for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
                    const r = row + dr;
                    const c = col + dc;
                    if (isInBounds(r, c) && (!game.board[r][c] || game.board[r][c].color === opponentColor)) {
                        moves.push({ row: r, col: c });
                    }
                }
                break;

            case 'bishop':
                for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    let r = row + dr;
                    let c = col + dc;
                    while (isInBounds(r, c)) {
                        if (!game.board[r][c]) {
                            moves.push({ row: r, col: c });
                        } else {
                            if (game.board[r][c].color === opponentColor) {
                                moves.push({ row: r, col: c });
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                }
                break;

            case 'queen':
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    let r = row + dr;
                    let c = col + dc;
                    while (isInBounds(r, c)) {
                        if (!game.board[r][c]) {
                            moves.push({ row: r, col: c });
                        } else {
                            if (game.board[r][c].color === opponentColor) {
                                moves.push({ row: r, col: c });
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                }
                break;

            case 'king':
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    const r = row + dr;
                    const c = col + dc;
                    if (isInBounds(r, c) && (!game.board[r][c] || game.board[r][c].color === opponentColor)) {
                        moves.push({ row: r, col: c });
                    }
                }
                break;
        }

        return moves;
    }

    // Check for draw by repetition (simplified)
    function isDrawByRepetition() {
        // In a real implementation, you'd track previous board states
        return false;
    }

    // Check if coordinates are within the board bounds
    function isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // Initialize the game
    init();
});

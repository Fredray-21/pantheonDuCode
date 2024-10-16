import {Piece} from './Piece.js';
import {findKingPosition, getValidMoves} from './moves.js';

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const currentPlayerContainer = document.getElementById("currentPlayer");

const TILE_SIZE = 75;
export const BOARD_SIZE = 8;

// On init le board avec les pieces par défaut
const createRow = (pieces, color, row) => pieces.map((type, col) => type === null ? null : new Piece(type, color, row, col));
const initialBoard = [
    createRow(['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], 'black', 0),
    createRow(Array(8).fill('p'), 'black', 1),
    ...Array(4).fill(null).map(() => Array(8).fill(null)),
    createRow(Array(8).fill('p'), 'white', 6),
    createRow(['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], 'white', 7)
];

export let board = initialBoard.map(row => row.map(piece => piece ? new Piece(piece.type, piece.color, piece.row, piece.col) : null));
let selectedPiece = null;
let possibleMoves = [];
let currentPlayer = 'white'; // Le joueur actuel
let isGameOver = false;


export const drawBoard = () => {
    // Effacer le canevas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const isLight = (row + col) % 2 === 0;
            ctx.fillStyle = isLight ? "#d1c4e9" : "#7e57c2";
            ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            // Highlight de la selected case
            if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }

            // highlight des coups possibles
            if (possibleMoves.some(move => move.row === row && move.col === col)) {
                ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }

            const piece = board[row][col];
            if (piece) drawPiece(piece, col, row);
        }
    }

    currentPlayerContainer.textContent = `Tour de: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}`;
}


// Func qui dessine une piece
const drawPiece = (piece, col, row) => {
    const img = new Image();
    img.src = piece.getImagePath();
    img.onload = () => {
        ctx.drawImage(img, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    };
}


canvas.addEventListener("click", (event) => {
    if (isGameOver) return;

    // les infos du canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);

    const pieceAtPosition = board[row][col];

    if (selectedPiece) {
        // ici on bouge
        if (possibleMoves.some(move => move.row === row && move.col === col)) {
            movePiece(selectedPiece.row, selectedPiece.col, row, col);
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
        }
        selectedPiece = null;
        possibleMoves = [];
    } else {
        // ici on affiche les mouvements possibles
        if (pieceAtPosition && pieceAtPosition.color === currentPlayer) {
            selectedPiece = pieceAtPosition;
            possibleMoves = getValidMoves(selectedPiece);
        }
    }
    drawBoard();
    checkGameOver();

});


export const movePiece = (fromRow, fromCol, toRow, toCol) => {
    if (isGameOver) {
        return;
    }
    const piece = board[fromRow][fromCol];

    if (piece.type === 'k' && Math.abs(toCol - fromCol) === 2) {
        const side = (toCol > fromCol) ? 'kingSide' : 'queenSide';
        castle(piece, fromRow, fromCol, side);
    } else if (!board[toRow][toCol] || board[toRow][toCol].color !== piece.color) {
        // Déplacement standard de la pièce
        board[toRow][toCol] = piece;
        piece.updatePosition(toRow, toCol);
        board[fromRow][fromCol] = null; // Effacer la pièce de sa case d'origine

        // La promotion pour les pions
        if (piece.type === 'p' && (toRow === 0 || toRow === 7)) {
            promotePawn(piece, toRow, toCol);
        }
    }
}

const checkMate = (color) => {
    const pieces = board.flat().filter(piece => piece && piece.color === color);
    return pieces.every(piece => getValidMoves(piece).length === 0);
}

const checkPat = (color) => {
    if (checkCheck(color)) {
        return false;
    }
    const pieces = board.flat().filter(piece => piece && piece.color === color);

    return pieces.every(piece => {
        const moves = getValidMoves(piece);
        return moves.length === 0;
    });
}

const checkCheck = (color) => {
    const kingPosition = findKingPosition(board, color);
    const opponentColor = color === 'white' ? 'black' : 'white';
    const opponentPieces = board.flat().filter(piece => piece && piece.color === opponentColor);

    return opponentPieces.some(piece => {
        const moves = getValidMoves(piece);
        return moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col);
    });
}


const checkGameOver = () => {
    // currentPlayer c'est l'autre joueur chuut
    if (checkPat(currentPlayer)) {
        alert("Pat");
        isGameOver = true;
    } else if (checkMate(currentPlayer)) {
        alert("Les noirs ont gagné");
        isGameOver = true;
    }
}

// Déplacer le roi et la tour lors du roque
const castle = (king, row, col, side) => {
    // position de la tour avant et après
    const rookCol = side === 'kingSide' ? 7 : 0;
    const rookTargetCol = side === 'kingSide' ? col + 1 : col - 1;

    // On déplace le roi
    board[row][col] = null;
    board[row][col + (side === 'kingSide' ? 2 : -2)] = king;
    king.updatePosition(row, col + (side === 'kingSide' ? 2 : -2));

    // On déplace la tour sur la case cible
    const rook = board[row][rookCol];
    board[row][rookCol] = null;
    board[row][rookTargetCol] = rook;
    rook.updatePosition(row, rookTargetCol);
}

// Promotion d'un pion
const promotePawn = (pawn, row, col) => {
    let isPromotionDone = false;
    const promotionMap = {
        'd': 'q',
        't': 'r',
        'f': 'b',
        'c': 'n'
    };
    while (!isPromotionDone) {
        const newPieceType = prompt("Choisissez une promotion (d pour Dame, t pour Tour, f pour Fou, c pour Cavalier):", "d");
        const transformedPieceType = newPieceType ? newPieceType.toLowerCase() : null;

        if (transformedPieceType && promotionMap[transformedPieceType]) {
            board[row][col] = new Piece(promotionMap[transformedPieceType], pawn.color, row, col);
            isPromotionDone = true;
        } else {
            alert("Type de promotion invalide. Veuillez essayer à nouveau.");
        }
    }
}

drawBoard();
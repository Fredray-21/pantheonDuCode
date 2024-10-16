import { board, BOARD_SIZE } from './game.js';
import {Piece} from "./Piece.js";

export const getBasicMoves = (piece, board) => {
    const row = piece.row;
    const col = piece.col;
    const moves = [];

    switch (piece.type) {
        case 'p': // Pion
            if (piece.color === 'white') {
                if (row > 0 && !board[row - 1][col]) { // Mouvement simple
                    moves.push({ row: row - 1, col });
                }
                if (row === 6 && !board[row - 1][col] && !board[row - 2][col]) { // Mouvement double du pion
                    moves.push({ row: row - 2, col });
                }
                // Capture diagonale
                if (row > 0 && col > 0 && board[row - 1][col - 1] && board[row - 1][col - 1].color === 'black') {
                    moves.push({ row: row - 1, col: col - 1 });
                }
                if (row > 0 && col < BOARD_SIZE - 1 && board[row - 1][col + 1] && board[row - 1][col + 1].color === 'black') {
                    moves.push({ row: row - 1, col: col + 1 });
                }
            } else { // Pion noir
                if (row < 7 && !board[row + 1][col]) { // Mouvement simple
                    moves.push({ row: row + 1, col });
                }
                if (row === 1 && !board[row + 1][col] && !board[row + 2][col]) { // Mouvement double du pion
                    moves.push({ row: row + 2, col });
                }
                // Capture diagonale
                if (row < 7 && col > 0 && board[row + 1][col - 1] && board[row + 1][col - 1].color === 'white') {
                    moves.push({ row: row + 1, col: col - 1 });
                }
                if (row < 7 && col < BOARD_SIZE - 1 && board[row + 1][col + 1] && board[row + 1][col + 1].color === 'white') {
                    moves.push({ row: row + 1, col: col + 1 });
                }
            }
            break;

        case 'r': // Tour
            moves.push(...getLinearMoves(board, piece, row, col, 1, 0)); // Haut
            moves.push(...getLinearMoves(board, piece, row, col, -1, 0)); // Bas
            moves.push(...getLinearMoves(board, piece, row, col, 0, 1)); // Droite
            moves.push(...getLinearMoves(board, piece, row, col, 0, -1)); // Gauche
            break;

        case 'b': // Fou
            moves.push(...getLinearMoves(board, piece, row, col, 1, 1)); // Diagonale bas droite
            moves.push(...getLinearMoves(board, piece, row, col, 1, -1)); // Diagonale bas gauche
            moves.push(...getLinearMoves(board, piece, row, col, -1, 1)); // Diagonale haut droite
            moves.push(...getLinearMoves(board, piece, row, col, -1, -1)); // Diagonale haut gauche
            break;

        case 'q': // Dame
            moves.push(...getLinearMoves(board, piece, row, col, 1, 0)); // Haut (comme une tour)
            moves.push(...getLinearMoves(board, piece, row, col, -1, 0)); // Bas
            moves.push(...getLinearMoves(board, piece, row, col, 0, 1)); // Droite
            moves.push(...getLinearMoves(board, piece, row, col, 0, -1)); // Gauche
            moves.push(...getLinearMoves(board, piece, row, col, 1, 1)); // Diagonale bas droite (comme un fou)
            moves.push(...getLinearMoves(board, piece, row, col, 1, -1)); // Diagonale bas gauche
            moves.push(...getLinearMoves(board, piece, row, col, -1, 1)); // Diagonale haut droite
            moves.push(...getLinearMoves(board, piece, row, col, -1, -1)); // Diagonale haut gauche
            break;

        case 'n': // Cavalier
            const knightMoves = [
                { row: row - 2, col: col - 1 }, { row: row - 2, col: col + 1 },
                { row: row - 1, col: col - 2 }, { row: row - 1, col: col + 2 },
                { row: row + 1, col: col - 2 }, { row: row + 1, col: col + 2 },
                { row: row + 2, col: col - 1 }, { row: row + 2, col: col + 1 }
            ];
            knightMoves.forEach(move => {
                if (isOnBoard(move.row, move.col) && (!board[move.row][move.col] || board[move.row][move.col].color !== piece.color)) {
                    moves.push(move);
                }
            });
            break;

        case 'k': // Roi
            const kingMoves = [
                { row: row - 1, col }, { row: row + 1, col }, // Haut, bas
                { row, col: col - 1 }, { row, col: col + 1 }, // Gauche, droite
                { row: row - 1, col: col - 1 }, { row: row - 1, col: col + 1 }, // Diagonales haut
                { row: row + 1, col: col - 1 }, { row: row + 1, col: col + 1 } // Diagonales bas
            ];
            kingMoves.forEach(move => {
                if (isOnBoard(move.row, move.col) && (!board[move.row][move.col] || board[move.row][move.col].color !== piece.color)) {
                    moves.push(move);
                }
            });
            break;
    }

    return moves;
}

const getLinearMoves = (newBoard, piece, row, col, rowIncrement, colIncrement) => {
    const moves = [];
    let newRow = row + rowIncrement;
    let newCol = col + colIncrement;

    while (isOnBoard(newRow, newCol)) {
        if (newBoard[newRow][newCol]) {
            // Si c'est pas notre equipe, alors le move est possible (on peux le manger)
            if (newBoard[newRow][newCol].color !== piece.color) {
                moves.push({ row: newRow, col: newCol });
            }
            // on stop la boucle car on peux pas passé au dessus d'une piece
            break;
        }
        moves.push({ row: newRow, col: newCol });
        newRow += rowIncrement;
        newCol += colIncrement;
    }

    return moves;
}

// Vérifier si une position est dans les limites de l'échiquier
const isOnBoard = (row, col) =>{
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export const getValidMoves = (piece) => {
    const basicMoves = getBasicMoves(piece, board);

    if (piece.type === 'k') {
        if (canCastle(piece, 'kingSide')) {
            basicMoves.push({ row: piece.row, col: piece.col + 2 });
        }
        if (canCastle(piece, 'queenSide')) {
            basicMoves.push({ row: piece.row, col: piece.col - 2 });
        }
    }

    return basicMoves.filter(move => {
        const newBoard = board.map(row => row.map(piece => piece ? new Piece(piece.type, piece.color, piece.row, piece.col) : null));
        newBoard[move.row][move.col] = newBoard[piece.row][piece.col];
        newBoard[piece.row][piece.col] = null;

        newBoard[move.row][move.col].row = move.row;
        newBoard[move.row][move.col].col = move.col;

        return !isKingInCheck(newBoard, piece.color);
    });
}

const isKingInCheck = (newBoard, color) => {
    const kingPosition = findKingPosition(newBoard, color);
    const opponentColor = color === 'white' ? 'black' : 'white';
    const opponentPieces = newBoard.flat().filter(piece => piece && piece.color === opponentColor);

    return opponentPieces.some(piece => {
        const moves = getBasicMoves(piece, newBoard);
        return moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col);
    });
}

export const findKingPosition = (newBoard, color) => {
    return newBoard.flat().find(piece => piece && piece.type === 'k' && piece.color === color);
}

// Vérifier si le roque est possible
const canCastle = (king, side) => {
    const row = king.row;
    const col = king.col;
    // Le roi n'a jamais bougé
    if (king.hasMoved) return false;

    const rookCol = side === 'kingSide' ? 7 : 0;
    const rook = board[row][rookCol];

    // Assurer que la tour n'a jamais bougé
    if (!rook || rook.type !== 'r' || rook.hasMoved) return false;

    // Assurer qu'il n'y a pas de pièces entre le roi et la tour
    const emptySquares = side === 'kingSide' ? [col + 1, col + 2] : [col - 1, col - 2, col - 3];
    if (emptySquares.some(c => board[row][c])) return false;

    // Le roi ne traverse pas une cassé attaquée ou n'est pas attaqué
    const squaresToCheck = side === 'kingSide' ? [col, col + 1, col + 2] : [col, col - 1, col - 2];
    return squaresToCheck.every(c => !isSquareAttacked(row, c, king.color));
}

// Vérifier si une case est attaquée
const isSquareAttacked = (row, col, color) => {
    const opponentColor = color === 'white' ? 'black' : 'white';
    const opponentPieces = board.flat().filter(piece => piece && piece.color === opponentColor);
    return opponentPieces.some(piece => {
        const moves = getBasicMoves(piece, board);
        return moves.some(move => move.row === row && move.col === col);
    });
}
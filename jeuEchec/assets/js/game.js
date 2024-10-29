import {Piece} from './Piece.js';
import {findKingPosition, getValidMoves} from './moves.js';

const menu = document.getElementById("menu");
const soloButton = document.getElementById("soloButton");
const multiButton = document.getElementById("multiButton");
const canvas = document.getElementById("game");
const currentPlayerContainer = document.getElementById("currentPlayer");
const waitingMessage = document.getElementById("waitingMessage");

let socket = null;
let isMultiplayer = false;
let myColor = null; // ma couleur en multi
let lastMoveId = null;
let selectedPiece = null;
let possibleMoves = [];
let currentPlayer = 'white';
let isGameOver = false;
let imWaiting = false;

// Fonction pour démarrer le mode multijoueur
const startMultiGame = () => {
    if (imWaiting) return;
    isMultiplayer = true;

    socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
        socket.send(JSON.stringify({type: 'join'}));
    }

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'waiting':
                // Affiche un message d'attente pour un autre joueur
                waitingMessage.textContent = data.message;
                waitingMessage.style.display = 'block';
                imWaiting = true;
                break;

            case 'start':
                // Cacher le message d'attente et définir la couleur du joueur
                menu.style.display = 'none';
                canvas.style.display = 'block';
                currentPlayerContainer.style.display = 'block';

                waitingMessage.style.display = 'none';
                imWaiting = false;
                myColor = data.color;
                currentPlayer = data.currentPlayer;
                drawBoard();
                break;

            case 'update':
                // update pour afficher le move de l'adversaire
                if (data.moveId === lastMoveId) return; // on veux pas les messages en oubles

                movePiece(data.from.row, data.from.col, data.to.row, data.to.col);
                lastMoveId = data.moveId;
                currentPlayer = data.currentPlayer;
                drawBoard();
                checkGameOver();
                break;

            case 'promotion':
                // Remplace la pièce promue par le nouveau type de pièce reçu
                const promotedPiece = board[data.row][data.col];
                console.log(data, promotedPiece); // ici j'ai : null hmmmm why

                // si j'ai une piece je promue avec le type reçu
                if (promotedPiece) {
                    board[data.row][data.col] = new Piece(data.pieceType, promotedPiece.color, data.row, data.col);
                    drawBoard();
                }
                break;

            case 'gameOver':
                // Gérer la fin de partie
                isGameOver = true;
                alert(data.result);
                socket.close();
                break;
        }
    };

    socket.onclose = () => alert("Déconnecté du serveur");
};

// Envoyer les mouvements au serveur WebSocket
const sendMove = (fromRow, fromCol, toRow, toCol) => {
    if (socket && isMultiplayer && currentPlayer === myColor) {
        const moveId = `${fromRow}${fromCol}${toRow}${toCol}${Date.now()}`; // Créer un ID unique pour le mouvement
        lastMoveId = moveId; // Stocker l'ID du mouvement local

        socket.send(JSON.stringify({
            type: 'move',
            from: {row: fromRow, col: fromCol},
            to: {row: toRow, col: toCol},
            moveId // Inclure l'identifiant dans le message
        }));
    }
};

const sendPromotion = (row, col, type) => {
    if (socket && isMultiplayer && currentPlayer === myColor) {
        socket.send(JSON.stringify({
            type: 'promotion',
            row,
            col,
            pieceType: type
        }));
    }
}

// Fonction pour démarrer le jeu solo
const startSoloGame = () => {
    menu.style.display = 'none';
    canvas.style.display = 'block';
    currentPlayerContainer.style.display = 'block';
    drawBoard(); // Démarrer le jeu en dessinant le plateau
    if (currentPlayer === 'black') {
        setTimeout(playIA, getRandomDelay());
    }
};

soloButton.addEventListener("click", startSoloGame);
multiButton.addEventListener("click", startMultiGame);

const getRandomDelay = () => Math.floor(Math.random() * 2000) + 1000; // entre 1 et 4 secondes

let lastMove = null;
const playIA = () => {
    if (isGameOver || currentPlayer !== 'black' || isMultiplayer) return;

    const blackPieces = board.flat().filter(piece => piece && piece.color === 'black');
    let selectedPiece, validMoves;

    // Trouver un mouvement valide
    while (!validMoves?.length) {
        selectedPiece = blackPieces[Math.floor(Math.random() * blackPieces.length)];
        validMoves = getValidMoves(selectedPiece);
    }

    // Choisir un mouvement au hasard
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];

    lastMove = {from: {row: selectedPiece.row, col: selectedPiece.col}, to: {row: move.row, col: move.col}};

    movePiece(selectedPiece.row, selectedPiece.col, move.row, move.col);

    currentPlayer = 'white';
    drawBoard();
    checkGameOver();
};


const ctx = canvas.getContext("2d");

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

export const drawBoard = () => {
    // Effacer le canevas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const isLight = (row + col) % 2 === 0;
            ctx.fillStyle = isLight ? "#d1c4e9" : "#7e57c2";
            ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            // Coloration en bleu de la case jouée par l'IA
            // if (lastIaMove && lastIaMove.to.row === row && lastIaMove.to.col === col) {
            //     ctx.fillStyle = "rgba(0, 175, 255, 1)"; // Fond bleu clair
            // }

            // on draw en bleu les cases du dernier move from et to
            if (lastMove) {
                if (lastMove.from.row === row && lastMove.from.col === col) {
                    ctx.fillStyle = "rgba(0, 175, 255, 1)";
                    ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
                if (lastMove.to.row === row && lastMove.to.col === col) {
                    ctx.fillStyle = "rgba(0, 175, 255, 1)";
                    ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }

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

    currentPlayerContainer.textContent = `Tour de: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} (${isMultiplayer ? (currentPlayer === myColor ? 'Vous' : 'Adversaire') : (currentPlayer === 'black' ? 'IA' : 'Vous')})`;
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
    if (isGameOver || (!isMultiplayer && currentPlayer === 'black') || (isMultiplayer && currentPlayer !== myColor)) return;

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
            drawBoard();
            checkGameOver();

            // Si la partie n'est pas terminée, lancer l'IA après un délai
            if (!isGameOver && !isMultiplayer) setTimeout(playIA, getRandomDelay());
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
});


export const movePiece = (fromRow, fromCol, toRow, toCol) => {
    if (isGameOver) return;
    const piece = board[fromRow][fromCol];

    if (!piece) return;

    if (piece.type === 'k' && Math.abs(toCol - fromCol) === 2) {
        const side = (toCol > fromCol) ? 'kingSide' : 'queenSide';
        castle(piece, fromRow, fromCol, side);

        // Envoyer le mouvement en multijoueur
        if (isMultiplayer) sendMove(fromRow, fromCol, fromRow, fromCol + (side === 'kingSide' ? 2 : -2));

    } else if (!board[toRow][toCol] || board[toRow][toCol].color !== piece.color) {
        // Déplacement standard de la pièce
        board[toRow][toCol] = piece;
        piece.updatePosition(toRow, toCol);
        board[fromRow][fromCol] = null; // Effacer la pièce de sa case d'origine

        // Envoyer le mouvement en multijoueur
        if (isMultiplayer) sendMove(fromRow, fromCol, toRow, toCol);

        // La promotion pour les pions
        if (piece.type === 'p' && (toRow === 0 || toRow === 7)) {
            promotePawn(piece, toRow, toCol);
        }
    }

    lastMove = {from: {row: fromRow, col: fromCol}, to: {row: toRow, col: toCol}};
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
        alert("Echec et mat : " + (currentPlayer === 'white' ? 'Noir' : 'Blanc') + " gagne !");
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
    if (isMultiplayer && currentPlayer !== myColor) return;

    let isPromotionDone = false;
    const promotionMap = {
        'd': 'q', // Dame
        't': 'r', // Tour
        'f': 'b', // Fou
        'c': 'n'  // Cavalier
    };
    while (!isPromotionDone) {
        const newPieceType = prompt("Choisissez une promotion (d pour Dame, t pour Tour, f pour Fou, c pour Cavalier):", "d");
        const transformedPieceType = newPieceType ? newPieceType.toLowerCase() : null;

        if (transformedPieceType && promotionMap[transformedPieceType]) {
            // Met à jour la pièce promue directement sur le plateau
            board[row][col] = new Piece(promotionMap[transformedPieceType], pawn.color, row, col);
            isPromotionDone = true;

            // Envoie la promotion en multijoueur pour mettre à jour chez l'adversaire
            if (isMultiplayer) sendPromotion(row, col, promotionMap[transformedPieceType]);
        } else {
            alert("Type de promotion invalide. Veuillez essayer à nouveau.");
        }
    }
    drawBoard();
};

drawBoard();
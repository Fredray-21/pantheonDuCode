const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 3000});

let waitingPlayers = []; // Queue pour les joueurs en attente de partie

// Quand un joueur se connecte
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            waitingPlayers.push(ws);
            ws.send(JSON.stringify({type: "waiting", message: "En attente d'un autre joueur..."}));

            if (waitingPlayers.length >= 2) {
                // Démarrer une partie avec les deux premiers joueurs de la file d'attente
                const player1 = waitingPlayers.shift();
                const player2 = waitingPlayers.shift();
                startGame(player1, player2);
            }
        }
    });

    ws.on('close', () => {
        console.log('Un joueur s\'est déconnecté');
        waitingPlayers = waitingPlayers.filter(player => player !== ws);
    });
});

// Fonction pour démarrer une partie
const startGame = (player1, player2) => {
    player1.color = 'white';
    player2.color = 'black';

    // Notifier chaque joueur que la partie commence et lui envoyer sa couleur
    player1.send(JSON.stringify({type: "start", color: player1.color, currentPlayer: "white"}));
    player2.send(JSON.stringify({type: "start", color: player2.color, currentPlayer: "white"}));

    // Associer les joueurs pour pouvoir transmettre leurs mouvements
    handlePlayerMoves(player1, player2);
    handlePlayerMoves(player2, player1);
};


// Gestion de l'écoute des mouvements de chaque joueur
const handlePlayerMoves = (player, opponent) => {
    player.on('message', (message) => {
            const data = JSON.parse(message);

            if (data.type === 'move') {
                // Transmettre le mouvement à l'adversaire
                opponent.send(JSON.stringify({
                    type: "update",
                    from: data.from,
                    to: data.to,
                    currentPlayer: player.color === 'white' ? 'black' : 'white',
                    moveId: data.moveId
                }));
            }

            if (data.type === 'promotion') {
                opponent.send(JSON.stringify({
                    type: "promotion",
                    row: data.row,
                    col: data.col,
                    pieceType: data.pieceType
                }));

                if (data.type === 'end') {
                    // Terminer la partie si un joueur a gagné
                    player.send(JSON.stringify({type: "gameOver", result: "You Win!"}));
                    opponent.send(JSON.stringify({type: "gameOver", result: "You Lose!"}));
                    player.close();
                    opponent.close();
                }
            }
        }
    );
};

const WebSocket = require('ws');

const canvasWidth = 800;
const canvasHeight = 600;

const wss = new WebSocket.Server({ port: 3000 });

let players = [];
let games = [];

wss.on('connection', (ws) => {
    console.log("Un joueur connecté");

    // Envoyer un message d'attente dès la connexion
    ws.send(JSON.stringify({ type: "waiting", message: "En attente d'un autre joueur..." }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if(data.type === "join") {
            players.push({username: data.username, socket: ws, isInGame: false});
            console.log("Un joueur a rejoint la partie", data.username);
            matchmake();
        } else if(data.type === "update") {
            const player = players.find(player => player.socket === ws);
            if(player) {
                const game = games.find(game => game.player1 === player || game.player2 === player);

            }
            console.log("On update")
        }

    });

    ws.on('close', () => {
        console.log("Un joueur déconnecté");
        // players = players.filter(player => player.socket !== ws);
        // const game = findGameByPlayer(ws);
        // if (game) {
        //     game.finish("Le joueur a quitté la partie");
        // }
    });
});

function matchmake() {
    if (players.length % 2 === 0 && players.length > 0) {
        const player1 = players[players.length - 2];
        const player2 = players[players.length - 1];
        players[players.length - 2].isInGame = true;
        players[players.length - 1].isInGame = true;
        games.push({ player1, player2 });
        player1.socket.send(JSON.stringify({ type: "gameState", state: "playing", role: "left" }));
        player2.socket.send(JSON.stringify({ type: "gameState", state: "playing", role: "right" }));
        startGame(player1, player2);
    }
}


function startGame(player1, player2) {
    let leftPaddleY = 300;
    let rightPaddleY = 300;
    let ballX = canvasWidth / 2;
    let ballY = canvasHeight / 2;
    let ballSpeedX = 5;
    let ballSpeedY = 5;

    player1.socket.send(JSON.stringify({ type: "gameState", state: "playing", role: "left" }));
    player2.socket.send(JSON.stringify({ type: "gameState", state: "playing", role: "right" }));

    const updateLoop = setInterval(() => {
        // Envoyer les positions mises à jour aux deux joueurs
        player1.socket.send(JSON.stringify({
            type: "update",
            leftPaddleY: leftPaddleY,
            rightPaddleY: rightPaddleY,
            ballX: ballX,
            ballY: ballY,
            ballSpeedX: ballSpeedX,
            ballSpeedY: ballSpeedY
        }));

        player2.socket.send(JSON.stringify({
            type: "update",
            leftPaddleY: leftPaddleY,
            rightPaddleY: rightPaddleY,
            ballX: canvasWidth - ballX,
            ballY: ballY,
            ballSpeedX: ballSpeedX,
            ballSpeedY: ballSpeedY
        }));

        // // Gagner la partie
        // if (ballX < 0) {
        //     finishGame(player2, player1);
        // } else if (ballX > canvasWidth) {
        //     finishGame(player1, player2);
        // }
    },  1000 / 60); // 60 FPS

    function finishGame(winner, loser) {
        clearInterval(updateLoop);
        winner.socket.send(JSON.stringify({ type: "gameState", state: "finished", winner: `${winner.username} a gagné !` }));
        loser.socket.send(JSON.stringify({ type: "gameState", state: "finished", winner: `${winner.username} a gagné !` }));
        games = games.filter(game => game.player1 !== winner && game.player2 !== winner);
        players = players.filter(player => player !== winner && player !== loser);
    }
}


const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const canvasWidth = 800;
const canvasHeight = 600;
const paddleWidth = 10;
const paddleHeight = 100;
const winningScore = 11;
const listOfColors = ["#8cdf57", "#908160", "#5d9bee", "#99cc91", "#8c6697", "#30abc1", "#6b9d6e", "#6b9d6e", "#5f735a", "#6b7991", "#3fac8f", "#8c51b4", "#dea253", "#5e57d0", "#33ab5c", "#90cdc1"];

let players = [];

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            players.push({ username: data.username, socket: ws, isInGame: false });

            if (players.length === 1) {
                ws.send(JSON.stringify({ type: "waiting", message: "En attente d'un autre joueur..." }));
            }

            if(players.length >= 2) {
                const player1 = players.shift();
                const player2 = players.shift();

                startGame(player1, player2);
            }
        }
    });

    ws.on('close', () => {
        console.log('Un joueur s\'est déconnecté');
    });
});

const startGame =(player1, player2) => {
    let leftPaddleY = 300;
    let rightPaddleY = 300;
    let ballX = canvasWidth / 2;
    let ballY = canvasHeight / 2;
    let ballSpeedX = 5;
    let ballSpeedY = 5;
    let leftPlayerScore = 0;
    let rightPlayerScore = 0;

    player1.isInGame = true;
    player2.isInGame = true;

    player1.socket.send(JSON.stringify({ type: "gameState", state: "playing", role: "left" }));
    player2.socket.send(JSON.stringify({ type: "gameState", state: "playing", role: "right" }));

    const updateLoop = setInterval(() => {
        // Update ball position
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Collision with top and bottom walls
        if (ballY < 0 || ballY > canvasHeight) {
            ballSpeedY = -ballSpeedY;
            changeColor();
        }

        // Collision with paddles
        if (ballX < paddleWidth && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            changeColor();
        }
        if (ballX > canvasWidth - paddleWidth && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            changeColor();
        }

        // Marquer un point
        if (ballX < 0) {
            rightPlayerScore++;
            resetBall();
        } else if (ballX > canvasWidth) {
            leftPlayerScore++;
            resetBall();
        }

        // Game over
        if (leftPlayerScore >= winningScore || rightPlayerScore >= winningScore) {
            const winner = (leftPlayerScore >= winningScore) ? player1.username : player2.username;
            player1.socket.send(JSON.stringify({ type: "gameState", state: "finished", winner: `${winner} a gagné!` }));
            player2.socket.send(JSON.stringify({ type: "gameState", state: "finished", winner: `${winner} a gagné!` }));
            clearInterval(updateLoop);

            // On kill les sockets des joueurs
            player1.socket.close();
            player2.socket.close();
            players = players.filter(player => player !== player1 && player !== player2);
        } else {
            // On envoie les mises à jour aux joueurs
            const object = {
                type: "update",
                leftPaddleY: leftPaddleY,
                rightPaddleY: rightPaddleY,
                ballX: ballX,
                ballY: ballY,
                leftPlayerScore: leftPlayerScore,
                rightPlayerScore: rightPlayerScore
            }
            player1.socket.send(JSON.stringify(object));
            player2.socket.send(JSON.stringify(object));
        }
    }, 1000 / 60); // 60 FPS


    // On écoute les mouvements du joueur 1
    player1.socket.on('message', (message) => {
        const data = JSON.parse(message);
        if(data.type === "update") {
            leftPaddleY = data.leftPaddleY;
        }
    });

    // On écoute les mouvements du joueur 2
    player2.socket.on('message', (message) => {
        const data = JSON.parse(message);
        if(data.type === "update") {
            rightPaddleY = data.rightPaddleY;
        }
    });

    // on reset la position de la balle et on augmente la vitesse
    const resetBall =() => {
        if (ballSpeedX < 0) {
            ballX = canvasWidth / 1.2;
        } else {
            ballX = canvasWidth / 4;
        }

        ballY = canvasHeight / 2;

        const speedIncrease = 0.2;
        const maxSpeed = 5;
        ballSpeedX += ballSpeedX > 0 ? Math.min(speedIncrease, maxSpeed - ballSpeedX) : -Math.min(speedIncrease, maxSpeed + ballSpeedX);
        ballSpeedY += ballSpeedY > 0 ? Math.min(speedIncrease, maxSpeed - ballSpeedY) : -Math.min(speedIncrease, maxSpeed + ballSpeedY);
    }

    // On change la couleur de fond
    const changeColor = () => {
        const color = listOfColors[Math.floor(Math.random() * listOfColors.length)];
        player1.socket.send(JSON.stringify({ type: "color", color: color }));
        player2.socket.send(JSON.stringify({ type: "color", color: color }));
    }
}

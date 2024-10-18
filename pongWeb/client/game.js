const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

const paddleWidth = 10;
const paddleHeight = 100;

let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;

let leftPlayerScore = 0;
let rightPlayerScore = 0;

let isMultiplayer = false;
const dvdLogo = new Image();

const listOfColors = ["#8cdf57", "#908160", "#5d9bee", "#99cc91", "#8c6697", "#30abc1", "#6b9d6e", "#6b9d6e", "#5f735a", "#6b7991", "#3fac8f", "#8c51b4", "#dea253", "#5e57d0", "#33ab5c", "#90cdc1"];
let currentColor = "#000";

let animationId = null;

let username = "";
let socket = null;
let gameState = "waiting";
let gameRole = null;


// local IA :
let ballSpeedX = 3;
let ballSpeedY = 3;

// Variables pour stocker les listeners d'event
let mouseMoveListener;
let multiplayerMouseMoveListener;

document.getElementById("vsIA").addEventListener("click", () => {
    startGame(false);
    toggleStarsAnimation();
});

document.getElementById("multiplayer").addEventListener("click", () => {
    username = prompt("Entrez votre nom d'utilisateur :");
    if (username.trim() !== "") {
        startGame(true);
    }

});

const startGame = (multiplayer) => {
    isMultiplayer = multiplayer;
    if (isMultiplayer) {
        connectToServer();
    } else {
        document.getElementById("menu").style.display = "none";
        canvas.style.display = "block";
        document.body.style.cursor = "none";
        mouseMoveListener = (event) => {
            const canvasPosition = canvas.getBoundingClientRect();
            if (event.clientY - canvasPosition.top - paddleHeight / 2 < 0) {
                leftPaddleY = 0;
            } else if (event.clientY - canvasPosition.top - paddleHeight / 2 > canvas.height - paddleHeight) {
                leftPaddleY = canvas.height - paddleHeight;
            } else {
                leftPaddleY = event.clientY - canvasPosition.top - paddleHeight / 2;
            }
        };

        document.addEventListener("mousemove", mouseMoveListener);

        dvdLogo.src = './DVD_logo.svg';
        dvdLogo.onload = () => {
            draw();
        };
    }
}

connectToServer = () => {
    socket = new WebSocket("ws://localhost:3000");

    socket.onopen = () => {
        console.log("Connecté au serveur WebSocket");
        socket.send(JSON.stringify({type: "join", username: username}));
    };

    socket.onclose = () => {
        console.log("Déconnecté du serveur WebSocket");
    }

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "waiting") {
            document.getElementById("waitingMessage").innerText = data.message;
            document.getElementById("waitingMessage").style.display = "block";
        } else if (data.type === "gameState") {
            gameState = data.state;
            if (gameState === "playing") {
                gameRole = data.role;
                document.getElementById("waitingMessage").style.display = "none";
                document.getElementById("menu").style.display = "none";
                const starsElement = document.querySelector('.stars');
                starsElement.style.animation = "none";
                canvas.style.display = "block";

                dvdLogo.src = './DVD_logo.svg';
                dvdLogo.onload = () => {
                    draw();
                };
            } else if (gameState === "finished") {
                alert(data.winner);
                resetGame();
                document.getElementById("menu").style.display = "flex";
                const starsElement = document.querySelector('.stars');
                starsElement.style.animation = "";
            }
        } else if (data.type === "update") {
            // Receive paddle and ball updates from the server
            if (gameRole === "left") {
                rightPaddleY = data.rightPaddleY;
                ballX = data.ballX;
                ballY = data.ballY;
            } else {
                leftPaddleY = data.leftPaddleY;
                ballX = data.ballX; // Mirror ball for right player
                ballY = data.ballY;
            }
            leftPlayerScore = data.leftPlayerScore;
            rightPlayerScore = data.rightPlayerScore;
        } else if (data.type === "color") {
            currentColor = data.color;
        }
    };

    multiplayerMouseMoveListener = (event) => {
        const canvasPosition = canvas.getBoundingClientRect();
        if (gameRole === "left") {
            leftPaddleY = event.clientY - canvasPosition.top - paddleHeight / 2;
        } else {
            rightPaddleY = event.clientY - canvasPosition.top - paddleHeight / 2;
        }
        sendPosition();
    };

    document.addEventListener("mousemove", multiplayerMouseMoveListener);

    const sendPosition = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            if (gameRole === "left") {
                socket.send(JSON.stringify({type: "update", leftPaddleY: leftPaddleY}));
            } else {
                socket.send(JSON.stringify({type: "update", rightPaddleY: rightPaddleY}));
            }
        }
    }
}

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Les raquettes
    ctx.fillStyle = "white";
    ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

    // ligne du millieu
    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.setLineDash([20, 15]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.closePath();

    const logoWidth = 60;
    const logoHeight = 60;
    ctx.drawImage(dvdLogo, ballX - logoWidth / 2, ballY - logoHeight / 2, logoWidth, logoHeight);

    if (!isMultiplayer) updateAI();

    ctx.font = "120px Arial";
    ctx.fillStyle = "white";
    const leftScoreText = leftPlayerScore.toString();
    const rightScoreText = rightPlayerScore.toString();
    const leftTextWidth = ctx.measureText(leftScoreText).width;
    const rightTextWidth = ctx.measureText(rightScoreText).width;
    const leftScoreX = (canvas.width / 3 - leftTextWidth / 2);
    ctx.fillText(leftScoreText, leftScoreX, 125);
    const rightScoreX = (2 * canvas.width / 3 - rightTextWidth / 2);
    ctx.fillText(rightScoreText, rightScoreX, 125);

    if (leftPlayerScore === 11 || rightPlayerScore === 11) {
        const winner = (leftPlayerScore === 11) ? "Tu as gagné !" : "L'IA a gagné !";
        resetGame();
        alert(`${winner} a gagné !`);
        document.getElementById("menu").style.display = "flex";
        return;
    }

    animationId = requestAnimationFrame(draw);
}

const resetGame = () => {
    canvas.style.display = "none";
    cancelAnimationFrame(animationId);
    document.body.style.cursor = "default";
    leftPlayerScore = 0;
    rightPlayerScore = 0;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;

    // Retirer les event listeners s'ils existent
    if (mouseMoveListener) {
        document.removeEventListener("mousemove", mouseMoveListener);
        mouseMoveListener = null;
    }
    if (multiplayerMouseMoveListener) {
        document.removeEventListener("mousemove", multiplayerMouseMoveListener);
        multiplayerMouseMoveListener = null;
    }
}

const updateAI = () => {
    // Collision avec les murs haut et bas
    if (ballY < 0 || ballY > canvas.height) {
        ballSpeedY = -ballSpeedY;
        currentColor = listOfColors[Math.floor(Math.random() * listOfColors.length)];
    }

    // Collision avec une raquette
    if ((ballX < paddleWidth && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) ||
        (ballX > canvas.width - paddleWidth && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight)) {
        ballSpeedX = -ballSpeedX;
        currentColor = listOfColors[Math.floor(Math.random() * listOfColors.length)];
    }

    // Si la balle touche le bord gauche
    if (ballX < 0) {
        rightPlayerScore++;
        resetBall();
    }

    // Si la balle touche le bord droit
    if (ballX > canvas.width) {
        leftPlayerScore++;
        resetBall();
    }

    // Update ball position
    ballX += ballSpeedX;
    ballY += ballSpeedY;


    rightPaddleY = ballY - paddleHeight / 2;

    // Limiter les mouvements de la raquette pour rester à l'intérieur du canvas
    rightPaddleY = Math.max(Math.min(rightPaddleY, canvas.height - paddleHeight), 0);
}
const resetBall = () => {
    if (ballSpeedX < 0) {
        ballX = canvas.width / 1.2;
    } else {
        ballX = canvas.width / 4;
    }

    ballY = canvas.height / 2;

    // Augmenter la vitesse de la balle en fonction des scores
    const speedIncrease = 0.2;
    const maxSpeed = 5;
    ballSpeedX += ballSpeedX > 0 ? Math.min(speedIncrease, maxSpeed - ballSpeedX) : -Math.min(speedIncrease, maxSpeed + ballSpeedX);
    ballSpeedY += ballSpeedY > 0 ? Math.min(speedIncrease, maxSpeed - ballSpeedY) : -Math.min(speedIncrease, maxSpeed + ballSpeedY);
}
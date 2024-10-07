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
let ballSpeedX = 3;
let ballSpeedY = 3;

let leftPlayerScore = 0;
let rightPlayerScore = 0;

let isMultiplayer = false; // Par défaut, le mode contre l'IA
const dvdLogo = new Image();

const listOfColors = ["#8cdf57", "#908160", "#5d9bee", "#99cc91", "#8c6697", "#30abc1", "#6b9d6e", "#6b9d6e", "#5f735a", "#6b7991", "#3fac8f", "#8c51b4", "#dea253", "#5e57d0", "#33ab5c", "#90cdc1"];
let currentColor = "#000";

let animationId = null;

let username = "";
let socket = null;
let gameState = "waiting"; // États possibles : "waiting", "playing", "finished"
let gameRole = null;

// Gérer le choix du mode de jeu
document.getElementById("vsIA").addEventListener("click", () => {
    startGame(false);
});

document.getElementById("multiplayer").addEventListener("click", () => {
    username = prompt("Entrez votre nom d'utilisateur :");
    if (username.trim() !== "") {
        startGame(true);
    }
});

// Démarrer le jeu en fonction du mode sélectionné
function startGame(multiplayer) {
    isMultiplayer = multiplayer;
    if(isMultiplayer) {
        connectToServer();
    } else
    {
        document.getElementById("menu").style.display = "none";
        canvas.style.display = "block";
        document.body.style.cursor = "none";
        document.addEventListener("mousemove", function (event) {
            const canvasPosition = canvas.getBoundingClientRect();
            leftPaddleY = event.clientY - canvasPosition.top - paddleHeight / 2;
        });

        dvdLogo.src = './DVD_logo.svg';
        dvdLogo.onload = function () {
            draw();
        };
    }
}

// Fonction pour gérer la connexion au serveur WebSocket (mode multijoueur)
function connectToServer() {
    socket = new WebSocket("ws://localhost:3000");

    socket.onopen = function () {
        console.log("Connecté au serveur WebSocket");
        socket.send(JSON.stringify({ type: "join", username: username }));
    };

    socket.onclose = function () {
        console.log("Déconnecté du serveur WebSocket");
    }

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === "waiting") {
            document.getElementById("waitingMessage").innerText = data.message;
            document.getElementById("waitingMessage").style.display = "block";
        } else if (data.type === "gameState") {
            gameState = data.state;
            if (gameState === "playing") {
                gameRole = data.role;
                // Commencer le jeu
                document.getElementById("waitingMessage").style.display = "none";
                document.getElementById("menu").style.display = "none";
                canvas.style.display = "block";

                dvdLogo.src = './DVD_logo.svg';
                dvdLogo.onload = function () {
                    draw();
                };

            } else if (gameState === "finished") {
                // Afficher le résultat de la partie
                alert(data.winner);
                resetGame();
                document.getElementById("menu").style.display = "flex";
            }
        }
    };

    document.addEventListener("mousemove", function (event) {
        const canvasPosition = canvas.getBoundingClientRect();
        leftPaddleY = event.clientY - canvasPosition.top - paddleHeight / 2;
        sendPosition();
    });

    function sendPosition() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "update", paddleY: leftPaddleY }));
        }
    }
}

function updateAI() {
    // L'IA suit la position de la balle
    if (ballY > rightPaddleY + paddleHeight / 2) {
        rightPaddleY += 5;
    } else {
        rightPaddleY -= 5;
    }
}

function resetBall() {
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

function draw() {
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
    ctx.filter = 'none';

    // Mettre à jour la position de la balle
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if(isMultiplayer && gameRole === "left")
    {
        // send pos of ball
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "update", ballX: ballX, ballY: ballY }));
        }
    }

    // Collision avec les murs haut et bas
    if (ballY < 0 || ballY > canvas.height) {
        ballSpeedY = -ballSpeedY;
        currentColor = listOfColors[Math.floor(Math.random() * listOfColors.length)];
    }

    // Collision avec une rauqette
    if ((ballX < paddleWidth && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) || (ballX > canvas.width - paddleWidth && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight)) {
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

    // Si on joue contre l'IA
    if (!isMultiplayer) updateAI();

    // Dessiner les scores (séparer le canvas en 3)
    ctx.font = "120px Arial";
    ctx.fillStyle = "white";

    // Mesurer la largeur des textes pour les centrer
    const leftScoreText = leftPlayerScore.toString();
    const rightScoreText = rightPlayerScore.toString();

    const leftTextWidth = ctx.measureText(leftScoreText).width;
    const rightTextWidth = ctx.measureText(rightScoreText).width;

    // Score du joueur gauche : bien centré dans la première zone (1/3 du canvas)
    const leftScoreX = (canvas.width / 3 - leftTextWidth / 2);
    ctx.fillText(leftScoreText, leftScoreX, 125);

    // Score du joueur droit : bien centré dans la troisième zone (2/3 du canvas)
    const rightScoreX = (2 * canvas.width / 3 - rightTextWidth / 2);
    ctx.fillText(rightScoreText, rightScoreX, 125);

    // Vérifier si un joueur a atteint 11 points
    if (leftPlayerScore === 11 || rightPlayerScore === 11) {
        const winner = (leftPlayerScore === 11) ? "Joueur de gauche" : "Joueur de droite";
        alert(`${winner} a gagné !`);

        // Réinitialiser les scores
        leftPlayerScore = 0;
        rightPlayerScore = 0;

        // Réinitialiser le game et afficher le menu
        resetGame();
        document.getElementById("menu").style.display = "flex";
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
}

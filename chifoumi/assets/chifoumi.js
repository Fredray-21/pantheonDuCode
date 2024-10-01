const buttons = document.querySelectorAll('#game button');
const resetBtn = document.getElementById('resetBtn');
const gameSection = document.getElementById('game');
const resultSection = document.getElementById('result');
const resultTextElement = document.getElementById('result-text');
const resultEmojiElement = document.getElementById('result-emoji');
const scoreTextElement = document.getElementById('score');

const score = { player: 0, computer: 0 };
const rules = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
};

const handleButtonClick = (button) => {
    const playerSelection = button.id;
    const computerSelection = Object.keys(rules)[Math.floor(Math.random() * Object.keys(rules).length)];
    const result = playRound(playerSelection, computerSelection);
    updateGameDisplay(result, playerSelection, computerSelection);
};

const updateGameDisplay = (result, playerSelection, computerSelection) => {
    resultTextElement.textContent = result;
    gameSection.style.display = 'none';
    resultSection.style.display = 'flex';

    updateScore(result);
    resultEmojiElement.textContent = `${textToEmoji(playerSelection)} vs ${textToEmoji(computerSelection)}`;
    scoreTextElement.textContent = `You: ${score.player} | Computer: ${score.computer}`;
};

const updateScore = (result) => {
    if (result === 'Vous avez gagné !') {
        score.player++;
    } else if (result === 'Vous avez perdu !') {
        score.computer++;
    }
};

const resetGame = () => {
    resultTextElement.textContent = '';
    gameSection.style.display = 'flex';
    resultSection.style.display = 'none';
};

const playRound = (player, computer) => {
    return player === computer
        ? 'Égalité'
        : rules[player] === computer
            ? 'Vous avez gagné !'
            : 'Vous avez perdu !';
};

const textToEmoji = (text) => {
    const emojis = {
        rock: '🪨',
        paper: '📄',
        scissors: '✂️️'
    };
    return emojis[text] || '';
};

buttons.forEach(button => {
    button.addEventListener('click', () => handleButtonClick(button));
});
resetBtn.addEventListener('click', resetGame);

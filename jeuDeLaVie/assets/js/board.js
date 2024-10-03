import { Cell } from './Cell.js';
import { update } from './game.js';
import { bToggleGame, templateMode } from './main.js';

export let board = [];
export let largeur = 100;
export let hauteur = 100;
export let gameRunning = false;
let monInterval;

// Create the board with cells
export const createBoard = () => {
    let tableau = document.createElement("table");
    document.body.querySelector("#root").appendChild(tableau);
    for (let i = 0; i < hauteur; i++) {
        board[i] = [];
        let row = document.createElement("tr");
        for (let j = 0; j < largeur; j++) {
            let cell = new Cell(i, j);
            board[i][j] = cell;
            row.appendChild(cell.element);
        }
        tableau.appendChild(row);
    }
}

// Start or stop the game
export const toggleGame = () => {
    if (!gameRunning) {
        monInterval = setInterval(update, 100);
        bToggleGame.value = "Stopper la génération";
        bToggleGame.style.backgroundColor = "red";
    } else {
        clearInterval(monInterval);
        bToggleGame.value = "Lancer la génération";
        bToggleGame.style.backgroundColor = "#43b643";
    }
    gameRunning = !gameRunning;
}

// Clear the board (reset all cells)
export const clearBoard = () => {
    board.forEach(row => row.forEach(cell => {
        cell.alive = 0;
        cell.updateColor();
    }));
}


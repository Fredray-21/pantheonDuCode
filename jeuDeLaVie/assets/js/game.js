import { board, hauteur, largeur } from './board.js';

export const update = () => {
    let nextState = board.map(row => row.map(cell => cell.alive));

    for (let i = 0; i < hauteur; i++) {
        for (let j = 0; j < largeur; j++) {
            let aliveNeighbors = countAliveNeighbors(i, j);
            if (board[i][j].alive === 1) {
                if (aliveNeighbors < 2 || aliveNeighbors > 3) {
                    nextState[i][j] = 0;
                }
            } else {
                if (aliveNeighbors === 3) {
                    nextState[i][j] = 1;
                }
            }
        }
    }

    for (let i = 0; i < hauteur; i++) {
        for (let j = 0; j < largeur; j++) {
            board[i][j].alive = nextState[i][j];
            board[i][j].updateColor();
        }
    }
}

const countAliveNeighbors = (i, j) => {
    let count = 0;
    for (let ni = i - 1; ni <= i + 1; ni++) {
        for (let nj = j - 1; nj <= j + 1; nj++) {
            if (ni >= 0 && nj >= 0 && ni < hauteur && nj < largeur && (ni !== i || nj !== j)) {
                count += board[ni][nj].alive;
            }
        }
    }
    return count;
}

import { board, hauteur, largeur } from './board.js';
import { currentTemplate } from './main.js';

export const canPlaceTemplate = (i, j) => {
    let matrix = currentTemplate.matrix;
    return i + matrix.length - 1 < hauteur && j + matrix[0].length - 1 < largeur;
}

// Preview the template in grey (on hover)
export const previewTemplate = (i, j, color) => {
    iterateTemplate(i, j, (cell) => {
        if (!cell.alive) {
            cell.element.style.backgroundColor = color || "white";
        }
    });
}

// Place the template on the board
export const placeTemplate = (i, j) =>{
    iterateTemplate(i, j, (cell) => {
        cell.alive = 1;
        cell.updateColor();
    });
}

// Function to iterate over the template matrix
const iterateTemplate = (i, j, cellAction) => {
    let matrix = currentTemplate.matrix;
    for (let si = 0; si < matrix.length; si++) {
        for (let sj = 0; sj < matrix[si].length; sj++) {
            if (matrix[si][sj] === 1) {
                let cell = board[i + si][j + sj];
                cellAction(cell);
            }
        }
    }
}

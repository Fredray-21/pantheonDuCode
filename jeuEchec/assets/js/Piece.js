export class Piece {
    constructor(type, color, row, col) {
        this.type = type;
        this.color = color;
        this.row = row;
        this.col = col;
        this.hasMoved = false; // Nouveau champ pour suivre si la pièce a déjà bougé
    }

    // Méthode pour obtenir le nom complet du type de pièce
    getPieceName() {
        const pieceNames = {
            p: "pawn",
            r: "rook",
            n: "knight",
            b: "bishop",
            q: "queen",
            k: "king"
        };
        return pieceNames[this.type];
    }

    // Méthode pour obtenir le chemin de l'image de la pièce
    getImagePath() {
        return `./assets/pieces/${this.getPieceName()}-${this.color}.png`;
    }

    // Mise à jour de la position et de l'état "hasMoved"
    updatePosition(row, col) {
        this.row = row;
        this.col = col;
        this.hasMoved = true; // Indiquer que la pièce a bougé
    }
}

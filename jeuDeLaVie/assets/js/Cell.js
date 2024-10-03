import { previewTemplate, canPlaceTemplate, placeTemplate } from './template.js';
import { templateMode} from './main.js';

export class Cell {
    constructor(i, j) {
        this.i = i;
        this.j = j;
        this.alive = 0;
        this.element = document.createElement("td");
        this.element.addEventListener("click", () => this.handleClick());
        this.element.addEventListener("mouseover", () => this.handleHover());
        this.element.addEventListener("mouseout", () => this.removeHover());
    }

    handleClick() {
        if (templateMode) {
            if (canPlaceTemplate(this.i, this.j)) {
                placeTemplate(this.i, this.j);
            }
        } else {
            this.toggleAlive();
        }
    }

    handleHover() {
        if (templateMode && canPlaceTemplate(this.i, this.j)) {
            previewTemplate(this.i, this.j, "gray");
        }
    }

    removeHover() {
        if (templateMode && canPlaceTemplate(this.i, this.j)) {
            previewTemplate(this.i, this.j, null);
        }
    }

    toggleAlive() {
        this.alive = this.alive ? 0 : 1;
        this.updateColor();
    }

    updateColor() {
        this.element.style.backgroundColor = this.alive ? "black" : "white";
    }
}

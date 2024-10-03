import {createBoard, toggleGame, clearBoard} from './board.js';
import {templates} from './templatesMap.js';

export let bToggleGame = document.getElementById("toggleGame");
let bClear = document.getElementById("clear");
let bUseTemplate = document.getElementById("useTemplate");
let bQuitTemplateMode = document.getElementById("quitTemplateMode");
let bCloseTemplateModal = document.getElementById("closeTemplateModal");

export let currentTemplate = templates[0];
export let templateMode = false;

createBoard();

bUseTemplate.addEventListener("click", () => {
    openTemplateModal();
});

bQuitTemplateMode.addEventListener("click", () => {
    templateMode = false;
    bQuitTemplateMode.style.display = "none";
});

bCloseTemplateModal.addEventListener("click", () => {
    closeTemplateModal();
});

// Add listeners for the game and board controls
bToggleGame.addEventListener("click", toggleGame);
bClear.addEventListener("click", clearBoard);

const openTemplateModal = () => {
    let modal = document.getElementById("templateModal");
    let templateList = document.getElementById("templateList");

    templateList.innerHTML = "";

    templates.forEach(template => {
        let button = document.createElement("button");
        button.innerText = template.name;
        button.addEventListener("click", () => {
            currentTemplate = template;
            templateMode = true;
            modal.style.display = "none";
            bQuitTemplateMode.style.display = "inline";
        });
        templateList.appendChild(button);
    });

    modal.style.display = "block";
}


const closeTemplateModal = () => {
    let modal = document.getElementById("templateModal");
    modal.style.display = "none";
}

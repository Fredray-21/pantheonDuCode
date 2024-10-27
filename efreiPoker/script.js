document.addEventListener("DOMContentLoaded", function () {
    const playerCountSelect = document.getElementById("player-count");
    const gameStageSelect = document.getElementById("game-stage");
    const pokerTable = document.getElementById("poker-table");
    const communityCardsContainer = document.getElementById("community-cards");
    const cardModal = document.getElementById("card-modal");
    const deckContainer = document.getElementById("deck");
    const closeModal = document.querySelector(".close");

    const calculateProbabilitiesBtn = document.getElementById("calculateProbabilities");

    let playersHands = [];
    let communityCards = Array(5).fill(null); // Tableau pour stocker les cartes communes
    let deck = createDeck();

    const valueToDisplay = (value) => {
        return value.replace(/[HDSC]/g, match => {
            switch (match) {
                case 'H': return '♥';
                case 'D': return '♦';
                case 'C': return '♣';
                case 'S': return '♠';
            }
        });
    };

    const displayToValue = (display) => {
        return display.replace(/[♥♦♣♠]/g, match => {
            switch (match) {
                case '♥': return 'H';
                case '♦': return 'D';
                case '♣': return 'C';
                case '♠': return 'S';
            }
        });
    };

    const isCardInUse = (card) => {
        return playersHands.some(hand => hand.includes(card)) || communityCards.includes(card);
    };

    const updateTable = () => {
        const playerCount = parseInt(playerCountSelect.value);
        const savedPlayerHands = [...playersHands];

        // Effacer les joueurs actuels
        const existingPlayers = pokerTable.querySelectorAll(".player");
        existingPlayers.forEach(player => player.remove());

        playersHands = Array.from({ length: playerCount }, (_, i) => savedPlayerHands[i] || [null, null]);

        // Placement des joueurs autour de la table
        const playerLabels = ["Moi", ...Array.from({ length: playerCount - 1 }, (_, i) => `Player ${i + 2}`)];
        const radius = 230;
        const baseAngle = 90;
        const angleStep = 360 / playerCount;

        for (let i = 0; i < playerCount; i++) {
            const playerDiv = document.createElement("div");
            playerDiv.className = "player";
            playerDiv.setAttribute("data-player-id", i);

            const angle = baseAngle + angleStep * i;
            const x = radius * Math.cos((angle * Math.PI) / 180) + 240;
            const y = radius * Math.sin((angle * Math.PI) / 180) + 240;

            playerDiv.style.left = `${x}px`;
            playerDiv.style.top = `${y}px`;

            const label = document.createElement("span");
            label.className = "player-label";
            label.textContent = playerLabels[i];
            playerDiv.appendChild(label);

            const cardContainer = document.createElement("div");
            cardContainer.className = "card-container";

            const card1 = document.createElement("div");
            card1.className = "card";
            card1.addEventListener("click", () => openModal(playerDiv, 0));

            const card2 = document.createElement("div");
            card2.className = "card";
            card2.addEventListener("click", () => openModal(playerDiv, 1));

            if (savedPlayerHands[i]) {
                if (savedPlayerHands[i][0]) {
                    card1.textContent = valueToDisplay(savedPlayerHands[i][0]);
                    card1.style.color = savedPlayerHands[i][0].includes('H') || savedPlayerHands[i][0].includes('D') ? 'red' : 'black';
                }
                if (savedPlayerHands[i][1]) {
                    card2.textContent = valueToDisplay(savedPlayerHands[i][1]);
                    card2.style.color = savedPlayerHands[i][1].includes('H') || savedPlayerHands[i][1].includes('D') ? 'red' : 'black';
                }
            }

            cardContainer.appendChild(card1);
            cardContainer.appendChild(card2);
            playerDiv.appendChild(cardContainer);
            pokerTable.appendChild(playerDiv);
        }
    };

    const updateCommunityCards = () => {
        const stage = gameStageSelect.value;
        const cardCount = { preflop: 0, flop: 3, turn: 4, river: 5 }[stage];

        const existingCards = communityCardsContainer.querySelectorAll(".card");
        existingCards.forEach(card => card.classList.add("hidden"));
        existingCards.forEach(card => card.innerText = "");
        existingCards.forEach(card => card.replaceWith(card.cloneNode(true)));

        for (let i = 0; i < cardCount; i++) {
            const card = communityCardsContainer.querySelector(`.card${i + 1}`);
            card.classList.remove("hidden");
            card.addEventListener("click", () => openCommunityCardModal(i));

            if (communityCards[i]) {
                card.textContent = valueToDisplay(communityCards[i]);
                card.style.color = communityCards[i].includes('H') || communityCards[i].includes('D') ? 'red' : 'black';
            }
        }

        communityCards = communityCards.slice(0, cardCount);
    };

    const openModal = (playerDiv, cardIndex) => {
        const playerId = parseInt(playerDiv.getAttribute("data-player-id"));
        deckContainer.innerHTML = '';

        deck.forEach(card => {
            const cardElement = document.createElement("div");
            cardElement.textContent = valueToDisplay(card);
            if (isCardInUse(card)) cardElement.classList.add('card-disabled');
            cardElement.classList.add('deck-card');

            cardElement.addEventListener('click', () => {
                if (isCardInUse(card)) {
                    alert("Cette carte a déjà été sélectionnée.");
                    return;
                }

                playersHands[playerId][cardIndex] = card;
                playerDiv.querySelectorAll('.card')[cardIndex].textContent = valueToDisplay(card);
                playerDiv.querySelectorAll('.card')[cardIndex].style.color = card.includes('H') || card.includes('D') ? 'red' : 'black';

                closeModal.click();
            });

            deckContainer.appendChild(cardElement);
        });
        cardModal.classList.remove("hidden-modal");

        window.onclick = function(event) {
            if (event.target == cardModal) {
                closeModal.click();
            }
        }
    };

    const openCommunityCardModal = (cardIndex) => {
        deckContainer.innerHTML = '';

        deck.forEach(card => {
            const cardElement = document.createElement("div");
            cardElement.textContent = valueToDisplay(card);
            if (isCardInUse(card)) cardElement.classList.add('card-disabled');
            cardElement.classList.add('deck-card');

            cardElement.addEventListener('click', () => {
                if (isCardInUse(card)) {
                    alert("Cette carte a déjà été sélectionnée.");
                    return;
                }

                communityCards[cardIndex] = card;
                const communityCard = communityCardsContainer.querySelector(`.card${cardIndex + 1}`);
                communityCard.textContent = valueToDisplay(card);
                communityCard.style.color = card.includes('H') || card.includes('D') ? 'red' : 'black';

                closeModal.click();
            });

            deckContainer.appendChild(cardElement);
        });
        cardModal.classList.remove("hidden-modal");
    };

    const closeCardModal = () => {
        cardModal.classList.add("hidden-modal");
    };

    closeModal.addEventListener("click", closeCardModal);
    playerCountSelect.addEventListener('change', updateTable);
    gameStageSelect.addEventListener('change', updateCommunityCards);

    updateTable();
    updateCommunityCards();

    const createDeck = () => {
        const suits = ['H', 'D', 'C', 'S'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        return suits.flatMap(suit => ranks.map(rank => rank + suit));
    }

});

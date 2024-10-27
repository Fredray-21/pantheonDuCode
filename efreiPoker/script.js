const card1Input = document.getElementById('card1');
const card2Input = document.getElementById('card2');
const numPlayersInput = document.getElementById('numPlayers');
const calculateButton = document.getElementById('calculate');
const resultPreflop = document.getElementById('preflop');
const resultFlop = document.getElementById('flop');
const resultTurn = document.getElementById('turn');
const resultRiver = document.getElementById('river');
const resultTitle = document.querySelector('#result h2');

// On init un deck de cartes de 52 cartes
const createDeck = () => {
    const suits = ['H', 'D', 'C', 'S']; // Coeurs, Carreaux, Trèfles, Piques
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

    return suits.flatMap(suit =>
        ranks.map(rank => rank + suit)
    );
}

// Pour retirer une carte du deck
const removeCardFromDeck = (deck, card) => {
    const index = deck.indexOf(card);
    if (index > -1) deck.splice(index, 1);
}

// On Setup le jeu 52 cartes - 2 cartes du joueur
const setupGame = () => {
    const card1 = card1Input.value.toUpperCase();
    const card2 = card2Input.value.toUpperCase();
    const numPlayers = parseInt(numPlayersInput.value);

    // On crée un deck de 52 cartes et on retire les cartes du joueur (-2)
    let deck = createDeck();
    removeCardFromDeck(deck, card1);
    removeCardFromDeck(deck, card2);

    return { card1, card2, numPlayers, deck };
}

// On tire une carte du deck au hasard
const drawCard = (deck) => deck.splice(Math.floor(Math.random() * deck.length), 1)[0];

// On mélange le deck
const shuffle = (array) => array.sort(() => Math.random() - 0.5);

// On simule un tour de jeu
const simulateRound = (card1, card2, numPlayers, deck) => {
    // Pour chaque tour de jeu, on mélange le deck
    let shuffledDeck = shuffle([...deck]);

    // Normalement c'est déjà fait mais on retire les cartes du joueur
    shuffledDeck = shuffledDeck.filter(card => card !== card1 && card !== card2);

    // On distribue les cartes aux adversaires
    let opponentsHands = [];
    for (let i = 0; i < numPlayers; i++) {
        opponentsHands.push([shuffledDeck.pop(), shuffledDeck.pop()]);
    }

    // Distribution des cartes du flop, turn, et river
    const flop = [shuffledDeck.pop(), shuffledDeck.pop(), shuffledDeck.pop()];
    const turn = shuffledDeck.pop();
    const river = shuffledDeck.pop();

    return { flop, turn, river, opponentsHands };
}

// Évaluer les probabilités préflop en fonction de la force de la main 
const evaluatePreflopStrength = (card1, card2) => {
    const valueOrder = "23456789TJQKA";
    const value1 = valueOrder.indexOf(card1[0]);
    const value2 = valueOrder.indexOf(card2[0]);
    // on a converti les valeurs en index pour les comparer

    if (value1 === value2) {
        // Paire (forte mais non imbattable)
        return value1 + 10 + (card1[1] === card2[1] ? 1 : 0); // Bonus de paire (10) et de couleur (1|0)
    } else if (Math.abs(value1 - value2) === 1) { // si la différence est de 1 alors on a une suite entre les 2 cartes (connecteurs)
        return Math.max(value1, value2) + (card1[1] === card2[1] ? 2 : 1); // Connecteurs avec bonus si de la même couleur
    } else {
        // Cartes déconnectées donc on prend la plus forte
        return Math.max(value1, value2);
    }
}

// On calcule les probabilités (préflop, flop, turn, river) pour une main sur un nombre de rounds par défaut de 50 000
const calculateProbabilities = (card1, card2, numPlayers, deck, rounds = 50000) => {
    let preflopWins = 0;
    let flopWins = 0;
    let turnWins = 0;
    let riverWins = 0;

    for (let i = 0; i < rounds; i++) {
        const { flop, turn, river, opponentsHands } = simulateRound(card1, card2, numPlayers, deck);

        // Calculs spécifiques pour le préflop
        if (isWinningHandPreflop([card1, card2], opponentsHands)) preflopWins++;

        // Calculs habituels pour flop, turn, river
        if (isWinningHand([card1, card2], flop, opponentsHands)) flopWins++;
        if (isWinningHand([card1, card2], [...flop, turn], opponentsHands)) turnWins++;
        if (isWinningHand([card1, card2], [...flop, turn, river], opponentsHands)) riverWins++;
    }

    return {
        preflop: (preflopWins / rounds) * 100,
        flop: (flopWins / rounds) * 100,
        turn: (turnWins / rounds) * 100,
        river: (riverWins / rounds) * 100,
    };
}


// Une petite fonction pour obtenir les valeurs et les couleurs des cartes
const getCardValuesAndSuits = (hand) =>{
    const values = hand.map(card => card[0]);
    const suits = hand.map(card => card[1]);
    return { values, suits };
}

// On trie les valeurs des cartes pour les comparer
// on convertit les valeurs en index pour les comparer et on les trie
const valueOrder = "23456789TJQKA"
const getSortedHandValues = (values) => {
    return values.map(value => valueOrder.indexOf(value)).sort((a, b) => a - b);
}

// On regarde si c'est une paire (1 paire de cartes de la même valeur)
const isPair = (values) => {
    // on compte par valeur
    const counts = values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    // on filtre pour garder que les paires et on regarde si on a 1 paire
    return Object.values(counts).filter(count => count === 2).length === 1;
}

// On regarde si c'est une double paire (parreil que la paire mais on regarde si on a 2 paires)
function isTwoPair(values) {
    // on compte par valeur
    const counts = values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    // on filter pour garder que les paires et on regarde si on a 2 paires
    return Object.values(counts).filter(count => count === 2).length === 2;
}

// On regarde si c'est un brelan (3 cartes de la même valeur)
const isThreeOfAKind = (values) => {
    // on compte par valeur
    const counts = values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    // on regarde si on a 3 same
    return Object.values(counts).includes(3);
}

// On regarde si c'est une suite
const isStraight = (values) => {
    const sortedValues = getSortedHandValues(values);
    for (let i = 1; i < sortedValues.length; i++) {
        if (sortedValues[i] !== sortedValues[i - 1] + 1) {
            return false;
        }
    }
    return true;
}

// on regarde si c'est une couleur (Set supprime les doublons)
const isFlush = (suits) => new Set(suits).size === 1;

// On regarde si c'est un full (3 cartes de la même valeur et 2 cartes de la même valeur)
const isFullHouse = (values) => {
    // on compte chaque valeurs
    const counts = values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    // on regarde si on a 3 et 2
    return Object.values(counts).includes(3) && Object.values(counts).includes(2);
}

// On regarde si c'est un carré (4 cartes de la même valeur)
const isFourOfAKind = (values) => {
    // On compte le nombre de fois que chaque valeur apparaît
    const counts = values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    // si une valeur est 4 fois alors on a un carré
    return Object.values(counts).includes(4);
}

// On regarde si c'est une quinte flush (si c'est une suite et une couleur)
const isStraightFlush = (values, suits) => {
    return isStraight(values) && isFlush(suits);
}

// On regarde si c'est une quinte flush royale (si c'est une suite et une couleur et que la première carte est un 10 et la dernière un As) (TJQKA)
const isRoyalFlush = (values, suits) => {
    const sortedValues = getSortedHandValues(values);
    return isStraightFlush(values, suits) && sortedValues[0] === valueOrder.indexOf("T") && sortedValues[4] === valueOrder.indexOf("A");
}

// Fonction pour attribuer un score de classement à une main
const getHandRank = (hand) => {
    const { values, suits } = getCardValuesAndSuits(hand);

    if (isRoyalFlush(values, suits)) return 10;
    if (isStraightFlush(values, suits)) return 9;
    if (isFourOfAKind(values)) return 8;
    if (isFullHouse(values)) return 7;
    if (isFlush(suits)) return 6;
    if (isStraight(values)) return 5;
    if (isThreeOfAKind(values)) return 4;
    if (isTwoPair(values)) return 3;
    if (isPair(values)) return 2;
    return 1; // High Card
}

// Fonction pour évaluer la main du joueur contre les adversaires
const isWinningHand = (playerHand, communityCards, opponentsHands) => {
    const playerFullHand = [...playerHand, ...communityCards];
    const playerRank = getHandRank(playerFullHand);

    for (let opponentHand of opponentsHands) {
        const opponentFullHand = [...opponentHand, ...communityCards];
        const opponentRank = getHandRank(opponentFullHand);

        // on compare si la main de l'adversaire est meilleure
        if (opponentRank > playerRank) return false;
    }

    // ici on a des rangs === donc on compare les valeurs des cartes
    for (let opponentHand of opponentsHands) {
        const opponentFullHand = [...opponentHand, ...communityCards];
        const opponentSorted = getSortedHandValues(opponentFullHand);
        const playerSorted = getSortedHandValues(playerFullHand);

        // On regarde si le joueur a une meilleure carte
        const isPlayerBetter = playerSorted.some((value, index) => value > opponentSorted[index]);

        // Adversaire a une meilleure carte
        if (!isPlayerBetter && opponentSorted.some((value, index) => value > playerSorted[index])) return false;
    }

    // sinon le joueur a la meilleure main
    return true;
}

// Fonction pour évaluer la main du joueur contre les adversaires au préflop
const isWinningHandPreflop = (playerHand, opponentsHands) => {
    const playerPreflopScore = evaluatePreflopStrength(playerHand[0], playerHand[1]);

    for (let opponentHand of opponentsHands) {
        const opponentPreflopScore = evaluatePreflopStrength(opponentHand[0], opponentHand[1]);

        // Si l'adversaire a une main égale ou supérieure, le joueur ne gagne pas le préflop
        if (opponentPreflopScore >= playerPreflopScore) {
            return false;
        }
    }
    // Le joueur a la meilleure main préflop
    return true; 
}


// Action Event pour calculé les probabilités
calculateButton.addEventListener('click', async () => {

    // vérification des inputs
    if (!card1Input.value || !card2Input.value || !numPlayersInput.value) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    await new Promise(resolve => {
        calculateButton.innerText = 'Calcul en cours...';
        setTimeout(resolve, 1000)
    });

    const { card1, card2, numPlayers, deck } = setupGame();
    const probabilities = calculateProbabilities(card1, card2, numPlayers, deck);

    resultTitle.style.display = 'block';
    resultPreflop.textContent = `Préflop: ${probabilities.preflop.toFixed(2)}%`;
    resultFlop.textContent = `Flop: ${probabilities.flop.toFixed(2)}%`;
    resultTurn.textContent = `Turn: ${probabilities.turn.toFixed(2)}%`;
    resultRiver.textContent = `River: ${probabilities.river.toFixed(2)}%`;

    await new Promise(resolve => {
        calculateButton.innerText = 'Calculer les Probabilités sur 50 000 rounds';
        setTimeout(resolve, 1000)
    });
});

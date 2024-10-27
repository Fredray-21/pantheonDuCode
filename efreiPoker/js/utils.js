// On trie les valeurs des cartes pour les comparer
// on convertit les valeurs en index pour les comparer et on les trie
const valueOrder = "23456789TJQKA";
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
const isTwoPair = (values) => {
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

// Modification de isFlush pour vérifier s'il y a au moins 5 cartes de la même couleur
const isFlush = (suits) => {
    const suitCounts = suits.reduce((acc, suit) => {
        acc[suit] = (acc[suit] || 0) + 1;
        return acc;
    }, {});
    return Object.values(suitCounts).some(count => count >= 5);
};


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
    const counts = values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    const sortedValues = getSortedHandValues(values);
    const isFlush = Object.values(counts).some(count => count >= 5);
    if (!isFlush) return false;
    for (let i = 1; i < sortedValues.length; i++) {
        if (sortedValues[i] !== sortedValues[i - 1] + 1) {
            return false;
        }
    }
    return true;
}


// On regarde si c'est une quinte flush royale (si c'est une suite et une couleur et que la première carte est un 10 et la dernière un As) (TJQKA)
const isRoyalFlush = (values, suits) => {
    if (values.length !== 5 || suits.length !== 5) return false;
    const sortedValues = getSortedHandValues(values);
    return isStraightFlush(values, suits) && sortedValues[0] === valueOrder.indexOf("T") && sortedValues[4] === valueOrder.indexOf("A");
}


// Une petite fonction pour obtenir les valeurs et les couleurs des cartes
const extractValuesAndSuits = (hand) => {
    const values = hand.map(card => card[0]);
    const suits = hand.map(card => card[1]);
    return {values, suits};
}


const handLevel = Object.freeze({
    RoyalFlush: 0,
    StraightFlush: 1,
    FourOfAKind: 2,
    FullHouse: 3,
    Flush: 4,
    Straight: 5,
    ThreeOfAKind: 6,
    TwoPair: 7,
    OnePair: 8,
    HighCard: 9
});

const getHandName = (level) => {
    return Object.keys(handLevel).find(key => handLevel[key] === level) || "Unknown Hand Level";
};


// Cette fonction détermine la meilleure main possible à partir des valeurs et des couleurs
const getBestHand = (values, suits) => {
    if (isRoyalFlush(values, suits)) return handLevel.RoyalFlush;
    if (isStraightFlush(values, suits)) return handLevel.StraightFlush;
    if (isFourOfAKind(values)) return handLevel.FourOfAKind;
    if (isFullHouse(values)) return handLevel.FullHouse;
    if (isFlush(suits)) return handLevel.Flush;
    if (isStraight(values)) return handLevel.Straight;
    if (isThreeOfAKind(values)) return handLevel.ThreeOfAKind;
    if (isTwoPair(values)) return handLevel.TwoPair;
    if (isPair(values)) return handLevel.OnePair;
    return handLevel.HighCard;
}


const shuffle = (array) => array.sort(() => Math.random() - 0.5);


export const simulateGames = (playerHand, opponentsHands, communityCardsForSimu, tableState, rounds = 100000) => {
    const ranks = {
        RoyalFlush: 0,
        StraightFlush: 0,
        FourOfAKind: 0,
        FullHouse: 0,
        Flush: 0,
        Straight: 0,
        ThreeOfAKind: 0,
        TwoPair: 0,
        OnePair: 0,
        HighCard: 0
    };

    let playerWinCount = 0;

    for (let i = 0; i < rounds; i++) {
        const deck = shuffle(createDeck());
        const usedCards = [...playerHand, ...opponentsHands.flat(), ...communityCardsForSimu].filter(card => card !== null);
        const deckWithoutUsedCards = deck.filter(card => !usedCards.includes(card));

        // Remplissage des mains adverses si nécessaire
        const opponentsHandsSimu = opponentsHands.map(hand => {
            if (hand.includes(null)) {
                const cardsToDraw = 2 - hand.filter(card => card !== null).length;
                const drawnCards = drawCards(deckWithoutUsedCards, cardsToDraw);
                return hand.map(card => card !== null ? card : drawnCards.shift());
            }
            return hand;
        });

        // Complétion des cartes communautaires
        let allCommunityCards = [
            ...communityCardsForSimu,
            ...drawCards(deckWithoutUsedCards, 5 - communityCardsForSimu.filter(card => card !== null).length)
        ];

        // Extraction des valeurs et couleurs pour la main du joueur
        const {values: valuesMe, suits: suitsMe} = extractValuesAndSuits([...playerHand, ...allCommunityCards]);
        const playerHandStrength = getBestHand(valuesMe, suitsMe);

        // Mise à jour du type de main du joueur pour cette simulation
        ranks[getHandName(playerHandStrength)]++;

        // Comparaison avec les mains des adversaires
        let playerWon = true;
        for (const opponentHand of opponentsHandsSimu) {
            const {
                values: valuesOpponent,
                suits: suitsOpponent
            } = extractValuesAndSuits([...opponentHand, ...allCommunityCards]);
            const opponentHandStrength = getBestHand(valuesOpponent, suitsOpponent);

            // Si l’adversaire a une meilleure main
            if (opponentHandStrength < playerHandStrength) {
                playerWon = false;
                break;
            }
        }

        // Mise à jour du compteur de victoires si le joueur gagne
        if (playerWon) playerWinCount++;
    }

    // Conversion des victoires en pourcentages
    for (const rank in ranks) {
        ranks[rank] = (ranks[rank] / rounds) * 100;
    }

    const playerWinPercentage = (playerWinCount / rounds) * 100;

    const otherPlayersWinPercentage = 100 - playerWinPercentage;

    return {ranks, playerWinPercentage, otherPlayersWinPercentage};
}


const createDeck = () => {
    const suits = ['H', 'D', 'C', 'S'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    return suits.flatMap(suit => ranks.map(rank => rank + suit));
}

// Fonction pour tirer des cartes du deck
function drawCards(deck, count) {
    const drawnCards = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        drawnCards.push(deck[randomIndex]);
        deck.splice(randomIndex, 1); // Retirer la carte du deck
    }
    return drawnCards;
}


const map = L.map('map');
const loader = document.getElementById('loader');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

map.setView([48.7884348, 2.3640516], 11);

const graph = {};
const nodeCoords = {};

// On va get les routes et les nœuds
const getRoadsAndNodes = async (lat, lon) => {
    // 7,4 km entre Villejuif et Anthony
    // donc 74000m pour trouver une zone en commun on prend la moitié
    // 74000 / 2 = 37000
    const query = `
        [out:json];
        (
            node["highway"](around:3700, ${lat}, ${lon});
            way["highway"](around:3700, ${lat}, ${lon});
        );
        out body;
        >;
        out skel qt;
        `;
    try {
        const response = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        console.log("Routes récupérées :", response.data);
        loader.innerHTML = "Recherche du chemin le plus court entre Villejuif et Anthony...";
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération des routes :", error);
        return null;
    }
}

// On build un graph
const buildGraph = (data) => {
    if (!data || !data.elements) return;

    data.elements.forEach(element => {
        if (element.type === 'way') {
            // Crée un tableau de nœuds en préfixant chaque ID de nœud avec "node-"
            let nodes = element.nodes.map(nodeId => `node-${nodeId}`);
            let length = nodes.length;

            // On va faire le graphe en double sens
            // On va donc ajouter une arête entre chaque nœud et le suivant
            nodes.forEach((node, i) => {
                // Si le node existe pas on le crée (init)
                if (!graph[node]) {
                    graph[node] = {};
                }

                // Si c'est pas le dernier node on rajoute une arête entre le node et le suivant (dans les 2 sens)
                if (i < nodes.length - 1) {
                    graph[node][nodes[i + 1]] = length;
                    if (!graph[nodes[i + 1]]) {
                        // on init le node suivant
                        graph[nodes[i + 1]] = {};
                    }
                    graph[nodes[i + 1]][node] = length; // On rajoute l'arête dans l'autre sens
                }
            });
        }
        // Si l'élément est de type "node" (nœud)
        else if (element.type === 'node') {
            const nodeKey = `node-${element.id}`;
            // On ajoute les coordonnées du node
            if (element.lat !== undefined && element.lon !== undefined) nodeCoords[nodeKey] = [element.lat, element.lon];
        }
    });
}

// Distance euclidienne entre deux nœuds
const euclideanDistance = (node1, node2) => {
    const [lat1, lon1] = nodeCoords[node1] || [];
    const [lat2, lon2] = nodeCoords[node2] || [];
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return Infinity;
    // C'est fou wikipedia quand meme :  https://fr.wikipedia.org/wiki/Distance_euclidienne#Deux_dimensions
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
}

// On cherche le noeud le plus proche de la position donnée
const findClosestNode = (lat, lon) => {
    let closestNode = null;
    let minDistance = Infinity;

    for (const node in nodeCoords) {
        // Lat et Lon du node
        const [nodeLat, nodeLon] = nodeCoords[node];
        // distance euclidienne
        const distance = Math.sqrt(Math.pow(lon - nodeLon, 2) + Math.pow(lat - nodeLat, 2)); // Distance euclidienne

        // On get le noeud le plus proche (distance la plus petite)
        if (distance < minDistance) {
            minDistance = distance;
            closestNode = node;
        }
    }

    return closestNode;
}

// A*, mon pote faut reflechir c'était piouf :skull:
const aStar = (start, end) => {
    const openSet = [start]; // Ensemble des nœuds à explorer, initialisé avec le nœud de départ
    const closedSet = new Set(); // Ensemble des nœuds déjà explorés
    const cameFrom = {}; // Dictionnaire pour retracer le chemin
    const gScore = {}; // Coût pour atteindre chaque nœud à partir du nœud de départ
    const fScore = {}; // Estimation du coût total pour atteindre le nœud de fin à partir du nœud de départ

    // Init des scores g / f
    for (const node in graph) {
        gScore[node] = Infinity;
        fScore[node] = Infinity;
    }

    gScore[start] = 0; // cout pour arrivé au nœud de départ c 0
    fScore[start] = euclideanDistance(start, end); // cout total pour arrivé au node de fin

    console.time("A*");

    // A*
    while (openSet.length > 0) {
        let currentIndex = 0; // idx current node

        // On cherche le node avec le score f le plus bas
        for (let i = 1; i < openSet.length; i++) {
            if (fScore[openSet[i]] < fScore[openSet[currentIndex]]) currentIndex = i;
        }
        const current = openSet[currentIndex]; // current node avec le f le + bas

        // Si c'est le node de fin alors on a trouvé le chemin
        if (current === end) {
            console.log("Chemin trouvé !");
            reconstructPath(cameFrom, current); // rebuild du path
            return;
        }

        // on retire le current node
        // et on l'ajoute dans les nodes déja explorés
        openSet.splice(currentIndex, 1);
        closedSet.add(current);

        // on verifie les voisins
        for (const neighbor in graph[current]) {
            // on skip les nodes déja explorés
            if (closedSet.has(neighbor)) continue;

            // on calcule le score g temporaire pour le voisin
            const tentativeGScore = gScore[current] + graph[current][neighbor];

            // On ajoute le voisin dans les nodes à explorer
            if (!openSet.includes(neighbor)) openSet.push(neighbor);

            // Si le score g temp est plus petit que le score g du voisin
            if (tentativeGScore < gScore[neighbor]) {
                // on update les score g / f
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + euclideanDistance(neighbor, end);

                // on dessine la ligne entre le current node et le voisin
                // bon j'ai mit en commentaire car c'est pas très joli
                // drawLine(current, neighbor, 'blue');
            }
        }
    }

    console.log("Aucun chemin trouvé !");
}

// On dessine une ligne entre deux nœuds
const drawLine = (from, to, color) => {
    const fromCoords = nodeCoords[from];
    const toCoords = nodeCoords[to];

    fromCoords && toCoords && L.polyline([fromCoords, toCoords], {color: color, weight: 2}).addTo(map);
}

const reconstructPath = (cameFrom, current) => {
    const totalPath = [current];
    while (cameFrom[current]) {
        current = cameFrom[current]; // next node
        totalPath.unshift(current);
        drawLine(current, totalPath[1], 'red');
    }

    console.log("Chemin total :", totalPath);
    console.timeEnd("A*");
    loader.style.display = "none";
    map.fitBounds(totalPath.map(node => nodeCoords[node]));
};

// Fonction pour exécuter la récupération des routes et démarrer A*
const initialize = async () => {
    try {
        // Villejuif    : 48.7884348, 2.3640516
        // Anthony      : 48.753689424, 2.295682344
        const startCoords = [48.7884348, 2.3640516];
        const endCoords = [48.753689424, 2.295682344];

        loader.innerText = "Récupération des routes...";

        // On change les routes et les nodes
        const [lilleData, marseilleData] = await Promise.all([
            getRoadsAndNodes(startCoords[0], startCoords[1]),
            getRoadsAndNodes(endCoords[0], endCoords[1])
        ]);

        // On build le graph
        buildGraph(lilleData);
        buildGraph(marseilleData);

        const startNode = findClosestNode(startCoords[0], startCoords[1]);
        const endNode = findClosestNode(endCoords[0], endCoords[1]);

        console.log("Nœud de départ :", startNode);
        console.log("Nœud d'arrivée :", endNode);

        // A* si on a les 2 nodes
        if (startNode && endNode) {
            aStar(startNode, endNode);
        } else {
            console.error("Nœud de départ ou d'arrivée non trouvé !");
            loader.innerText = "Nœud de départ ou d'arrivée non trouvé !";
        }

    } catch (error) {
        console.error("Erreur lors de l'initialisation :", error);
    }
}

// Démarrer le processus
initialize().then(() => console.log("Initialisation terminée !"));
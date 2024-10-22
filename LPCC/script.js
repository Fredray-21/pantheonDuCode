const map = L.map('map');
const loader = document.getElementById('loader');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

map.setView([48.7884348, 2.3640516], 11);

const graph = {};
const nodeCoords = {};
let startCoords = null;
let endCoords = null;
let startMarker = null;
let endMarker = null;
let startCircle = null;

// On va get les routes et les nœuds
const getRoadsAndNodes = async (lat, lon, radius = 3700) => {
    // 7,4 km entre Villejuif et Anthony
    // donc 74000m pour trouver une zone en commun on prend la moitié
    // 74000 / 2 = 37000
    // Bon du coup meme logique mais on donne le radius
    const query = `
        [out:json];
        (
            node["highway"](around:${radius+2000}, ${lat}, ${lon});
            way["highway"](around:${radius+2000}, ${lat}, ${lon});
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        const response = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        console.log(`Données récupérées avec un rayon de ${radius} mètres :`, response.data);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération des routes :", error);
        return null;
    }
};

// On build un graph avec les priorités des routes
// logique c'est mieux si y'a l'autoroute
const buildGraph = (data) => {
    if (!data || !data.elements) return;

    const roadPriority = {
        'motorway': 1,
        'trunk': 1.5,
        'primary': 2,
        'secondary': 3,
        'residential': 5,
    };

    data.elements.forEach(element => {
        if (element.type === 'way') {
            // Crée un tableau de nœuds en préfixant chaque ID de nœud avec "node-"
            let nodes = element.nodes.map(nodeId => `node-${nodeId}`);
            let length = nodes.length;
            let weight = roadPriority[element.tags?.highway] || 10; // en fonction du type de route

            // On va faire le graphe en double sens
            // On va donc ajouter une arête entre chaque nœud et le suivant
            nodes.forEach((node, i) => {
                // Si le node existe pas on le crée (init)
                if (!graph[node]) {
                    graph[node] = {};
                }

                // Si c'est pas le dernier node on rajoute une arête entre le node et le suivant (dans les 2 sens)
                if (i < nodes.length - 1) {
                    graph[node][nodes[i + 1]] = length * weight;
                    if (!graph[nodes[i + 1]]) {
                        // on init le node suivant
                        graph[nodes[i + 1]] = {};
                    }
                    graph[nodes[i + 1]][node] = length * weight; // On rajoute l'arête dans l'autre sens
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
};


// Calcul de la distance haversineDistance
// https://fr.wikipedia.org/wiki/Formule_de_haversine#:~:text=Afin%20d'obtenir%20la%20formule,est%20le%20d%2FR%20recherch%C3%A9.

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Rayon de la Terre en m
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const haversineDistance = (node1, node2) => {
    const [lat1, lon1] = nodeCoords[node1];
    const [lat2, lon2] = nodeCoords[node2];

    return calculateDistance(lat1, lon1, lat2, lon2);
};

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

// Fonction pour calculer la direction cardinale entre deux nœuds
// comme ça on peux filter les node en fonction de la direction
const getDirection = (fromNode, toNode) => {
    const [lat1, lon1] = nodeCoords[fromNode];
    const [lat2, lon2] = nodeCoords[toNode];
    const latDiff = lat2 - lat1;
    const lonDiff = lon2 - lon1;

    if (Math.abs(latDiff) > Math.abs(lonDiff)) {
        return latDiff > 0 ? 'N' : 'S';
    } else {
        return lonDiff > 0 ? 'E' : 'W';
    }
};

// Filtrer les voisins en fonction des directions cardinales
const filterNeighbors = (current, neighbors) => {
    const validDirections = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'];
    return neighbors.filter(neighbor => {
        const direction = getDirection(current, neighbor);
        return validDirections.includes(direction);
    });
};

// A*, mon pote faut reflechir c'était piouf :skull:
// rajout des poids pour les routes
const aStar = (start, end) => {
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    for (const node in graph) {
        gScore[node] = Infinity;
        fScore[node] = Infinity;
    }

    gScore[start] = 0;
    fScore[start] = haversineDistance(start, end);

    console.log("Nœud de départ :", gScore[start],fScore[start]);

    console.time("A*");

    while (openSet.length > 0) {
        let currentIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (fScore[openSet[i]] < fScore[openSet[currentIndex]]) currentIndex = i;
        }
        const current = openSet[currentIndex];

        if (current === end) {
            console.log("Chemin trouvé !");
            reconstructPath(cameFrom, current);
            return;
        }

        openSet.splice(currentIndex, 1);
        closedSet.add(current);

        if(!graph[current]) continue;

        let neighbors = Object.keys(graph[current]);
        neighbors = filterNeighbors(current, neighbors); // Ne garder que les voisins dans les bonnes directions

        for (const neighbor of neighbors) {
            if (closedSet.has(neighbor)) continue;

            const tentativeGScore = gScore[current] + graph[current][neighbor];

            if (!openSet.includes(neighbor)) openSet.push(neighbor);

            if (tentativeGScore < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + 2 * haversineDistance(neighbor, end);
            }
        }
    }

    console.log("Aucun chemin trouvé !");
    loader.innerText = "Aucun chemin trouvé !, veuillez réessayer avec des points de départ et d'arrivée plus proches des routes.";
    loader.style.display = "flex";
    loader.style.flexDirection = "column";
    const button = document.createElement('button');
    button.innerText = "Réessayer";
    button.onclick = () => window.location.reload();
    loader.appendChild(button);
};


// Fonction pour reconstruire et afficher le chemin trouvé par A*
const reconstructPath = (cameFrom, current) => {
    const totalPath = [current];

    // Parcourir le chemin depuis la destination jusqu'au point de départ
    while (cameFrom[current]) {
        current = cameFrom[current];
        totalPath.unshift(current);  // Ajouter le nœud au début du chemin

        // Dessiner une ligne entre le nœud actuel et le suivant dans le chemin
        drawLine(current, totalPath[1], 'red');
    }

    // Affichage du chemin dans la console
    console.log("Chemin total :", totalPath);
    console.timeEnd("A*");  // Fin du chronométrage pour mesurer la performance

    loader.style.display = "none";  // Masquer le loader

    // Ajuster la vue de la carte pour englober tout le chemin
    map.fitBounds(totalPath.map(node => nodeCoords[node]));
};


// Fonction pour initialiser et lancer la recherche
const initialize = async () => {
    try {
        loader.style.display = 'flex';
        loader.innerText = "Récupération des routes...";

        const distanceBetweenPoints = calculateDistance(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
        let searchRadius = distanceBetweenPoints / 2;

        const [startData, endData] = await Promise.all([
            getRoadsAndNodes(startCoords[0], startCoords[1], searchRadius),
            getRoadsAndNodes(endCoords[0], endCoords[1], searchRadius)
        ]);

        buildGraph(startData);
        buildGraph(endData);

        const startNode = findClosestNode(startCoords[0], startCoords[1]);
        const endNode = findClosestNode(endCoords[0], endCoords[1]);

        console.log("Nœud de départ :", startNode);
        console.log("Nœud d'arrivée :", endNode);

        if (startNode && endNode) {
            aStar(startNode, endNode);
        } else {
            console.error("Nœud de départ ou d'arrivée non trouvé !");
            loader.innerText = "Nœud de départ ou d'arrivée non trouvé !";
        }

    } catch (error) {
        console.error("Erreur lors de l'initialisation :", error);
    }
};

// Vérifier si un point est à l'intérieur du cercle
const isInsideCircle = (lat, lon, centerLat, centerLon, radius) => {
    const distance = calculateDistance(centerLat, centerLon, lat, lon);
    return distance <= radius;
};

map.on('click', function (e) {
    const { lat, lng } = e.latlng;

    if (!startCoords) {
        startCoords = [lat, lng];
        startMarker = L.marker([lat, lng], { color: 'green' }).addTo(map).bindPopup('Point de départ').openPopup();

        // un cercle autour du point de départ
        startCircle = L.circle([lat, lng], { radius: 10000, color: 'blue', fillOpacity: 0.1 }).addTo(map);
    } else if (!endCoords) {
        // Vérifier si le point est à l'intérieur du cercle
        if (isInsideCircle(lat, lng, startCoords[0], startCoords[1], 10000)) {
            endCoords = [lat, lng];
            endMarker = L.marker([lat, lng], { color: 'red' }).addTo(map).bindPopup('Point d\'arrivée').openPopup();
            initialize();
        } else {
            alert('Le point d\'arrivée doit être à l\'intérieur de la zone de 4000 mètres autour du point de départ.');
        }
    }
});

const drawLine = (fromNode, toNode, color = 'blue') => {
    const [fromLat, fromLon] = nodeCoords[fromNode];
    const [toLat, toLon] = nodeCoords[toNode];

    L.polyline([[fromLat, fromLon], [toLat, toLon]], { color }).addTo(map);
}

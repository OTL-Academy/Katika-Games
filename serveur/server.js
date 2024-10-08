const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];
const maxClients = 2; // Nombre maximum de clients

// Liste des cartes
const listCarte = [
    ...Array.from({ length: 8 }, (_, i) => ({ symbole: 'tr', numero: i + 3 })), // TR de 3 à 10
    ...Array.from({ length: 8 }, (_, i) => ({ symbole: 'fc', numero: i + 3 })), // FR de 3 à 10
    ...Array.from({ length: 8 }, (_, i) => ({ symbole: 'cr', numero: i + 3 })), // CR de 3 à 10
    ...Array.from({ length: 7 }, (_, i) => ({ symbole: 'cn', numero: i + 3 }))   // CN de 3 à 9
];

// Fonction pour mélanger les cartes
function MixCards(listCarte) {
    for (let i = listCarte.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [listCarte[i], listCarte[j]] = [listCarte[j], listCarte[i]];
    }
    return listCarte;
}

// Fonction pour partager les cartes entre les joueurs
function ShareCards(NbrePlayers, TabCard) {
    const Players = [];
    const cardsPerPlayer = 5; // Chaque joueur reçoit 5 cartes

    for (let i = 0; i < NbrePlayers; i++) {
        Players.push({
            playerName: `Player ${i + 1}`,
            tabCard: TabCard.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer)
        });
    }

    return Players;
}

// Fonction pour déterminer le gagnant d'un round
function Round(CartePlayer1, CartePlayer2, main) {
    const symbole1 = CartePlayer1.symbole;
    const symbole2 = CartePlayer2.symbole;

    if (symbole1 !== symbole2) {
        return main; // Celui qui a la main garde la main
    } else {
        if (CartePlayer1.numero > CartePlayer2.numero) {
            return main; // Celui qui a la main garde la main
        } else {
            return main === "Player 1" ? "Player 2" : "Player 1"; // L'autre joueur prend la main
        }
    }
}

wss.on('connection', (ws) => {
    let playerId;

    if (clients.length < maxClients) {
        // Attribuer un ID de joueur
        playerId = clients.length === 0 ? 'Player 1' : 'Player 2';
        clients.push(ws);
        console.log(`${playerId} est connecté. Total: ${clients.length}`);

        // Envoyer un message au joueur qui vient de se connecter
        ws.send(JSON.stringify({ type: 'connected', playerId }));

        // Lorsque deux utilisateurs sont connectés
        if (clients.length === maxClients) {
            const mixedCards = MixCards(listCarte);
            const playersCards = ShareCards(maxClients, mixedCards);

            clients.forEach((client, index) => {
                client.send(JSON.stringify({
                    type: 'start',
                    cards: playersCards[index].tabCard,
                    playerName: playersCards[index].playerName,
                }));
            });

            notifyCurrentPlayer(); // Notifier le joueur actuel
        }

        ws.on('message', (message) => {
            const data = JSON.parse(message);

            if (data.action) {
                handlePlayerAction(data.action, playerId); // Gérer l'action du joueur
            }
        });

        ws.on('close', () => {
            // Retirer le client de la liste lors de la déconnexion
            clients = clients.filter(client => client !== ws);
            console.log(`${playerId} est déconnecté. Total: ${clients.length}`);
        });
    } else {
        ws.close(); // Fermer la connexion si plus de 2 utilisateurs essaient de se connecter
    }
});

let currentPlayerIndex = 0; // Pour suivre le joueur actuel
let currentCard1 = null; // Carte jouée par le joueur actuel
let currentCard2 = null; // Carte jouée par le joueur suivant

function handlePlayerAction(action, playerId) {
    console.log(`${playerId} a joué : ${action.symbole} ${action.numero}`);

    // Diffuser l'action à tous les clients
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ action, playerId, card: action })); // Inclure l'objet carte dans l'action envoyée
        }
    });

    if (currentPlayerIndex === clients.findIndex(client => client.readyState === WebSocket.OPEN && playerId === client.playerId)) {
        if (!currentCard1) {
            currentCard1 = action; // Le joueur actuel joue sa carte
            console.log(`${playerId} a joué la carte : ${currentCard1.symbole} ${currentCard1.numero}`);
            notifyCurrentPlayer(); // Passer au joueur suivant sans envoyer encore l'action
        } else if (!currentCard2) {
            currentCard2 = action; // Le deuxième joueur joue sa carte
            console.log(`${playerId} a joué la carte : ${currentCard2.symbole} ${currentCard2.numero}`);

            // Déterminer le gagnant du round
            const roundWinnerName = Round(currentCard1, currentCard2, clients[currentPlayerIndex].playerName);
            console.log(roundWinnerName);
            notifyRoundResult(roundWinnerName);

            // Réinitialiser pour le prochain tour
            currentCard1 = null;
            currentCard2 = null;

            // Passer au joueur suivant
            currentPlayerIndex = (currentPlayerIndex + 1) % clients.length;
            notifyCurrentPlayer();
        }
    }
}

function notifyCurrentPlayer() {
    const currentPlayer = clients[currentPlayerIndex];

    clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'turn',
            currentPlayer: currentPlayerIndex === 0 ? 'Player 1' : 'Player 2',
            isCurrent: client === currentPlayer,
        }));
    });
}

function notifyRoundResult(winnerName) {
    clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'roundResult',
            winner: winnerName,
            card1: { symbole: currentCard1.symbole, numero: currentCard1.numero },
            card2: { symbole: currentCard2.symbole, numero: currentCard2.numero },
        }));
    });
}

server.listen(3000, () => {
    console.log('Serveur en cours d\'exécution sur http://localhost:3000');
});
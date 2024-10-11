// Charger les variables d'environnement à partir du fichier .env
require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});
// Accéder à la variable d'environnement SERVER_URL
const serverUrl = process.env.SERVER_URL;


const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;


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
    console.log(main)
}

wss.on('connection', (ws) => {
    let playerId;

    if (clients.length < maxClients) {
        // Attribuer un ID de joueur
        playerId = clients.length === 0 ? 0 : 1;

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

            notifyCurrentPlayer(currentPlayerIndex); // Notifier le joueur actuel
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

    let nextPlayerId = switchPlayer(clients, playerId);

    console.log("Le prochain joueur est", nextPlayerId + 1, " et ", playerId + 1, " a joué");

    // Diffuser l'action à tous les clients
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {

            client.send(JSON.stringify({ action, playerId, card: action, isCurrent: false })); // Inclure l'objet carte dans l'action envoyée
        }
    });

    clients[nextPlayerId].send(JSON.stringify({ playerId: nextPlayerId, isCurrent: true }));


    // for (i = 0; i < clients.length; i++) {
    //     let client = clients[i];
    //     console.log("-----/", client);
    //     if (client.readyState === WebSocket.OPEN) {
    //         if (playerId != nextPlayerId) {
    //             client.send(JSON.stringify({ action, playerId, card: action, isCurrent: true })); // Inclure l'objet carte dans l'action envoyée
    //             console.log("En attente de la carte de ", nextPlayerId + 1);
    //         } else {
    //             client.send(JSON.stringify({ action, playerId, card: action, isCurrent: false })); // Inclure l'objet carte dans l'action envoyée
    //         }
    //     }
    // }



    // if (currentPlayerIndex === clients.findIndex(client => client.readyState === WebSocket.OPEN && playerId === client.playerId)) {
    //     console.log(`c'est joyeur ${playerId} qui a la main`);

    //     console.log(`${playerId} a joué la carte : ${currentCard1.symbole} ${currentCard1.numero}`);
    //     getPlayerCard(rond, player);
    //     if (!currentCard1) {
    //         currentCard1 = action; // Le joueur actuel joue sa carte
    //         console.log(`${playerId} a joué la carte : ${currentCard1.symbole} ${currentCard1.numero}`);
    //         // currentPlayerIndex = (currentPlayerIndex + 1) % clients.length;
    //         notifyCurrentPlayer(currentPlayerIndex); // Passer au joueur suivant sans envoyer encore l'action
    //     } else if (!currentCard2) {
    //         currentCard2 = action; // Le deuxième joueur joue sa carte
    //         console.log(`${playerId} a joué la carte : ${currentCard2.symbole} ${currentCard2.numero}`);

    //         // Déterminer le gagnant du round
    //         const roundWinnerName = Round(currentCard1, currentCard2, clients[currentPlayerIndex].playerName);
    //         console.log(roundWinnerName);
    //         notifyRoundResult(roundWinnerName);

    //         // Réinitialiser pour le prochain tour
    //         currentCard1 = null;
    //         currentCard2 = null;

    //         // Passer au joueur suivant
    //         currentPlayerIndex = (currentPlayerIndex + 1) % clients.length;
    //         notifyCurrentPlayer(currentPlayerIndex);
    //     }
    // }
}

function switchPlayer(playerCount, PlayerId) {
    // console.log("Il ya",playerCount," joueurs et c'est player ",PlayerId,"Qui a la main");
    if (PlayerId == playerCount.length) {
        console.log("-Il ya", playerCount.length, " joueurs et c'est player ", PlayerId + 1, "qui doit jouer");
        playerCount = 0;
    } else {
        PlayerId++;
        console.log("Il ya", playerCount.length, " joueurs et c'est player ", PlayerId + 1, "Qui doit jouer");
    }

    // playerCount.forEach(player => {
    //     if (player.playerId != PlayerId) {
    //         player.send(JSON.stringify({ playerId, isCurrent: true })); // Inclure l'objet carte dans l'action envoyée

    //     } else {
    //         player.send(JSON.stringify({ playerId, isCurrent: false })); // Inclure l'objet carte dans l'action envoyée

    //     }
    // })

    return PlayerId;


}
function notifyCurrentPlayer(currentPlayerIndexVar) {
    const currentPlayer = clients[currentPlayerIndexVar];

    clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'turn',
            currentPlayer: currentPlayerIndexVar === 0 ? 1 : 2,
            isCurrent: client === currentPlayer,
        }));
    });
    console.log("Player", currentPlayerIndexVar + 1, " joue ...");

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

app.get('/', (req, res) => {
    res.send(`Serveur actif à l'adresse : ${serverUrl}`);
});

server.listen(3000, () => {
    console.log(`Application en cours d'exécution sur ${serverUrl}`);
});
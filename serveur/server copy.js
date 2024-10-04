const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = [];
const maxPlayers = 2; // Nombre maximum de joueurs

wss.on('connection', (ws) => {
    console.log('Un nouvel utilisateur est connecté');

    // Attribuer un nom au joueur
    const playerName = `Player ${players.length + 1}`;
    players.push(ws);

    // Informer le joueur qui vient de se connecter
    ws.send(JSON.stringify({
        type: 'connected',
        playerName: playerName,
    }));

    // Si deux joueurs sont connectés, commencer le jeu
    if (players.length === maxPlayers) {
        players.forEach((player, index) => {
            player.send(JSON.stringify({
                type: 'start',
                playerName: playerName,
                playerIndex: index,
            }));
        });
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        // Gérer d'autres types de messages ici
    });

    ws.on('close', () => {
        console.log(`${playerName} s'est déconnecté`);
        players = players.filter(player => player !== ws);
    });
});

server.listen(3000, () => {
    console.log('Serveur en cours d\'exécution sur http://localhost:3000');
});
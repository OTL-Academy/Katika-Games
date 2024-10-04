const socket = new WebSocket("ws://localhost:3000");

socket.onopen = function (event) {
    console.log("Connexion établie avec le serveur");
};

socket.onmessage = function (event) {
    console.log("Données reçues :", event.data);

    try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
            displayPlayerConnection(data.playerId); // Afficher que le joueur est connecté
        } else if (data.type === 'start') {
            displayHand(data.cards); // Afficher les cartes du joueur lorsqu'il commence à jouer
        } else if (data.action) {
            displayPlayerChoice(data.card.symbole, data.card.numero, data.playerId); // Afficher le choix du joueur avec symbole et numéro
        } else if (data.type === 'turn') {
            handleTurn(data); // Gérer le tour du joueur
        } else if (data.type === 'roundResult') {
            displayRoundResult(data.winner, data.card1, data.card2); // Afficher le résultat du round
        }
    } catch (error) {
        console.error("Erreur lors de l'analyse du JSON :", error);
    }
};

function displayHand(cards) {
    const cardNumber = document.querySelectorAll('.card-number')
    const cardColor = document.querySelectorAll('.card-color')
    const card = document.querySelectorAll('.card')

    for (let index = 0; index < cards.length; index++) {
        const element = cards[index];
        const cardList = cardNumber[index];
        cardColor[index].classList.add(`${element.symbole}`)
        cardList.innerHTML = element.numero

        card[index].onclick = function () {
            alert(`Vous avez joué: ${element.symbole} ${element.numero} `);
            card[index]
            // socket.send(JSON.stringify({ action: card })); // Envoyer l'action au serveur avec la carte jouée
            // button.disabled = true; // Désactiver le bouton après avoir joué la carte
        };

    }
}

    // const buttonContainer = document.getElementById('buttonContainer');

    // buttonContainer.innerHTML = ''; // Vider le conteneur avant d'ajouter des boutons

    // cards.forEach(card => {
    //     const button = document.createElement('button');
    //     cardNumber[card] = `${card.numero}`
    //     button.textContent = `${card.symbole} ${card.numero} `;

    //     button.onclick = function () {
    //         alert(`Vous avez joué: ${card.symbole} ${card.numero} `);
    //         socket.send(JSON.stringify({ action: card })); // Envoyer l'action au serveur avec la carte jouée
    //         button.disabled = true; // Désactiver le bouton après avoir joué la carte
    //     };

    //     buttonContainer.appendChild(button);
    // });

function handleTurn(data) {
    const turnInfoContainer = document.getElementById('turnInfo');

    if (data.isCurrent) {
        turnInfoContainer.textContent = `${data.currentPlayer}, c'est votre tour !`;

        toggleButtons(true); // Activer les boutons uniquement pour le joueur courant

    } else {
        turnInfoContainer.textContent = `${data.currentPlayer} joue...`;

        toggleButtons(false); // Désactiver les boutons pour l'autre joueur
    }
}

function toggleButtons(isEnabled) {
    const buttons = document.querySelectorAll('#buttonContainer button');

    buttons.forEach(button => {
        button.disabled = !isEnabled; // Activer ou désactiver les boutons selon le tour du joueur
    });
}

function displayPlayerConnection(playerName) {
    const playerInfoContainer = document.getElementById('playerInfo');
    playerInfoContainer.textContent += `${playerName}\n`;
}

function displayPlayerChoice(symbole, numero, playerId) {
    const choiceContainer = document.getElementById('choices');
    const choiceMessage = document.createElement('p');
    choiceMessage.textContent = `${playerId} a choisi : ${symbole} ${numero}`;
    choiceContainer.appendChild(choiceMessage);
}

function displayRoundResult(winnerName, card1, card2) {
    const resultContainer = document.getElementById('choices');
    resultContainer.innerHTML += `<p>Le gagnant du round est : ${winnerName}</p>`;
    resultContainer.innerHTML += `<p>Cartes jouées : ${card1.symbole} ${card1.numero} contre ${card2.symbole} ${card2.numero}</p>`;
}

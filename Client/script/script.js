const socket = new WebSocket("ws://localhost:3000");

let playerId; // Variable pour stocker l'identifiant du joueur

socket.onopen = function (event) {
    console.log("Connexion établie avec le serveur");
};

socket.onmessage = function (event) {
    console.log("Données reçues :", event.data);

    try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
            playerId = data.playerId; // Récupérer l'ID du joueur
            displayPlayerConnection(playerId); // Afficher que le joueur est connecté 
        } else if (data.type === 'start') {
            displayHand(data.cards); // Afficher les cartes du joueur lorsqu'il commence à jouer 
        } else if (data.action) {
            // Vérifier si le joueur actuel est celui qui a joué
            if (data.playerId === playerId) {
                replaceWaitingCard(data.card); // Afficher dans l'onglet du joueur
            } else {
                displayNotPlayerWaitingCard(data.card); // Afficher dans l'onglet de l'autre joueur
            }
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
    const cardNumber = document.querySelectorAll('.card-number');
    const cardColor = document.querySelectorAll('.card-color');
    const card = document.querySelectorAll('.card');

    for (let index = 0; index < cards.length; index++) {
        const element = cards[index];
        const cardList = cardNumber[index];
        cardColor[index].classList.add(`${element.symbole}`);

        cardList.innerHTML = element.numero;

        card[index].onclick = function () {
            alert(`Vous avez joué: ${element.symbole} ${element.numero}`);

            socket.send(JSON.stringify({ action: element })); // Envoyer l'action au serveur avec la carte jouée 

            card[index].classList.add('disabled'); // Ajouter une classe pour griser la carte
            card[index].disabled = true; // Désactiver le bouton après avoir joué la carte 
        };
    }
}

function replaceWaitingCard(card) {
    const waitingCards = document.querySelectorAll('.player-waiting-card');

    for (let i = 0; i < waitingCards.length; i++) {
        waitingCards[i].classList.add('hand-card')
        waitingCards[i].classList.add('reveled-card')
        if (waitingCards[i].innerHTML === "") { // Vérifie si l'espace est vide
            waitingCards[i].innerHTML = `
                        <div class="card marginTopZero">
                            <div class="card-color ${card.symbole}"></div>
                            <div class="card-number">${card.numero}</div>
                        </div>
                    `;
            break; // Sortir de la boucle après avoir remplacé une carte
        }

    }
}

function displayNotPlayerWaitingCard(card) {
    const waitingCardsNot = document.querySelectorAll('.not-player-waiting-card');

    for (let i = 0; i < waitingCardsNot.length; i++) {
        waitingCardsNot[i].classList.add('hand-card')
        waitingCardsNot[i].classList.add('reveled-card')
        if (waitingCardsNot[i].innerHTML === "") { // Vérifie si l'espace est vide
            waitingCardsNot[i].innerHTML = `
                <div class="card marginTopZero">
                    <div class="card-color ${card.symbole}"></div>
                    <div class="card-number">${card.numero}</div>
                </div>
            `;
            break; // Sortir de la boucle après avoir remplacé une carte
        }
    }
}

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
    // const choiceContainer = document.getElementById('choices'); 
    // const choiceMessage = document.createElement('p'); 

    // choiceMessage.textContent = `${playerId} a choisi : ${symbole} ${numero}`; 
    // choiceContainer.appendChild(choiceMessage); 
}

function displayRoundResult(winnerName, card1, card2) {
    const resultContainer = document.getElementById('choices');

    resultContainer.innerHTML += `<p>Le gagnant du round est : ${winnerName}</p>`;
    resultContainer.innerHTML += `<p>Cartes jouées : ${card1.symbole} ${card1.numero} contre ${card2.symbole} ${card2.numero}</p>`;
}
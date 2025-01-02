let teamCount = parseInt(localStorage.getItem("teamCount")) || 0;
const teams = JSON.parse(localStorage.getItem("teams")) || [];
const teamNames = ["MI", "CSK", "RCB", "KKR", "SRH", "RR", "GT", "DD", "PK", "LSG"];

window.onload = function () {
    teams.forEach(team => {
        createTeamFromStorage(team);
    });
    updateHighestStats();
};

document.getElementById("createTeamBtn").addEventListener("click", function () {
    teamCount++;
    localStorage.setItem("teamCount", teamCount);
    const teamId = `team${teamCount}`;
    const teamName = teamNames[teamCount - 1];
    const team = {
        id: teamId,
        name: teamName,
        players: 0,
        purse: 50,
        rating: 0,
        playerData: []
    };
    if (teamCount > 9) { document.getElementById("createTeamBtn").disabled = true; }

    teams.push(team);
    localStorage.setItem("teams", JSON.stringify(teams));
    createTeamFromStorage(team);
});

document.getElementById("resetTeamsBtn").addEventListener("click", function () {
    if (confirm("Are you sure you want to reset all teams? This will clear all data.")) {
        resetTeams();
    }
});

function resetTeams() {
    localStorage.removeItem("teamCount");
    localStorage.removeItem("teams");
    teamCount = 0;
    teams.length = 0;
    document.getElementById("inner2").innerHTML = '';
    updateHighestStats();
}

function createTeamFromStorage(team) {
    const teamBox = document.createElement("div");
    teamBox.id = team.name.toLowerCase();
    teamBox.classList.add("team");

    const existingLink = document.querySelector(`link[href="./css/${team.name.toLowerCase()}.css"]`);
    if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = `CSS/${team.name.toLowerCase()}.css`;
        document.head.appendChild(link);
    }
    teamBox.innerHTML = `


<div class="teamone mb-1">
    <div class="teamlogo">
        <img src="IMAGES/${team.name.toLowerCase()}.png">
    </div>
    <div class="teamdetail">
        <div class="teamname"> <span id="${team.id}-name-header">TEAM # 1</span> &nbsp;
            <button class="btn btn btn-sm" onclick="renameTeam('${team.id}')">
                <i class="fa-solid fa-pen" style="color: white;"></i>
            </button></div>
        <div class="playnum">Player - &nbsp;<span id="${team.id}-players">${team.players}</span>&nbsp; / 11 </div>
        <div class="ranking">Rating #1 | Purse #2</div>
    </div>
</div>
<div class="teamtwo">
    <div class="input-group">
    <input type="text" class="form-control" placeholder="Player Name" id="${team.id}-name">
    <input type="number" step="0.01" class="form-control" placeholder="Price" id="${team.id}-price">
    <input type="number" step="0.01" class="form-control" placeholder="Rating" id="${team.id}-rating-input">
    <button class="btn btn-success" onclick="addPlayer('${team.id}')">+</button>
</div>
</div>


<div class="teamthree">
    <table class="table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Rating</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody id="${team.id}-table">
            ${team.playerData.map((player, index) => `
                <tr draggable="true" style="background-color: ${getRowColor(team.id, index)}">
                    <td>${player.name}</td>
                    <td>${player.price.toFixed(2)}</td>
                    <td>${player.rating.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deletePlayer('${team.id}', this, ${player.price}, ${player.rating})">Delete</button>
                        
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</div>
`;
    document.getElementById("inner2").appendChild(teamBox);

    const tbody = teamBox.querySelector(`#${team.id}-table`);
    let draggedRow = null;

    tbody.addEventListener("dragstart", (event) => {
        if (event.target.tagName === "TR") {
            draggedRow = event.target;
            event.target.classList.add("dragging");
        }
    });

    tbody.addEventListener("dragover", (event) => {
        event.preventDefault();
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const target = event.target.closest("tr");
        if (rows.includes(target) && target !== draggedRow) {
            const rect = target.getBoundingClientRect();
            const offset = event.clientY - rect.top;
            if (offset < rect.height / 2) {
                target.before(draggedRow);
            } else {
                target.after(draggedRow);
            }
        }
    });

    tbody.addEventListener("dragend", (event) => {
        if (event.target.tagName === "TR") {
            event.target.classList.remove("dragging");
            draggedRow = null;
            updatePlayerOrder(team.id, tbody);
        }
    });
}

function renameTeam(teamId) {
    const newName = prompt("Enter new team name: ");
    if (newName) {
        var team = teams.find(t => t.id === teamId);
        if (team) {
            team.name = newName; // Update the team name
            document.getElementById(`${teamId}-name-header`).textContent = newName; // Update the displayed name
            localStorage.setItem("teams", JSON.stringify(teams)); // Save updated teams to localStorage
        }
    }
}

function addPlayer(teamId) {
    const nameInput = document.getElementById(`${teamId}-name`);
    const priceInput = document.getElementById(`${teamId}-price`);
    const ratingInput = document.getElementById(`${teamId}-rating-input`);

    const name = nameInput.value;
    const price = parseFloat(priceInput.value);
    const rating = parseFloat(ratingInput.value);

    if (!name || isNaN(price) || price < 0 || isNaN(rating)) {
        alert("Please enter valid player details");
        return;
    }

    const team = teams.find(t => t.id === teamId);

    if (team.purse < price) {
        alert("Not enough purse remaining!");
        return;
    }


    team.players++;
    team.purse -= price;
    team.rating += rating;
    team.playerData.push({ name, price, rating });

    nameInput.value = '';
    priceInput.value = '';
    ratingInput.value = '';

    // Update UI and localStorage
    const table = document.getElementById(`${teamId}-table`);
    const row = document.createElement("tr");
    row.draggable = true;
    row.style.backgroundColor = getRowColor(team.id, team.playerData.length - 1);
    row.innerHTML = `
<td>${name}</td>
<td>${price.toFixed(2)}</td>
<td>${rating.toFixed(2)}</td>
<td><button class="btn btn-sm" onclick="deletePlayer('${teamId}', this, ${price}, ${rating})"><i class="fa-solid fa-circle-xmark"
                                                style="color:red;"></i></button></td>
`;
    table.appendChild(row);

    document.getElementById(`${teamId}-players`).textContent = team.players;
    document.getElementById(`${teamId}-purse`).textContent = team.purse.toFixed(2);
    document.getElementById(`${teamId}-rating`).textContent = team.rating.toFixed(2);



    localStorage.setItem("teams", JSON.stringify(teams));
    updateHighestStats();
}

function getRowColor(teamId, index) {
    return '';
}


function deletePlayer(teamId, button, price, rating) {
    const team = teams.find(t => t.id === teamId);

    // Find the player's index in the playerData array
    const row = button.closest("tr");
    const playerName = row.querySelector("td").textContent;
    const playerIndex = team.playerData.findIndex(player => player.name === playerName && player.price === price && player.rating === rating);

    if (playerIndex !== -1) {
        // Remove the player from the playerData array
        team.playerData.splice(playerIndex, 1);
    }

    // Update team stats
    team.players--;
    team.purse += price;
    team.rating -= rating;

    // Remove the row from the table
    row.remove();

    // Update UI
    document.getElementById(`${teamId}-players`).textContent = team.players;
    document.getElementById(`${teamId}-purse`).textContent = team.purse.toFixed(2);
    document.getElementById(`${teamId}-rating`).textContent = team.rating.toFixed(2);

    // Save updated data to local storage
    localStorage.setItem("teams", JSON.stringify(teams));
    updateHighestStats();
}


function updatePlayerOrder(teamId, tbody) {
    const team = teams.find(t => t.id === teamId);
    const rows = Array.from(tbody.querySelectorAll("tr"));

    team.playerData = rows.map(row => {
        const cells = row.querySelectorAll("td");
        return {
            name: cells[0].textContent,
            price: parseFloat(cells[1].textContent),
            rating: parseFloat(cells[2].textContent)
        };
    });

    localStorage.setItem("teams", JSON.stringify(teams));
}

function updateHighestStats() {
    let highestPurse = 0;
    let highestRating = 0;
    let highestPurseTeam = '';
    let highestRatingTeam = '';

    teams.forEach(team => {
        if (team.purse > highestPurse) {
            highestPurse = team.purse;
            highestPurseTeam = team.name;
        }
        if (team.rating > highestRating) {
            highestRating = team.rating;
            highestRatingTeam = team.name;
        }
    });

    document.getElementById("highestPurse").textContent = `${highestPurseTeam} ₹${highestPurse.toFixed(2)}`;
    document.getElementById("highestRating").textContent = `${highestRatingTeam} ${highestRating.toFixed(2)}`;
}
function deleteTeambox(teamId) {
    const teamBox = document.getElementById(teamId.toLowerCase());
    if (teamBox) {
        teamBox.remove();
        const teamIndex = teams.findIndex(t => t.id === teamId);
        if (teamIndex !== -1) {
            teams.splice(teamIndex, 1);
            localStorage.setItem("teams", JSON.stringify(teams));
            updateHighestStats();
        }
    }
}

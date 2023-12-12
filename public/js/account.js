async function getCharacter() {
    var spinner = document.createElement("div");
    spinner.classList.add('spinner-border');
    spinner.classList.add('text-dark');
    document.getElementById('spinnerDiv').classList.add('text-center');
    spinner.role = 'status';
    document.getElementById('spinnerDiv').appendChild(spinner);
    document.getElementById('character').classList.toggle('d-none');
    while (document.getElementById('characterCS').firstChild) {
        document.getElementById('characterCS').removeChild(document.getElementById('characterCS').firstChild);
    }
    while (document.getElementById('characterOS').firstChild) {
        document.getElementById('characterOS').removeChild(document.getElementById('characterOS').firstChild);
    }
    await fetch('/account/character/' + document.getElementById('authCode').value, {
            method: 'GET'
        })
        .then(response => {
            return response.json();

        })
        .then(data => {
            document.getElementById('spinnerDiv').removeChild(spinner);
            document.getElementById('spinnerDiv').classList.remove('text-center');
            document.getElementById('character').classList.add('small');
            document.getElementById('character').classList.toggle('d-none');
            document.getElementById('ltCharacterName').value = data.characterName;
            document.getElementById('characterRace').innerText = data.race;
            document.getElementById('characterGroup').innerText = data.groupname;
            document.getElementById('characterFaction').value = data.faction;
            document.getElementById('ltPlayerId').innerText = data.pid;

            for (var i = 0; i < data.characterSkills.length; i++) {
                var li = document.createElement("li");
                li.appendChild(document.createTextNode(data.characterSkills[i].name))
                document.getElementById('characterCS').appendChild(li);
            }
            var liSpace = document.createElement("li");
            document.getElementById('characterCS').appendChild(liSpace);
            document.getElementById('characterCS').appendChild(liSpace);
            for (var i = 0; i < data.occupationalSkills.length; i++) {
                if (data.occupationalSkills[i].script) {
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(data.occupationalSkills[i].name))
                    document.getElementById('characterCS').appendChild(li);
                }
            }

            for (var i = 0; i < data.occupationalSkills.length; i++) {
                if (!data.occupationalSkills[i].script) {
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(data.occupationalSkills[i].name))
                    document.getElementById('characterOS').appendChild(li);
                }
            }
        })

}


async function getCharacter() {
    var spinner = document.createElement("div");
    spinner.classList.add('spinner-border');
    spinner.classList.add('text-dark');
    document.getElementById('lorienTrustspinnerDiv').classList.add('text-center');
    spinner.role = 'status';
    document.getElementById('lorienTrustspinnerDiv').appendChild(spinner);
    document.getElementById('lorienTrustcharacter').classList.toggle('d-none');
    while (document.getElementById('lorienTrustcharacterCS').firstChild) {
        document.getElementById('lorienTrustcharacterCS').removeChild(document.getElementById('lorienTrustcharacterCS').firstChild);
    }
    while (document.getElementById('lorienTrustcharacterOS').firstChild) {
        document.getElementById('lorienTrustcharacterOS').removeChild(document.getElementById('lorienTrustcharacterOS').firstChild);
    }
    await fetch('/account/character/' + document.getElementById('lorienTrustauthCode').value, {
            method: 'GET'
        })
        .then(response => {
            return response.json();

        })
        .then(data => {
            document.getElementById('lorienTrustspinnerDiv').removeChild(spinner);
            document.getElementById('lorienTrustspinnerDiv').classList.remove('text-center');
            document.getElementById('lorienTrustcharacter').classList.add('small');
            document.getElementById('lorienTrustcharacter').classList.toggle('d-none');
            document.getElementById('lorienTrustCharacterName').value = data.characterName;
            document.getElementById('lorienTrustcharacterRace').innerText = data.race;
            document.getElementById('lorienTrustcharacterGroup').innerText = data.groupname;
            document.getElementById('lorienTrustfaction').value = data.faction;
            document.getElementById('lorienTrustplayerId').value = data.pid;

            for (var i = 0; i < data.characterSkills.length; i++) {
                var li = document.createElement("li");
                li.appendChild(document.createTextNode(data.characterSkills[i].name))
                document.getElementById('lorienTrustcharacterCS').appendChild(li);
            }
            var liSpace = document.createElement("li");
            document.getElementById('lorienTrustcharacterCS').appendChild(liSpace);
            document.getElementById('lorienTrustcharacterCS').appendChild(liSpace);
            for (var i = 0; i < data.occupationalSkills.length; i++) {
                if (data.occupationalSkills[i].script) {
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(data.occupationalSkills[i].name))
                    document.getElementById('lorienTrustcharacterCS').appendChild(li);
                }
            }

            for (var i = 0; i < data.occupationalSkills.length; i++) {
                if (!data.occupationalSkills[i].script) {
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(data.occupationalSkills[i].name))
                    document.getElementById('lorienTrustcharacterOS').appendChild(li);
                }
            }
        })

}
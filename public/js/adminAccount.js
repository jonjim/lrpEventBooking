function addHost(userId) {
    document.activeElement.blur();
    window.location.href = '/admin/users/' + userId + '/add/host/' + document.getElementById('eventHosts').value;
}

function delHost(userId, hostId) {
    window.location.href = '/admin/users/' + userId + '/del/host/' + hostId;
}

function addSystem(userId) {
    document.activeElement.blur();
    window.location.href = '/admin/users/' + userId + '/add/system/' + document.getElementById('eventSystems').value;
}

function delSystem(userId, hostId) {
    window.location.href = '/admin/users/' + userId + '/del/system/' + hostId;
}
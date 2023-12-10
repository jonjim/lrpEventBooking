function addHost(userId) {
    document.activeElement.blur();
    window.location.href = '/admin/users/' + userId + '/add/' + document.getElementById('eventHosts').value;
}

function delHost(userId, hostId) {
    window.location.href = '/admin/users/' + userId + '/del/' + hostId;
}
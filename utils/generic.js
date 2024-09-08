function dateOutput(str){
    return new Date(str).toLocaleDateString('en-GB');
}

function timeOutput(str){
    return new Date(str).toLocaleTimeString('en-GB',{hour: '2-digit', minute:'2-digit'})
}

function currencyOutput(str){
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(str)
}

function isEventAdmin(user, eventHost, eventSystem) {
    let authorised = false;
    if (eventSystem) {
        authorised = ['admin', 'systemAdmin', 'superAdmin'].includes(user.role) && user.eventSystems.filter(a => a._id.equals(eventSystem)).length > 0;
    }
    if (eventHost && !authorised) {
        authorised = ['admin', 'eventHost', 'systemAdmin', 'superAdmin'].includes(user.role)
            && (user.eventSystems.filter(a => a._id.equals(eventSystem)).length > 0 || user.eventHosts.filter(a => a._id.equals(eventHost)).length > 0)
    }
    if (!authorised)
        authorised = ['admin', 'superAdmin'].includes(user.role);
    return authorised;
}

module.exports = {dateOutput,timeOutput,currencyOutput, isEventAdmin}
const eventLogos = document.querySelectorAll('[aria-label="event-logo"]');
for (eventLogo of eventLogos){
    const hostImg = document.getElementById(eventLogo.id.replace('event','host'));
    const eventImg = document.getElementById(eventLogo.id);
    eventImg.addEventListener('mouseenter', () => {
        eventImg.classList.add('event-logo-fade');
        hostImg.classList.add('host-logo');
        hostImg.classList.remove('host-logo-fade');
    });
    eventImg.addEventListener('mouseleave', () => {
        eventImg.classList.remove('event-logo-fade');
        hostImg.classList.add('host-logo-fade');
        hostImg.classList.remove('host-logo');
    });
}
const hostLogos = document.querySelectorAll('[aria-label="host-logo"]');
for (hostLogo of hostLogos){
    const eventImg = document.getElementById(hostLogo.id.replace('host','event'));
    const hostImg = document.getElementById(hostLogo.id);
    hostImg.addEventListener('mouseenter', () => {
        eventImg.classList.add('event-logo-fade');
        hostImg.classList.remove('host-logo-fade');
        hostImg.classList.add('host-logo');
    })
    hostImg.addEventListener('mouseleave', () => {
        eventImg.classList.remove('event-logo-fade');
        hostImg.classList.add('host-logo-fade');
        hostImg.classList.remove('host-logo');
    })
}
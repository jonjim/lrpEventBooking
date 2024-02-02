const turndownService  = require('turndown');

module.exports.discordWebhook = async (res, webhook, lrpEvent) => {
    let turndownS = new turndownService();
    await fetch(webhook, {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            content: `A new event from ${res.locals.config.siteName}!`,
            embeds: [{
                author: {
                    name: `${lrpEvent.eventHost.eventSystem.name}${lrpEvent.eventHost.display ? ` - ${lrpEvent.eventHost.name}` : ''}`,
                    url: `${res.locals.rootUrl}/${lrpEvent.eventHost.eventSystem.systemRef}`
                },
                title: lrpEvent.name,
                url: `${res.locals.rootUrl}/events/${lrpEvent._id}`,
                description: new turndownService().turndown(lrpEvent.promoDescription),
                fields: [
                    {
                        name: `Event Date${new Date(lrpEvent.eventStart).toLocaleDateString() != new Date(lrpEvent.eventEnd).toLocaleDateString() ? 's' : ''}`,
                        value: `${new Date(lrpEvent.eventStart).toLocaleDateString()}${new Date(lrpEvent.eventStart).toLocaleDateString() != new Date(lrpEvent.eventEnd).toLocaleDateString() ? ` - ${new Date(lrpEvent.eventEnd).toLocaleDateString()}` : ''}`,
                        inline: true
                    },
                    {
                        name: 'Location',
                        value: lrpEvent.location.split(',')[0],
                        inline: true
                    }
                ],
                image: {
                    url: typeof lrpEvent.img.url === 'undefined' ? lrpEvent.eventHost.img.url : lrpEvent.imgThumbnail
                },
                thumbnail: {
                    url: res.locals.config.siteLogo.url
                }
            }]
        })
    })
        .then((response) => console.log(response));
}


const turndownService  = require('turndown');

module.exports.discordWebhook = async (res, webhook, lrpEvent) => {
    let turndownS = new turndownService();
    await fetch(webhook, {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            username: res.locals.config.siteName,
            avatar_url: res.locals.config.siteAvatar,
            content: '',
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
                footer: {
                    text: `Event booking from ${res.locals.config.siteName}`,
                    icon_url: res.locals.config.imgThumbnail
                }
            }]
        })
    })
        // .then((response) => console.log(response));
}


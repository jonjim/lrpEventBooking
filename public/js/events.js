tinymce.init({
    content_css: ['/css/style.css','https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'],
    content_css_cords: true,
    selector: 'textarea',
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
    browser_spellcheck: true,
    menubar: false,
    height: "200",
    contextmenu: "link useBrowserSpellcheck image table",
    setup: function(editor) {
        editor.ui.registry.addMenuItem("useBrowserSpellcheck", {
            text: "Use `Ctrl+Right click` to access spellchecker",
            onAction: function() {
                editor.notificationManager.open({
                    text: "To access the spellchecker, hold the Control (Ctrl) key and right-click on the misspelt word.",
                    type: "info",
                    timeout: 5000,
                    closeButton: true,
                });
            },
        });
        editor.ui.registry.addContextMenu("useBrowserSpellcheck", {
            update: function(node) {
                return editor.selection.isCollapsed() ? ["useBrowserSpellcheck"] : [];
            },
        });
    },
    content_style: `
            body {
                margin: 10px 10px 5px 10px;
              background: #fff;
              font-size: 10pt;
            }
        …
     `
 });

function setHostImageUrl(host) {
    let url;
    let hostName = host.value ? host.value : host;
    if (hostName && (hostName === 'Lorien Trust' || hostName === 'Arcane' || hostName === 'Martial' || hostName === 'Knowledge'))
        url = '/img/lorienTrustx4.png';
    else
        url = host.options[host.selectedIndex].dataset.img;
    setHostImage(url);
}

function setHostImage(imgUrl) {
    document.getElementById('eventImg').src = imgUrl;
    document.getElementById('eventImageUrl').value = imgUrl;
}

function setDisplayLimit(selector) {
    window.location.replace(`${window.location.origin}${window.location.pathname}?limit=${selector.value}`)
}
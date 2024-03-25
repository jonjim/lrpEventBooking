tinymce.init({
selector: 'textarea#systemDescription',
plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
browser_spellcheck: true,
menubar: false,
height: "220",
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
      background: #fff;
      font-size: 10pt;
    }
…
`
});
tinymce.init({
selector: 'textarea#systemTerms',
plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
browser_spellcheck: true,
menubar: false,
height: "400",
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
      background: #fff;
      font-size: 10pt;
    }
…
`
});

function camelize(str) {
    return str.replace(/[^a-zA-Z ]/g, "").toLowerCase().replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}
function newField(eventSystemId){
    document.getElementById('customFieldModalLabel').innerText = 'Create New Custom Field';
    document.getElementById('fieldSubmit').innerText = 'Create Field';
    document.getElementById('customId').value = '';
    document.getElementById('customName').value = '';
    document.getElementById('customLabel').value = '';
    document.getElementById('customType').value = 'text'; 
    document.getElementById('customOptions').parentElement.classList.add('d-none')
    document.getElementById('customOptions').value = '';
    document.getElementById('customRequired').checked = false;
    document.getElementById('customError').parentElement.classList.add('d-none')
    document.getElementById('customError').value = '';
    document.getElementById('customDisplay').checked = false;
    document.getElementById('customDefaultValue').value = '';
    document.getElementById('customDescription').value = '';
    document.getElementById('customPlaceholder').value = '';
    document.getElementById('customError').value = '';
    document.getElementById('customFieldForm').action = `/admin/systems/${eventSystemId}/fields`;
    document.getElementById('deleteFieldBtn').classList.add('d-none');
}
function editField(eventSystemId,json) {
    document.getElementById('customFieldModalLabel').innerText = 'Update Custom Field';
    document.getElementById('fieldSubmit').innerText = 'Update Field';
    document.getElementById('customId').value = json._id;
    document.getElementById('customName').value = json.name;
    document.getElementById('customLabel').value = json.label;
    document.getElementById('customSection').value = json.section;
    document.getElementById('customType').value = json.type;
    if(json.type == 'select' ) document.getElementById('customOptions').parentElement.classList.remove('d-none'); 
    else document.getElementById('customOptions').parentElement.classList.add('d-none')
    document.getElementById('customOptions').value = json.options.join(',');
    document.getElementById('customRequired').checked = json.required;
    if (json.required) document.getElementById('customError').parentElement.classList.remove('d-none')
    else document.getElementById('customError').parentElement.classList.add('d-none')
    document.getElementById('customError').value = json.error;
    document.getElementById('customDisplay').checked = json.display;
    document.getElementById('customDefaultValue').value = json.defaultValue;
    document.getElementById('customDescription').value = json.description;
    document.getElementById('customPlaceholder').value = json.placeholder;
    document.getElementById('customError').value = json.error;
    document.getElementById('customFieldForm').action = `/admin/systems/${eventSystemId}/fields?_method=PUT`
    document.getElementById('deleteFieldBtn').classList.remove('d-none');
}
function deleteField(){
    document.getElementById('deleteId').value = document.getElementById('customId').value;
    document.getElementById('deleteFieldForm').submit();
}
function newLammieField(eventSystemId){
    document.getElementById('customLammieFieldModalLabel').innerText = 'Create New Lammie Field';
    document.getElementById('lammieFieldSubmit').innerText = 'Create Field';
    document.getElementById('customLammieId').value = '';
    document.getElementById('customLammieName').value = '';
    document.getElementById('customLammieLabel').value = '';
    document.getElementById('customLammieType').value = 'text'; 
    document.getElementById('customLammieOptions').parentElement.classList.add('d-none')
    document.getElementById('customLammieOptions').value = '';
    document.getElementById('customLammieRequired').checked = false;
    document.getElementById('customLammieError').parentElement.classList.add('d-none')
    document.getElementById('customLammieError').value = '';
    document.getElementById('customLammieDefaultValue').value = '';
    document.getElementById('customLammieDescription').value = '';
    document.getElementById('customLammiePlaceholder').value = '';
    document.getElementById('customLammieError').value = '';
    document.getElementById('customLammieFieldForm').action = `/admin/systems/${eventSystemId}/lammiefields`;
    document.getElementById('deleteLammieFieldBtn').classList.add('d-none');
}
function editLammieField(eventSystemId,json) {
    document.getElementById('customLammieFieldModalLabel').innerText = 'Update Lammie Field';
    document.getElementById('lammieFieldSubmit').innerText = 'Update Field';
    document.getElementById('customLammieId').value = json._id;
    document.getElementById('customLammieName').value = json.name;
    document.getElementById('customLammieLabel').value = json.label;
    document.getElementById('customLammieSection').value = json.section;
    document.getElementById('customLammieType').value = json.type;
    if(json.type == 'select' ) document.getElementById('customOptions').parentElement.classList.remove('d-none'); 
    else document.getElementById('customLammieOptions').parentElement.classList.add('d-none')
    document.getElementById('customLammieOptions').value = json.options.join(',');
    document.getElementById('customLammieRequired').checked = json.required;
    if (json.required) document.getElementById('customLammieError').parentElement.classList.remove('d-none')
    else document.getElementById('customLammieError').parentElement.classList.add('d-none')
    document.getElementById('customLammieError').value = json.error;
    document.getElementById('customLammieDefaultValue').value = json.defaultValue;
    document.getElementById('customLammieDescription').value = json.description;
    document.getElementById('customLammiePlaceholder').value = json.placeholder;
    document.getElementById('customLammieError').value = json.error;
    document.getElementById('customLammieFieldForm').action = `/admin/systems/${eventSystemId}/lammiefields?_method=PUT`
    document.getElementById('deleteLammieFieldBtn').classList.remove('d-none');
}
function deleteLammieField(){
    document.getElementById('lammieDeleteId').value = document.getElementById('customLammieId').value;
    document.getElementById('deleteLammieFieldForm').submit();
}
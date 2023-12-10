function filterTable(type) {
    const query = q => document.querySelectorAll(q);
    const filters = [...query(`th.${type} input`)].map(e => new RegExp(e.value, 'i'));
  
    query(`tbody.${type} tr`).forEach(row => row.style.display = 
      filters.every((f, i) => f.test(row.cells[i].textContent)) ? '' : 'none');
}

document.getElementById('playerSearch').addEventListener('keyup', function() {
    filterTable('players');
});

document.getElementById('monsterSearch').addEventListener('keyup', function() {
    filterTable('monsters');
});

document.getElementById('staffSearch').addEventListener('keyup', function() {
    filterTable('staff');
});

let progressArray = document.getElementsByClassName('progress-bar');
for (progress of progressArray) {

    let max = progress.getAttribute('aria-valuemax');
    let min = progress.getAttribute('aria-valuemin');
    let current = progress.getAttribute('aria-valuenow');
    let percentage = (100 * current) / max;
    progress.style.width = percentage + '%';
}
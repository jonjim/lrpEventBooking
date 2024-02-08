function filterTable(type) {
    const query = q => document.querySelectorAll(q);
    const filters = [...query(`th.${type} input`)].map(e => new RegExp(e.value, 'i'));
  
    query(`tbody.${type} tr`).forEach(row => row.style.display = 
      filters.every((f, i) => f.test(row.cells[i].textContent)) ? '' : 'none');
}
if (document.getElementById('playerSearch'))
document.getElementById('playerSearch').addEventListener('keyup', function() {
    filterTable('players');
});
if (document.getElementById('monsterSearch'))
document.getElementById('monsterSearch').addEventListener('keyup', function() {
    filterTable('monsters');
});

if (document.getElementById('staffSearch'))
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

const parkingSwitch = document.getElementById('parkingSwitch');
const parkingText = document.getElementById('parking');
const campingSwitch = document.getElementById('campingSwitch');
const campingText = document.getElementById('camping');
const bunkSwitch = document.getElementById('bunkSwitch');
const bunksText = document.getElementById('bunks');
const notesSwitch = document.getElementById('notesSwitch');
const notesText = document.getElementById('notes');

parkingSwitch.addEventListener('change', () => {
        parkingText.classList.toggle('d-none');
        parkingText.disabled = !parkingSwitch.checked;
})

campingSwitch.addEventListener('change', () => {
    campingText.classList.toggle('d-none');
    campingText.disabled = !campingSwitch.checked;
})

bunkSwitch.addEventListener('change', () => {
    bunksText.classList.toggle('d-none');
    bunksText.disabled = !bunkSwitch.checked;
})

notesSwitch.addEventListener('change', () => {
    notesText.classList.toggle('d-none');
    notesText.disabled = !notesSwitch.checked;
})

async function eventPackDownload(){
    const eventPackForm = document.getElementById('eventPackForm');
    eventPackForm.action= `/admin/events/<%= event._id %>/print/eventPack`;
    eventPackForm.submit();
  }

  async function eventPackEmail(){
    const eventPackForm = document.getElementById('eventPackForm');
    eventPackForm.classList.add('d-none');
    var spinner = document.createElement("div");
    spinner.classList.add('spinner-border');
    spinner.classList.add('text-dark');
    document.getElementById('spinnerDiv').classList.add('text-center');
    spinner.role = 'status';
    document.getElementById('spinnerDiv').appendChild(spinner);
    const data = new URLSearchParams();
    for (const pair of new FormData(eventPackForm)) {
        data.append(pair[0], pair[1]);
    }
    fetch(`/admin/events/<%= event._id %>/print/eventPack?email=true`, {
        method: 'post',
        body: data,
    })
    .then((response) => {
        document.getElementById('spinnerDiv').removeChild(spinner);
        let completeP = document.createElement('p');
        if (response.ok)
          completeP.innerText = "All attendee's e-mailed!"
        else{
          completeP.classList.add('text-danger');
          completeP.innerText = "There has been a problem sending the event pack email!"
        }
        document.getElementById('spinnerDiv').appendChild(completeP);
    });
  }

  async function customEmail(){
    const customEmailForm = document.getElementById('customEmailForm');
    const spinnerDiv = document.getElementById('spinnerDivEmail');
    customEmailForm.classList.add('d-none');
    var spinner = document.createElement("div");
    spinner.classList.add('spinner-border');
    spinner.classList.add('text-dark');
    spinnerDiv.classList.add('text-center');
    spinner.role = 'status';
    spinnerDiv.appendChild(spinner);
    const data = new URLSearchParams();
    for (const pair of new FormData(customEmailForm)) {
        data.append(pair[0], pair[0] == 'message' ? tinyMCE.get('message').getContent() : pair[1]);
    }
    fetch(`/admin/events/<%= event._id %>/email`, {
        method: 'post',
        body: data,
    })
    .then((response) => {
        spinnerDiv.removeChild(spinner);
        let completeP = document.createElement('p');
        if (response.ok)
          completeP.innerText = "All attendee's e-mailed!"
        else{
          completeP.classList.add('text-danger');
          completeP.innerText = "There has been a problem sending the email!"
        }
        spinnerDiv.appendChild(completeP);
    });
  }

  function addMeal(day) {
    const mealId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const mealsDiv = document.getElementById(`meals${day}`);
    const mealCont = document.createElement('div');
    mealCont.id = `meals${mealId}`;
    mealCont.classList.add('my-3',);
    let titleDiv = document.createElement('div');
    
    let titleInput = document.createElement('input');
    titleInput.classList.add('form-control');
    titleInput.name = `catering[menu][${day}][meals][${mealId}][name]`;
    titleInput.placeholder ='Breakfast, Lunch, Dinner, etc...'
    titleDiv.appendChild(titleInput);
    mealCont.appendChild(titleDiv);
    let optionDiv = document.createElement('div');
    optionDiv.classList.add('ms-4');
    optionDiv.id = `options${mealId}`
    mealCont.appendChild(optionDiv);
    let optionRow = document.createElement('div');
    optionRow.classList.add('row')
    optionCol1 = document.createElement('div')
    optionCol1.classList.add('col')
    let addOption = document.createElement('a');
    addOption.href = '#';
    addOption.innerHTML = 'Add Meal Option'
    addOption.classList.add('link-dark','mt-0');
    addOption.addEventListener('click', () => addMealOption(optionDiv,day,mealId))
    optionCol1.appendChild(addOption);
    optionCol2 = document.createElement('div')
    optionCol2.classList.add('col-3','text-end')
    let delOption = document.createElement('a');
    delOption.href = '#';
    delOption.innerHTML = 'Delete'
    delOption.classList.add('link-danger','mt-0');
    delOption.addEventListener('click', () => delMeal(mealsDiv,mealCont))
    optionCol2.appendChild(delOption);
    optionRow.appendChild(optionCol1)
    optionRow.appendChild(optionCol2)

    mealCont.appendChild(optionRow);
    mealsDiv.appendChild(mealCont);
  }

  function addMealOption(parent,day,mealId) {
    let optionDiv = document.createElement('div')
    optionDiv.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    optionDiv.classList.add('input-group');
    let mealOption = document.createElement('input');
      mealOption.classList.add('form-control','form-control-sm');
      mealOption.name = `catering[menu][${day}][meals][${mealId}][options]`;
      mealOption.placeholder ='Food option (V,GF)'
      let delOption = document.createElement('a');
      delOption.href = '#';
      delOption.innerHTML = '<i class="bi bi-trash3-fill"></i>'
      delOption.classList.add('link-danger','input-group-text');
      delOption.addEventListener('click', () => delMealOption(`options${mealId}`,optionDiv))

      optionDiv.appendChild(delOption);
      optionDiv.appendChild(mealOption);
      if (typeof parent == 'string'){
        document.getElementById(parent).appendChild(optionDiv);
      }
      else{
        parent.appendChild(optionDiv);
      }
  }

  function delMeal(parent,mealDiv){
    if (typeof parent == 'string')
      document.getElementById(parent).removeChild(document.getElementById(mealDiv))
    else
      parent.removeChild(mealDiv);
  }

  function delMealOption(parent,option){
    if (typeof option == 'string')
      document.getElementById(parent).removeChild(document.getElementById(option))
    else
      document.getElementById(parent).removeChild(option);
  }

  function emailCatering(){
    document.getElementById('cateringForm').action = '/admin/events/<%= event._id %>/catering?email=true'
    document.getElementById('cateringForm').submit()
  }
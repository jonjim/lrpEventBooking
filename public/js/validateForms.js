let recaptcha = document.getElementById('recaptcha');

(function () {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.validated-form')

    // Loop over them and prevent submission
    Array.from(forms)
        .forEach(function(form) {
            form.addEventListener('submit', async function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated')
            }, true)
        })
})()

function selectText(containerid) {
    if (document.selection) { // IE
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(containerid));
        range.select();
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }
}


if (recaptcha) {
    grecaptcha.ready(async function () {
         grecaptcha.execute('6LcDm2kpAAAAAH4rSLWeH8nX3qB0EgVtY3t_lN4B', {action: 'submit'}).then(function(token) {
             document.getElementById('recaptcha').value = token
        });
     });
}
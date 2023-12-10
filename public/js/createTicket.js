document.getElementById('ticketType').addEventListener("change", function(){
    if (document.getElementById('ticketType').value == "mealTicket" || document.getElementById('ticketType').value == "mealTicketChild"){
        document.getElementById('catererRow').classList.remove("d-none");
    }
    else{
        if (!document.getElementById('catererRow').classList.contains('d-none'))
        document.getElementById('catererRow').classList.add('d-none');
        document.getElementById('caterer').value = '';
    }
})
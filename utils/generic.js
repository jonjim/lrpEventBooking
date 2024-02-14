function dateOutput(str){
    return new Date(str).toLocaleDateString('en-GB');
}

function timeOutput(str){
    return new Date(str).toLocaleTimeString('en-GB',{hour: '2-digit', minute:'2-digit'})
}

function currencyOutput(str){
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(str)
}

module.exports = {dateOutput,timeOutput,currencyOutput}
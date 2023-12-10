try {
    document.getElementById('btnPayCash').addEventListener('click', function() {
        document.getElementById('frmPaid').value = true;
        document.getElementById('frmDate').value = new Date();
        document.getElementById('frmTotal').value = document.getElementById('frmTotalDue').value;
        document.getElementById('frmGate').value = false;
        document.getElementById('formUpdate').submit();
    });
} catch {}

try {
    document.getElementById('btnPayGate').addEventListener('click', function() {
        document.getElementById('frmPaid').value = false;
        document.getElementById('frmDate').value = null;
        document.getElementById('frmTotal').value = 0;
        document.getElementById('frmGate').value = true;
        document.getElementById('formUpdate').submit();
    });
} catch {}

try {
    document.getElementById('btnDelete').addEventListener('click', function() {
        document.getElementById('formDelete').submit();
    });
} catch {}

try {
    document.getElementById('btnCancel').addEventListener('click', function() {
        document.getElementById('formCancel').submit();
    });
} catch {}

try {
    document.getElementById('btnAddQueue').addEventListener('click', function() {
        document.getElementById('formQueueAdd').submit();
    });
} catch {}

try {
    document.getElementById('btnDelQueue').addEventListener('click', function() {
        document.getElementById('formQueueDel').submit();
    });
} catch {}
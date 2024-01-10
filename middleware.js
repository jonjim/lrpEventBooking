module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be logged in to do that!');
        return res.render('user/login', { title: 'Login' });
    }
    if (req.originalUrl == '/logout') next();
    if ((typeof req.user.username == 'undefined') && (req.originalUrl.split('/')[1] != 'account' || (req.originalUrl.split('/')[1] != 'account' && req.originalUrl.split('/')[2] != 'character'))) {
        req.session.returnTo = req.originalUrl;
        req.flash('warn', 'warning');
        return res.redirect('/account');
    }
    next();
}

module.exports.isMatchingEventHost = (req, res, next) => {
    if (['eventHost','systemAdmin','admin', 'superAdmin'].includes(req.user.role) && (req.user.eventHosts.filter(a => a._id.equals(req.params.id)).length > 0) || ['systemAdmin','admin', 'superAdmin'].includes(req.user.role)) {
        next();
    } else {
        req.flash('error', "You don't have permission to do that!");
        return res.redirect('/');
    }
}

module.exports.isEventHost = (req, res, next) => {
    if (!['eventHost','systemAdmin', 'admin', 'superAdmin'].includes(req.user.role)) {
        req.flash('error', "You don't have permission to do that!");
        return res.redirect('/');
    }
    next();
}

module.exports.isSystemAdmin = (req,res,next) => {
    if (!['systemAdmin','admin', 'superAdmin'].includes(req.user.role)) {
        req.flash('error', "You don't have permission to do that!");
        return res.redirect('/');
    }
    next();
}

module.exports.isMatchingSystemAdmin = (req,res,next) => {
    if ((['systemAdmin','admin', 'superAdmin'].includes(req.user.role) && req.user.eventSystems.filter(a => a._id.equals(req.params.id)).length > 0) || ['admin', 'superAdmin'].includes(req.user.role)) {
        next();
    }
    else { 
        req.flash('error', "You don't have permission to do that!");
        return res.redirect('/');
    }
}

module.exports.isAdmin = (req, res, next) => {
    if (!['admin', 'superAdmin'].includes(req.user.role)) {
        req.flash('error', "You don't have permission to do that!");
        return res.redirect('/');
    }
    next();
}

module.exports.isSuperAdmin = (req, res, next) => {
    if (!['superAdmin'].includes(req.user.role)) {
        req.flash('error', "You don't have permission to do that!");
        return res.redirect('/');
    }
    next();
}

module.exports.usernameToLowerCase = (req, res, next) => {
    req.body.username = req.body.username.toLowerCase();
    next();
}
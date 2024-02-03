if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const passport = require('passport');
const localStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const mongoSanitize = require('express-mongo-sanitize');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const flash = require('connect-flash');

const authRouter = require('./routes/user');
const eventRouter = require('./routes/events');
const aboutRouter = require('./routes/about');
const paypalRouter = require('./routes/paypal');
const adminRouter = require('./routes/admin');

const emailService = require('./utils/email');
const ExpressError = require('./utils/ExpressError')


mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        
    })
    .catch(err => {
        console.log('Error connection to MongoDB');
        console.log(err);
    });
emailService.verifyEmail();

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());



const Auth = require('./models/user')
const siteConfig = require('./models/siteConfig');

const store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: process.env.SECRET
    }
});

const sessionConfig = {
    store: store,
    name: 'larpEventBooking.sid',
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.ROOT_URL}/auth/google/callback`
    },
    async function(accessToken, refreshToken, profile, done) {
        const findUser = await Auth.find({ googleId: profile.id });
        if (findUser.length === 0) {
            const newUser = await new Auth({
                googleId: profile.id,
                username: profile.emails[0].value,
                firstname: profile.name.givenName,
                surname: profile.name.familyName,
                role: 'user'
            });
            await newUser.save();
            return done(null, newUser);
        } else {
            return done(null, findUser);
        }
    }
));
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.ROOT_URL}/auth/facebook/callback`
    },
    async function(accessToken, refreshToken, profile, done) {
        const findUser = await Auth.find({ facebookId: profile.id });
        if (findUser.length === 0) {
            const newUser = await new Auth({
                facebookId: profile.id,
                firstname: profile.displayName,
                username: profile.email ? profile.email : '',
                role: 'user'
            });
            await newUser.save();
            return done(null, newUser);
        } else {
            return done(null, findUser);
        }
    }
));
passport.use(new localStrategy(Auth.authenticate()));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(id, done) {
    Auth.findById(id, function(err, user) {
        done(err, user);
    });
});

async function loadConfig() {
    return await siteConfig.findOne();
}

let config;
loadConfig().then((configRecord) => {
    config = configRecord
})

const {getSystemData} = require('./utils/systemCheck')
const {dateOutput,timeOutput,currencyOutput} = require('./utils/generic')
app.use( async (req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.warn = req.flash('warn');
    res.locals.currentUser = req.user;
    res.locals.path = req.path;
    res.locals.adminGroups = ['admin', 'superAdmin'];
    res.locals.hostGroups = ['eventHost', 'admin', 'superAdmin'];
    res.locals.rootUrl = process.env.ROOT_URL
    res.locals.systemData = getSystemData
    res.locals.dateOutput = dateOutput
    res.locals.timeOutput = timeOutput
    res.locals.currencyOutput = currencyOutput
    res.locals.config = await loadConfig()

    res.locals.paypalScript = `https://www.paypal.com/sdk/js?client-id=${process.env.PAYPAL_SANDBOX == 'true' ? process.env.PAYPAL_SANDBOX_CLIENT_ID : process.env.PAYPAL_CLIENT_ID}&currency=GBP`
    next();
})

app.use('/', eventRouter);
app.use('/', authRouter);
app.use('/', aboutRouter)
app.use('/paypal', paypalRouter);
app.use('/admin/', adminRouter);

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    if (typeof res.locals.config == 'undefined' || !res.locals.config) return res.render('configCheck', {url: req.originalUrl})
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { title: 'An Error has occured!', err })
})

module.exports = app;
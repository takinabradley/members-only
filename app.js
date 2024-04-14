// Node Standard Library Exports
const path = require('path');

// 3rd party modules
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression')
const {rateLimit} = require('express-rate-limit')
const session = require('express-session');
const passport = require('passport')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const {Strategy: PassportLocalStrategy} = require('passport-local')
const createError = require('http-errors');
const debug = require('debug') /*Enabled through DEBUG environment variables*/
const bcrypt = require('bcryptjs')

// local imports
const User = require('./models/User')
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

/* debugger setup */
const appDebugger = debug('members-only:app')

/* Mongoose configuration */
mongoose.connect(process.env.MONGO_DEV_URL || process.env.MONGO_PROD_URL || '')
  .then(success => appDebugger('mongo connection success'))
  .catch(err => appDebugger('mongo connection fail', err))

const sessionStore = MongoStore.create({client: mongoose.connection.getClient()})

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
/* app.use(rateLimit({
  windowMs: 1000 * 60 * 1,  // limit 50req/min
  limit: 50, 
})) */
app.use(compression())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser()); not needed with sessions
app.use(express.static(path.join(__dirname, 'public')));

/* Passport configuration */
// logic to verify usernames and passwords
passport.use(new PassportLocalStrategy(async (username, password, cb) => {
  
  const user = await User.findOne({ username })
  if (!user) return cb(null, false, { message: "Incorrect username" })

  const match = await bcrypt.compare(password, user.passwordHash)
  if(!match) return cb(null, false, { message: "Incorrect password" })
  return cb(null, user)
}))

// logic to serialize data from a user object
passport.serializeUser(async (user, cb) => {
  cb(null, { id: user.id })
})

// logic to deserialize data from a user object
passport.deserializeUser(async (serializedUser, cb) => {
  try {
    const user = await User.findById(serializedUser.id);
    cb(null, user);
  } catch (err) {
    cb(err);
  };
})

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}))

app.use(passport.session())

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs')
const {asyncErrorHandler} = require('../utils')
const {body, validationResult} = require('express-validator')
const passport = require('passport');
const {User, Message} = require('../models')
const routeDebugger = require('debug')('members-only:routes')


const {redirectIfNotLoggedIn, redirectIfLoggedIn} = require('../middlewares')

const secretCode = process.env.MEMBER_CODE
const secretAdminCode = process.env.ADMIN_CODE
/* GET home page. */

router.get('/', redirectIfNotLoggedIn('/login'), asyncErrorHandler(async (req, res) => {
  const allMessages = await Message.find().populate('author')
  res.render('index', {user: req.user, messages: allMessages})
}))

router.post('/delete', redirectIfNotLoggedIn(303, '/'), asyncErrorHandler(async (req, res) => {
  if(req.body.messageid) await Message.findByIdAndDelete({_id: req.body.messageid})
  res.redirect(303, '/')
}))

router.post('/post', 
  redirectIfNotLoggedIn(303, '/'),
  body('title').isString().trim().escape(),
  body('text').optional({values: 'falsy'}),
  asyncErrorHandler(async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) return redirect(303, '/')
    const text = req.body.text ? req.body.text : ''
    await Message.create({author: req.user.id, title: req.body.title, text})
    res.redirect(303, '/')
  })
)

router.post('/become-member', asyncErrorHandler(async (req, res) => {
  if(!req.user) return res.json({err: "not logged in", msg: "cannot create message"})
  if(req.body.secretCode === secretCode) {
    await User.updateOne({_id: req.user.id}, {isMember: true})
  } else if (req.body.secretCode === secretAdminCode) {
    await User.updateOne({_id: req.user.id}, {isMember: true, isAdmin: true})
  }

  res.redirect('/')
}))

router.get('/login', redirectIfLoggedIn('/'), (req, res) => {
  res.render('login')
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.post('/logout', redirectIfNotLoggedIn(303, '/'), (req, res) => {
  req.logout(err => {
    if(err) next(err)
    res.redirect('/')
  })
})

router.get('/register', redirectIfLoggedIn('/'), (req, res) => {
  res.render('register', {errors: []})
})

router.post('/register', 
  body('username').isString().trim().matches(/[\w!@#$%^&*]*/gu).isLength({min: 3}).escape().withMessage("usernames must contain letters, numbers, or only these special characters: _!@#$%^&*"),
  body('password').isString().trim().matches(/[\w!@#$%^&*]*/gu).isLength({min: 8}).escape().withMessage("passwords must contain letters, numbers, or only these special characters: _!@#$%^&*"),
  body('username').custom(async username => {
    const userExists = await User.findOne({username})
    if(userExists) {
      return false
    } else {
      return true
    }
  }),
  body('confirmPassword').trim().custom((value, {req}) => value === req.body.password).withMessage("Confirm Password field must match password field"),
  asyncErrorHandler(async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) return res.render('register', {errors: errors.array()})

    try {
      const passwordHash = await bcrypt.hash(req.body.password, 10)
      let newUser = await User.create({username: req.body.username, passwordHash})
      req.login(newUser, (err) => {
        if(err) throw new Error('There was an issue logging in')
        res.redirect(303, '/')
      })
    } catch (e) {
      routeDebugger('something went wrong hashing the passwords, or logging in...')
      routeDebugger(e)
      return res.render('register', {errors: [{msg: err.message}]})
    }
  })
)
module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs')
const {asyncErrorHandler} = require('../utils')
const {body, validationResult} = require('express-validator')
const passport = require('passport');
const {User, Message} = require('../models')


const {redirectIfNotLoggedIn, redirectIfLoggedIn} = require('../middlewares')

const secretCode = process.env.MEMBER_CODE
const secretAdminCode = process.env.ADMIN_CODE
/* GET home page. */

router.get('/', redirectIfNotLoggedIn('/login'), asyncErrorHandler(async (req, res) => {
  console.log(req.user.canViewMemberOnlyContent)
  const allMessages = await Message.find().populate('author')
  res.render('index', {user: req.user, messages: allMessages})
}))

router.post('/become-member', asyncErrorHandler(async (req, res) => {
  if(!req.user) return res.json({err: "not logged in", msg: "cannot create message"})
  if(req.body.secretCode === secretCode) {
    await User.updateOne({_id: req.user.id}, {isMember: true})
  }

  res.redirect('/')
}))

router.post('/become-admin', asyncErrorHandler(async (req, res) => {
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

router.get('/register', redirectIfLoggedIn('/'), (req, res) => {
  res.render('register')
})

router.post('/register', 
  body('username').isString().trim().matches(/[\w!@#$%^&*]*/gu).isLength({min: 3}).escape().withMessage("usernames must contain letters, numbers, or only these special characters: _!@#$%^&*"),
  body('password').isString().trim().matches(/[\w!@#$%^&*]*/gu).isLength({min: 8}).escape().withMessage("passwords must contain letters, numbers, or only these special characters: _!@#$%^&*"),
  body('username').custom(async username => {
    console.log('username is', username)
    const userExists = await User.findOne({username})
    console.log('user exists:', console.log(userExists))
    if(userExists) {
      return false
    } else {
      return true
    }
  }),
  body('confirmPassword').trim().custom((value, {req}) => value === req.body.password).withMessage("Confirm Password field must match password field"),
  asyncErrorHandler(async (req, res) => {
    const errors = validationResult(req)
    console.log(errors.array())
    if(!errors.isEmpty()) return res.render('register', {errors: errors.array()})

    try {
      const passwordHash = await bcrypt.hash(req.body.password, 10)
      let newUser = await User.create({username: req.body.username, passwordHash})
      req.login(newUser, (err) => {
        if(err) throw new Error('There was an issue logging in')
        console.log('logged in')
        res.redirect('/')
      })
    } catch (e) {
      console.log('something went wrong hashing the passwords, or logging in...')
      console.log(e)
      return res.render('register', {errors: []})
    }
  })
)
module.exports = router;

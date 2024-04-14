function redirectIfNotLoggedIn(...redirectArgs) {
  return (req, res, next) => {
    if(!req.isAuthenticated()) {
      res.redirect(...redirectArgs)
    } else {
      next()
    }
  }
}

module.exports = redirectIfNotLoggedIn
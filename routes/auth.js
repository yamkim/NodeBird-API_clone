const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

const AuthRouteHandler = {
  signUpAccount: async function(req, res, next) {
    const { email, nick, password } = req.body;
    try {
      const exUser = await User.findOne({ where: { email } });
      if (exUser) {
        return res.redirect('/join?error=exist');
      }
      const hash = await bcrypt.hash(password, 12);
      await User.create({
        email,
        nick,
        password: hash,
      });
      return res.redirect('/');
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  signInAccount: function() {
    passport.authenticate('local', (authError, user, info) => {
      if (authError) {
        console.error(authError);
        return next(authError);
      }
      if (!user) {
        return res.redirect(`/?loginError=${info.message}`);
      }
      return req.login(user, (loginError) => {
        if (loginError) {
          console.error(loginError);
          return next(loginError);
        }
        return res.redirect('/');
      });
    })(req, res, next)
  },

  signOutAccount: function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
  },
}

router.post('/join', isNotLoggedIn, AuthRouteHandler.signUpAccount);
router.post('/login', isNotLoggedIn, AuthRouteHandler.signInAccount);
router.get('/logout', isLoggedIn, AuthRouteHandler.signOutAccount);
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/');
});

module.exports = router;

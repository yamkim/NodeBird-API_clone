const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

module.exports = () => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/auth/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const exUser = await User.findOne({
        where: { snsId: profile.id, provider: 'kakao' },
      });
      if (exUser) {
        // console.log("# [DEBUG] user information in kakaoStrategy:\n", exUser);
        done(null, exUser);
      } else {
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account_email,
          nick: profile.displayName,
          provider: 'kakao',
          snsId: profile.id,
        });
        done(null, newUser);
      }
    } catch (err) {
      console.error(err);
      done(err);
    }
  }));
};

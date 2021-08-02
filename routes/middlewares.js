const jwt = require('jsonwebtoken');
const handleResponse = require('../libs/handleResponse')
const RateLimit = require('express-rate-limit');

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    // console.log('로그인을 해주세요.');
    // res.status(403).send('로그인 필요');
    res.redirect('/');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    const message = encodeURIComponent('로그인한 상태입니다.');
    res.redirect(`/?error=${message}`);
  }
};

exports.verifyToken = (req, res, next) => {
  try {
    req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    if (error.name === 'TokenExpiredError') {
      return handleResponse(419, res);
    } else {
      return handleResponse(401, res);
    }
  }
}

exports.apiLimiter = new RateLimit({
	windowMs: 60 * 1000,
	max: 10,
	delayMs: 0,
	handler(req, res) {
	res.status(this.statusCode).json({
		code: this.statusCode,
		message: '1 분에 한 번만 요청할 수 있습니다.'
	})
	}
});

exports.deprecated = (req, res) => {
  res.status(410).json({
    code: 410,
    message: '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요!',
  })
}
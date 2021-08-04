const url = require('url');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Post, Domain, User, Hashtag } = require('../models');
const { handleResponse } = require('../libs/handleResponse');

const router = express.Router();

async function readDomainRecord(req, res) {
    const { clientSecret } = req.body;
    const ret = await Domain.findOne({
        where: { clientSecret },
        include: {
            model: User,
            attributes: ['nick', 'id'],
        }
    });
    if (!ret) {
        return handleResponse(401, res);
    }
    return ret;
}

async function signJwtToken(domain) {
    const payload = {
        id: domain.User.id,
        nick: domain.User.nick,
    };
    const secret = process.env.JWT_SECRET;
    const option = {
        expiresIn: '55m',
        issuer: 'nodebird'
    }
    const ret = await jwt.sign(payload, secret, option);
    return ret;
}

const v3RouteHandler = {
    setJwtToken: async function(req, res, next) {
        try {
            const domain = await readDomainRecord(req, res);
            const token = await signJwtToken(domain);
            const tokenMsg = '토큰이 발급되었습니다.';
            return res.json({ code: 200, message: tokenMsg, token });
        } catch (err) {
            console.error(err);
            return handleResponse(500, res)
        }
    },

    returnAllPostsForUser: async function (req, res) {
        try {
            const posts = await Post.findAll({
                where: { userId: req.decoded.id }
            });
            res.json({ code: 200, payload: posts })
        } catch (err) {
            console.error(err);
            return handleResponse(500, res);
        }
    },

    returnAllPostsAboutHashtag: async function (req, res, next) {
        // req.params.title: 원하는 hashtag 이름입니다.
        try {
            const hashtag = await Hashtag.findOne({
                where: { title: req.params.title }
            });
            if (!hashtag) {
                return handleResponse(404, res);
            }
            console.log("[DEBUG] hashtag: ", hashtag);
            const posts = await hashtag.getPosts({
                attributes: ['id', 'content']
            });
            return res.json({ code: 200, payload: posts });
        } catch (err) {
            console.error(err);
            return handleResponse(500, res);
        }
    },

    returnProfileAboutFollow: async function (req, res, next) {
        try {
            // token 요청한 사람의 id를 가져옵니다.
            const user = await User.findOne({
                where: { id: req.decoded.id }
            });
            // 해당 유저가 following 하는 유저와 해당 유저를 following 하는 유저를 가져옵니다.
            // 해당 유저의 id, nick에 대한 정보만 가지고 오도록 제한할 수 있습니다.
            const follower = await user.getFollowers({
                attributes: ['id', 'nick', 'email']
            });
            const following = await user.getFollowings({
                attributes: ['id', 'nick', 'email']
            });
            return res.json({
                code: 200,
                follower,
                following,
            })
        } catch (err) {
            console.error(err);
            return handleResponse(500, res);
        }
    },

    checkValidOrigin: async function (req, res, next) {
        const domain = await Domain.findOne({
            // request header의 origin을 파싱하여 domain DB에 있는지 찾아봅니다.
            // NOTE: https://www.opentutorials.org/module/938/7369
            where: {
                host: url.parse(req.get('origin')).host,
            },
        });
        // NOTE: (req, res, next)를 추가하는 부분에 대한 학습 필요!
        if (domain) {
            cors({
                origin: req.get('origin'), // 등록되어있는 domain에 대해서 출처를 미리 명시합니다.
                credentials: true,
            })(req, res, next);
        } else {
            next();
        }
    }, 

    testJwtToken: function(req, res) {
        res.json(req.decoded);
    }

}

// router.use(cors({ credentials: true })); // 모든 주소에 대해 api 요청을 허용하는 경우입니다.
//                                          // Access-Control-Allow-Origin이 *로 설정됩니다.
router.use(v3RouteHandler.checkValidOrigin);
router.post('/token', apiLimiter, v3RouteHandler.setJwtToken);
router.get('/test', verifyToken, apiLimiter, v3RouteHandler.testJwtToken);
router.get('/posts/my', verifyToken, apiLimiter, v3RouteHandler.returnAllPostsForUser);
router.get('/posts/hashtag/:title', verifyToken, apiLimiter, v3RouteHandler.returnAllPostsAboutHashtag);
router.get('/follows/my', verifyToken, v3RouteHandler.returnProfileAboutFollow);

module.exports = router;
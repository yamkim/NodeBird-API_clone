const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken } = require('./middlewares');
const { Post, Domain, User, Hashtag } = require('../models');
const handleResponse = require('../libs/HandleResponse')

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
        expiresIn: '10m',
        issuer: 'nodebird'
    }
    const ret = await jwt.sign(payload, secret, option);
    return ret;
}

const v1RouteHandler = {
    setJwtToken: async function(req, res, next) {
        try {
            const domain = await readDomainRecord(req, res);
            const token = await signJwtToken(domain);
            return res.json({
                code: 200,
                message: '토큰이 발급되었습니다.',
                token,
            });
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

    returnAllPostsAboutHashtag: async function (req, res) {
        // req.params.title: 원하는 hashtag 이름입니다.
        try {
            const hashtag = await Hashtag.findOne({
                where: { title: req.params.title }
            });
            if (!hashtag) {
                return handleResponse(404, res);
            }
            const posts = await hashtag.getPosts();
            return res.json({ code: 200, payload: posts });
        } catch (err) {
            console.error(err);
            return handleResponse(500, res);
        }
    },

    testJwtToken: function(req, res, next) {
        res.json(req.decoded);
    }

}

router.post('/token', v1RouteHandler.setJwtToken);
router.get('/test', verifyToken, v1RouteHandler.testJwtToken);
router.get('/posts/my', verifyToken, v1RouteHandler.returnAllPostsForUser);
router.get('/posts/hashtag/:title', verifyToken, v1RouteHandler.returnAllPostsAboutHashtag);

module.exports = router;
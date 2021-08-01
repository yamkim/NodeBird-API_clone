const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken } = require('./middlewares');
const { Domain, User } = require('../models');

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
        return res.status(401).json({
            code: 401,
            message: '등록되지 않은 도메인입니다.'
        });
    }
    return ret;
}

async function signJwtToken(domain) {
    const ret = await jwt.sign({
            id: domain.User.id,
            nick: domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '10m',
            issuer: 'nodebird',
        });
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
            return res.status(500).json({
                code: 500,
                message: '서버 에러',
            });
        }
    },
    testJwtToken: function(req, res, next) {
        res.json(req.decoded);
    }

}

router.post('/token', v1RouteHandler.setJwtToken);
router.get('/test', verifyToken, v1RouteHandler.testJwtToken);

module.exports = router;
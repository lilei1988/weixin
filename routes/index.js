var express = require('express');
var router = express.Router();
var jsSHA = require('jssha');
var xmlparser = require('express-xml-bodyparser');
var xml2js = require('xml2js');
var builder = new xml2js.Builder();  // JSON->xml
var parser = new xml2js.Parser();   //xml -> json
var request = require('request');
var config = require('../config').config;
var sign = require('../sign.js');

router.get('/getAccessToken', function (req, res, next) {
    var accessTokenUrl = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + config.WxAppId + '&secret=' + config.WxAppSecret;

    request(accessTokenUrl, function (error, response, body) {
            if (error) {
                return res.json({
                    success: false,
                    message: error,
                })

            }
            else {
                body = JSON.parse(body);
                // config.accessToken = body.access_token;
                req.session.accessToken = body.access_token;
                return res.json({
                    success: true,
                    message: '正确返回',
                    data: body,
                });

            }

        }
    );
});

router.get('/', function (req, res, next) {

    var check_sign = sign(req.session.ticket, 'http://lilei.51huijia.net/');


    res.render('test', {issuccess: "success1", check_sign: check_sign})
});

router.get('/interface', function (req, res, next) {
    var token = "lilei";
    var signature = req.query.signature;
    var timestamp = req.query.timestamp;
    var echostr = req.query.echostr;
    var nonce = req.query.nonce;

    var oriArray = new Array();
    oriArray[0] = nonce;
    oriArray[1] = timestamp;
    oriArray[2] = token;
    oriArray.sort();

    var original = oriArray.join('');
    console.log(original)

    var shaObj = new jsSHA("SHA-1", "TEXT");
    shaObj.update(original);
    var scyptoString = shaObj.getHash("HEX");

    // var shaObj = new jsSHA(original, 'TEXT');
    // var scyptoString=shaObj.getHash('SHA-1', 'HEX');

    if (signature == scyptoString) {
        //验证成功
        console.log('验证成功')
        res.end(echostr);

    } else {
        //验证失败
        console.log('验证失败')
    }
});

router.post('/interface', xmlparser({trim: false, explicitArray: false}), function (req, res, next) {

    console.log(JSON.stringify(req.body.xml));

    var form = req.body.xml;

    var result = '<xml>';
    result += '<ToUserName><![CDATA[' + form.fromusername + ']]></ToUserName>';
    result += '<FromUserName><![CDATA[' + form.tousername + ']]></FromUserName>';
    result += '<CreateTime><![CDATA[' + new Date().toLocaleTimeString() + ']]></CreateTime>';
    result += '<MsgType><![CDATA[text]]></MsgType>';
    result += '<Content><![CDATA[' + '嘿嘿嘿' + ']]></Content>';
    result += '</xml>';

    res.end(result);

});

router.get('/menuCreate', function (req, res, next) {
    var menuCreateUrl = 'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + req.session.accessToken;

    var form = {
        "button": [
            {
                "type": "click",
                "name": "今日歌曲",
                "key": "V1001_TODAY_MUSIC"
            },
            {
                "name": "酒店帮",
                "sub_button": [
                    {
                        "type": "view",
                        "name": "服务员版",
                        "url": "http://hotelbang.51haohuo.com/employee"
                    },
                    {
                        "type": "view",
                        "name": "酒店版",
                        "url": "http://hotelbang.51haohuo.com/hotel"
                    },
                    {
                        "type": "click",
                        "name": "赞一下我们",
                        "key": "V1001_GOOD"
                    }]
            }]
    }

    var options = {
        method: 'post',
        url: menuCreateUrl,
        body: JSON.stringify(form),
        headers: {
            'accept': '*/*',
            'content-type': "application/x-www-form-urlencoded",
            'accept-encoding': 'gzip, deflate',
            'accept-language': 'en-US,en;q=0.9',
            'user-agent': 'nodejs rest client'
        }
    }

    request(options, function (error, response, body) {
            if (error) {
                return res.json({
                    success: false,
                    message: error.message,
                })

            }
            else {
                return res.json({
                    success: true,
                    message: '正确返回',
                    data: body,
                })

            }

        }
    );
});

router.get('/authorize', function (req, res, next) {
    var scope = req.query.scope == 1 ? 'snsapi_userinfo' : 'snsapi_base';
    var authorizeUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + config.WxAppId + '&redirect_uri=' + config.WxGetCodeUrl + '&response_type=code&scope=' + scope + '&state=STATE#wechat_redirect';
    res.redirect(authorizeUrl);

});

router.get('/getCode', function (req, res, next) {
    var code = req.query.code;
    var state = req.query.state;

    var oauth2AccessTokenUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + config.WxAppId + '&secret=' + config.WxAppSecret + '&code=' + code + '&grant_type=authorization_code';
    request(oauth2AccessTokenUrl, function (error, response, body) {
            if (error) {
                return res.json({
                    success: false,
                    message: error,
                })

            }
            else {
                console.log(body);
                body = JSON.parse(body);
                req.session.oauth2AccessToken = body.access_token;
                req.session.openid = body.openid;

                res.redirect('/getUserinfo');


            }

        }
    );

});

router.get('/getUserinfo', function (req, res, next) {
    var userInfoUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + req.session.oauth2AccessToken + '&openid=' + req.session.openid + '&lang=zh_CN';
    request(userInfoUrl, function (error, response, body) {
            if (error) {
                return res.json({
                    success: false,
                    message: error,
                })

            }
            else {
                body = JSON.parse(body);
                return res.json({
                    success: true,
                    message: '正确返回',
                    data: body,
                });

            }

        }
    );

});

router.get('/getTicket', function (req, res, next) {
    var getTicketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + req.session.accessToken + '&type=jsapi';
    request(getTicketUrl, function (error, response, body) {
            if (error) {
                return res.json({
                    success: false,
                    message: error,
                })

            }
            else {
                body = JSON.parse(body);
                req.session.ticket = body.ticket;
                return res.json({
                    success: true,
                    message: '正确返回',
                    data: body,
                });

            }

        }
    );

});


module.exports = router;

/**
 * config
 */

var path = require('path');

exports.config = {
    debug: true,
    name: '微信平台',
    cookieSecret: "weixin",
    redisdb: 1,
    redishost: '127.0.0.1',
    redisport: 6379,
    redispass: '',
    redisttl: 7200,
    apiAddress: 'http://192.168.15.228:9002',
    WxAppId: 'wxf621f9dada44ede0',
    WxAppSecret: 'f309b2b694413897bfcf20b3f87c2141',
    WxGetCodeUrl: encodeURIComponent('http://lilei.51huijia.net/getCode')
};
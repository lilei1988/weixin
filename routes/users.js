var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    if (req.secure) {
        res.send('respond with a resource');
    } else {
        res.redirect(301, 'https://example.com/route');
    }

});

module.exports = router;

var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/',require('./home'));
router.use('/dashboard',require('./dashboard/'));
router.use('/items',require('./items/'));
module.exports = router;

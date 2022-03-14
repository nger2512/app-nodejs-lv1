var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/',require('./home'));
router.use('/dashboard',require('./dashboard'));
router.use('/items',require('./items'));
router.use('/groups',require('./groups'));
router.use('/users',require('./users'));
router.use('/category',require('./category'));
module.exports = router;

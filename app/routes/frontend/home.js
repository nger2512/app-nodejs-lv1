var express = require('express');
var router = express.Router();

const folderview = __path_views+'pages/publish/';
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render(folderview+'index', { pageTitle: 'PublishPage' });
});
module.exports = router;

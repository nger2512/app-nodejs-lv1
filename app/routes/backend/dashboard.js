var express = require('express');
var router = express.Router();

router.get('/',(req,res)=>{
    res.render(__path_views+'pages/dashboard/index',{pageTitle:'Dashboard'});
  })

module.exports = router;
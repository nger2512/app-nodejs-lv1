const util = require('util');
const notify = require(__path_configs+'/notify')


const options ={
    name:{min:3,max:20},
    ordering:{min:0,max:20},
    status:{value:'novalue'},
    content : {min:5,max:200},
    
}



    
module.exports ={
    
    validator :(req)=>{
        req.checkBody('name',util.format(notify.ERROR_NAME,options.name.min,options.name.max))
        .isLength({min:options.name.min, max:options.name.max}); /// các tường name,ordering ở form.ejs

        req.checkBody('ordering',util.format(notify.ERROR_ORDERING,options.ordering.min,options.ordering.max))
        .isInt({gt:options.ordering.min,lt:options.ordering.max});
        req.checkBody('status',notify.ERROR_STATUS).isNotEqual(options.status.value);
       
        req.checkBody('group_acp',notify.ERROR_GROUP_ACP).notEmpty();
        req.checkBody('content',util.format(notify.ERROR_NAME,options.content.min,options.content.max))
        .isLength({min:options.content.min, max:options.content.max});
        
        
    },
    
   
}



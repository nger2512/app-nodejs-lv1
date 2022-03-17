const util = require('util');
const notify = require(__path_configs+'/notify')


const options ={
    name:{min:6,max:20},
    ordering:{min:0,max:100},
    status:{value:'novalue'},
    content : {min:5,max:200},
    group :{value:'allvalue'},
    
}



    
module.exports ={
    
    validator :(req,errUpload,taskCurrent)=>{
        req.checkBody('name',util.format(notify.ERROR_NAME,options.name.min,options.name.max))
        .isLength({min:options.name.min, max:options.name.max});

        req.checkBody('ordering',util.format(notify.ERROR_ORDERING,options.ordering.min,options.ordering.max))
        .isInt({gt:options.ordering.min,lt:options.ordering.max});
        req.checkBody('status',notify.ERROR_STATUS).isNotEqual(options.status.value);
        req.checkBody('group_id',notify.ERROR_SELECT_GROUP).isNotEqual(options.group.value);
        req.checkBody('content',util.format(notify.ERROR_NAME,options.content.min,options.content.max))
        .isLength({min:options.content.min, max:options.content.max});
        
        let errors = req.validationErrors() !== false ? req.validationErrors() : [];
        

		if (errUpload) {
			if(errUpload.code == 'LIMIT_FILE_SIZE') {
				errUpload = notify.ERROR_FILE_LIMIT;
			};
			errors.push({param: 'avatar', msg: errUpload});
		}else {
			if(req.file == undefined && taskCurrent == "add"){
				errors.push({param: 'avatar', msg: notify.ERROR_FILE_REQUIRE});
			}
        }
    return errors;
    }, 
}



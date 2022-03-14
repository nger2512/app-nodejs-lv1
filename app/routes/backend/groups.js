const express = require('express');
const router = express.Router();
const groupModel = require(__path_models+'groups');
const userModel = require(__path_models+'users');
const utilsHelpers = require(__path_helpers+'utils');
const paramsHelpers = require(__path_helpers+'/params');
const systemConfig = require(__path_configs+'system')
const { response } = require('express');
const res = require('express/lib/response');
const { link } = require('fs');
const { getParams } = require(__path_helpers+'params');
const validators = require(__path_validates+'groups');
const notify = require(__path_configs+'notify');
const util = require('util');
const session = require('express-session');

const linkIndex = '/'+systemConfig.prefixAdmin+'/groups/';

const pageTitleIndex = 'Group Management';
const pageTitleAdd = pageTitleIndex +' - Add';
const pageTitleEdit = pageTitleIndex +' - Edit';

const folderview = __path_views+'pages/groups/';

//GET LIST FOLLOW STATUS
router.get('(/status/:status)?', async function(req,res){
    let params 		 = {};
	params.search		 = paramsHelpers.getParams(req.query, 'search', '');
	params.currentStatus= paramsHelpers.getParams(req.params, 'status', 'all'); 
	params.sortField  	 = paramsHelpers.getParams(req.session, 'sort_field', 'name');
	params.sortType 	 = paramsHelpers.getParams(req.session, 'sort_type', 'asc');

	params.pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 5,
		currentPage		 : parseInt(paramsHelpers.getParams(req.query, 'page', 1)),
		pageRanges		 : 3
	};

	let statusFilter = await utilsHelpers.createFilterStatus(params.currentStatus, 'groups');
	await groupModel.countItem(params).then( (data) => {
		params.pagination.totalItems = data;
	});
	
	groupModel.listItems(params)	
		.then( (items) => {
			res.render(`${folderview}list`, { 
				pageTitle: pageTitleIndex,
				items,
				statusFilter,
				params
			});
		});
    
})

//CHANGE STATUS WHEN WE CLICK
router.get('/change-status/:id/:status',async(req,res)=>{
    let currentStatus = paramsHelpers.getParams(req.params,'status','active');
    let id = paramsHelpers.getParams(req.params,'id','');
    // get changeStatus in model
    await groupModel
    .changeStatus(id, currentStatus, {task: "update-one"})
    .then((result)=> {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
       
	})
    
})
//CHANGE STATUS OF MANY ITEMS
router.post('/change-status/:status/',async(req,res)=>{
    let currentStatus = paramsHelpers.getParams(req.params,'status','active');
    //console.log(req.body);
    await groupModel.changeStatus(req.body.cid,currentStatus,{task:'update-many'}).then((result,err)=>{ // affected is array
        if(err) console.log(err);
        //console.log(result);
        req.flash('success',util.format(notify.CHANGE_STATUS_MULTI_SUCCESS,result.matchedCount),false); // phương thức util
        res.redirect(linkIndex);
    })
})
//DELETE 1 ITEM
router.get('/delete/:id',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    await groupModel.deleteItem(id,{task:'delete-one'})
    .then((result)=>{
        req.flash('success',util.format(notify.DELETE_MULTI_SUCCESS,result.deletedCount),false);
        res.redirect(linkIndex);
    }).catch(err=>{
        console.log(err);
    })
})
//CHANGE ORDERING OF MANY ITEMS
router.post('/change-ordering',async(req,res)=>{
    let cids 		= req.body.cid;
	let orderings 	= req.body.ordering;

	groupModel.changeOrdering(cids, orderings, null).then((result)=>{
		req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
		res.redirect(linkIndex);
	});
})
//DELETE STATUS OF MANY ITEMS
router.post('/delete',async(req,res)=>{
    await groupModel.deleteItem(req.body.cid,{task:'delete-many'}).then((result,err)=>{ // affected is array
        if(err) console.log(err);
        console.log(result);
        req.flash('success',util.format(notify.DELETE_MULTI_SUCCESS,result.deletedCount),false); // phương thức util
        res.redirect(linkIndex);
    })
})



//GET FORM FOLLOW ADD OR EDIT 
router.get('/form(/:id)?',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    let errors =null;
    let item ={name:'',ordering:0,status:'novalue'}
    if(id !=='' &&  id !== undefined){
        groupModel.getItem(id).then((item,err)=>{
            if(err) console.error(err);
            res.render(`${folderview}/form`,{pageTitle:pageTitleEdit,item,errors});
        })    
    }else{
        res.render(`${folderview}/form`,{pageTitle:pageTitleAdd,item,errors});
    }
    
})
//post add, edit
router.post('/save',async(req,res)=>{
    req.body = JSON.parse(JSON.stringify(req.body));
    validators.validator(req);
    let item = Object.assign(req.body); // copy data in form
    let errors = req.validationErrors(); //hàm trong validator
    let taskCurrent = (typeof item!==undefined && item.id!=='')?"edit":"add";
    if(errors){
        let pageTitle = (taskCurrent=='add')?pageTitleAdd:pageTitleEdit;
        res.render(`${folderview}/form`,{pageTitle,item,errors});
    }else{
        let message = (taskCurrent == "add") ? notify.ADD_SUCCESS : notify.EDIT_SUCCESS;
		groupModel.saveItem(item, {task: taskCurrent}).then((result) => {
			if(taskCurrent == "add") {
				req.flash('success', message, false);
				res.redirect(linkIndex);
			}else if(taskCurrent == "edit") {
				userModel.saveItem(item, {task: 'change-group-name'}).then((result) => {
					req.flash('success', notify.EDIT_SUCCESS, false);
					res.redirect(linkIndex);
				});
			}
		});
    }
    // if(typeof item!==undefined && item.id!==''){ //edit
    //     if(errors!== false){ //err
    //         res.render(`${folderview}/form`,{pageTitle:pageTitleEdit,item,errors});
    //     }else{//no err
            //edit task

    //     }
    // }else{//add
        
    //     if(errors!== false){ //err
    //         res.render(`${folderview}/form`,{pageTitle:pageTitleAdd,item,errors});
    //     }else{//no err
    //         groupModel.saveItem(item,{task:"add"}).then((result)=>{
    //             req.flash('success',notify.ADD_SUCCESS,false);
    //             res.redirect(linkIndex);
    //         }).catch(err=>{
    //             console.log(err);
    //         })
    //     }
    // }  
})

router.get('/sort/:sort_field/:sort_type',(req,res)=>{
    let sort_field= paramsHelpers.getParams(req.params,'sort_field','ordering');
    let sort_type = paramsHelpers.getParams(req.params,'sort_type','asc');
    
    req.session.sort_field = sort_field;
    req.session.sort_type = sort_type;
    res.redirect(linkIndex);
    
});

router.get('/change-group-acp/:id/:group_acp',async(req,res)=>{
    let currentGroupACP	= paramsHelpers.getParams(req.params, 'group_acp', 'yes'); 
	let id				= paramsHelpers.getParams(req.params, 'id', ''); 
	
	groupModel.changeGroupACP(currentGroupACP, id , null).then( (result) => {
		req.flash('success', notify.CHANGE_GROUP_ACP_SUCCESS, false);
		res.redirect(linkIndex);
	});
})


module.exports = router;
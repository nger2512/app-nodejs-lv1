const express = require('express');
const router = express.Router();
const categoryModel = require(__path_models+'category');
const utilsHelpers = require(__path_helpers+'utils');
const paramsHelpers = require(__path_helpers+'/params');
const systemConfig = require(__path_configs+'system')
const { response } = require('express');
const res = require('express/lib/response');
const { link } = require('fs');
const { getParams } = require(__path_helpers+'params');
const validators = require(__path_validates+'category');
const notify = require(__path_configs+'notify');
const util = require('util');
const session = require('express-session');

const linkIndex = '/'+systemConfig.prefixAdmin+'/category/';

const pageTitleIndex = 'Category Management';
const pageTitleAdd = pageTitleIndex +' - Add';
const pageTitleEdit = pageTitleIndex +' - Edit';

const folderview = __path_views+'pages/category/';

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

	let statusFilter = await utilsHelpers.createFilterStatus(params.currentStatus, 'category');
	await categoryModel.countItem(params).then( (data) => {
		params.pagination.totalItems = data;
	});
	
	categoryModel.listItems(params)	
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
    await categoryModel
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
    await categoryModel.changeStatus(req.body.cid,currentStatus,{task:'update-many'}).then((result,err)=>{ // affected is array
        if(err) console.log(err);
        //console.log(result);
        req.flash('success',util.format(notify.CHANGE_STATUS_MULTI_SUCCESS,result.matchedCount),false); // phương thức util
        res.redirect(linkIndex);
    })
})
//CHANGE ORDERING OF ONE OR MANY ITEMS
router.post('/change-ordering',async(req,res)=>{
    let cids = req.body.cid;
    let orderings = req.body.ordering;
    categoryModel.changeOrdering(cids,orderings,null).then((result)=>{  
        req.flash('success',notify.CHANGE_ORDERING_SUCCESS,false);
        res.redirect(linkIndex);     
    })
})
//DELETE 1 ITEM
router.get('/delete/:id',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    await categoryModel.deleteItem(id,{task:'delete-one'})
    .then((result)=>{
        req.flash('success',util.format(notify.DELETE_MULTI_SUCCESS,result.deletedCount),false);
        res.redirect(linkIndex);
    }).catch(err=>{
        console.log(err);
    })
})

//DELETE STATUS OF MANY ITEMS
router.post('/delete',async(req,res)=>{
    await categoryModel.deleteItem(req.body.cid,{task:'delete-many'}).then((result,err)=>{ // affected is array
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
        categoryModel.getItem(id).then((item,err)=>{
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
	let item 	= Object.assign(req.body);
	let taskCurrent	= (typeof item !== "undefined" && item.id !== "" ) ? "edit" : "add";

	let errors = validators.validator(req);
		
	if(errors) { 
		let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
		res.render(`${folderView}form`, { pageTitle, item, errors});
	}else {
		let message = (taskCurrent == "add") ? notify.ADD_SUCCESS : notify.EDIT_SUCCESS;
		await categoryModel.saveItem(item, {task: taskCurrent}).then((result) => {
			req.flash('success', message, false);
			res.redirect(linkIndex);
		});
	}
})

router.get('/sort/:sort_field/:sort_type',(req,res)=>{
    let sort_field= paramsHelpers.getParams(req.params,'sort_field','ordering');
    let sort_type = paramsHelpers.getParams(req.params,'sort_type','asc');
    
    req.session.sort_field = sort_field;
    req.session.sort_type = sort_type;
    res.redirect(linkIndex);
    
});

module.exports = router;
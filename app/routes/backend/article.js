const express = require('express');
const router = express.Router();
const articleModel = require(__path_models+'article');
const categoryModel = require(__path_models+'category');
const utilsHelpers = require(__path_helpers+'utils');
const paramsHelpers = require(__path_helpers+'/params');
const systemConfig = require(__path_configs+'system')
const { response } = require('express');
const res = require('express/lib/response');
const { link } = require('fs');
const { getParams } = require(__path_helpers+'params');
const validators = require(__path_validates+'article');
const notify = require(__path_configs+'notify');
const util = require('util');
const session = require('express-session');
const fileHelper = require(__path_helpers+'file');
const fs = require('fs');

const linkIndex = '/'+systemConfig.prefixAdmin+'/article/';

const pageTitleIndex = 'Article Management';
const pageTitleAdd = pageTitleIndex +' - Add';
const pageTitleEdit = pageTitleIndex +' - Edit';

const folderview = __path_views+'pages/article/';

const uploadThumb = fileHelper.upload(
    'thumb',
    'article',
)


//GET LIST FOLLOW STATUS
router.get('(/status/:status)?', async function(req,res){
    let params ={};
    params.search = paramsHelpers.getParams(req.query,'search',''); // return value of search if it has
    params.currentStatus = paramsHelpers.getParams(req.params,'status','all');// return value of status and default is 'all' status
    let statusFilter =await utilsHelpers.createFilterStatus(params.currentStatus,'article');
    //sắp xếp
    params.sortField = paramsHelpers.getParams(req.session,'sort_field','name');
    params.sortType = paramsHelpers.getParams(req.session,'sort_type','asc');
    // selectbox group
    params.categoryID = paramsHelpers.getParams(req.session,'category_id','');

    params.pagination={
		totalItems		 : 1,
		totalItemsPerPage: 5,
		currentPage		 : parseInt(paramsHelpers.getParams(req.query, 'page', 1)),
		pageRanges		 : 3
	};
    let categoryItems = [];
    await categoryModel.listItemsInSelectbox().then((items)=>{ ///await xong find thì load ra items of group
        categoryItems = items;
        categoryItems.unshift({_id:'allvalue',name: 'All Category'});
    });
    //console.log(pagination);
    //let position = (pagination.currentPage-1)*pagination.totalItemsPerPage;
    //if(groupID!=='allvalue') objWhere['group.id'] = groupID; //objWhere = {'group.id' : groupID};
    //if(currentStatus !== 'all') objWhere.status = currentStatus; // lấy trạng thái hiện tại
    //if(search !== '') objWhere.name = {'$regex': search, '$options': 'i'};//tìm kiếm
    await articleModel.countItem(params).exec().then(async (data)=>{
        params.pagination.totalItems=data;    
    })
    await articleModel.listItems(params).then((items)=>{
        res.render(`${folderview}list`, { 
            pageTitle: pageTitleIndex,
            items,
            statusFilter,
            params,
            categoryItems
        });
    })
    .catch(err=>{
        console.log(err);
    })
})

//CHANGE STATUS WHEN WE CLICK
router.get('/change-status/:id/:status',async(req,res)=>{
    let currentStatus = paramsHelpers.getParams(req.params,'status','active');
    let id = req.params.id;
    await articleModel.changeStatus(id,currentStatus,{task:'update-one'}).then((doc)=>{
        req.flash('success',notify.CHANGE_STATUS_SUCCESS,false);
        res.redirect(linkIndex);
    }).catch(err=>{
        console.log('update error',err);
    });
})

//CHANGE STATUS OF MANY ITEMS
router.post('/change-status/:status/',async (req,res)=>{
    let currentStatus = paramsHelpers.getParams(req.params,'status','active');
    //console.log(req.body);
    await articleModel.changeStatus(req.body.cid,currentStatus,{task:'update-many'}).then((affected,err)=>{ // affected is array
        if(err)  req.flash('warn','error',false);
        req.flash('success',util.format(notify.CHANGE_STATUS_MULTI_SUCCESS,affected.matchedCount),false);
        res.redirect(linkIndex);   
    })
})
//CHANGE ORDERING OF MANY ITEMS
router.post('/change-ordering',async(req,res)=>{
    let cids 		= req.body.cid;
	let orderings 	= req.body.ordering;
	
	articleModel.changeOrdering(cids, orderings, null).then((result)=>{
		req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
		res.redirect(linkIndex);
	});
})
//DELETE 1 ITEM
router.get('/delete/:id',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    
    articleModel.deleteItem(id,{task : 'delete-one'})
    .then(result=>{
        req.flash('success',notify.DELETE_SUCCESS,false);
        res.redirect(linkIndex);
    }).catch(err=>{
        console.log(err);
    })
})

//DELETE STATUS OF MANY ITEMS
router.post('/delete',async(req,res)=>{
    await articleModel.deleteItem(req.body.cid,{task:'delete-many'}).then((result)=>{
        //console.log(result);
        req.flash('success',util.format(notify.DELETE_MULTI_SUCCESS,result.deletedCount),false);
        res.redirect(linkIndex);
    })
})



//GET FORM FOLLOW ADD OR EDIT 
router.get('/form(/:id)?',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    let item ={name:'',ordering:0,status:'novalue',category_id : '',category_name :''};
    let errors =null;
    let categoryItems = [];
    await categoryModel.listItemsInSelectbox().then((items)=>{ ///await xong find thì load ra items of group
        categoryItems = items;
        categoryItems.unshift({_id:'allvalue',name: 'Choose Category'});
    });
    
    if(id===''){
        res.render(`${folderview}/form`,{pageTitle:pageTitleAdd,item,errors,categoryItems});
    }else{
         articleModel.getItem(id).then((item)=>{
            item.category_id = item.category.id;
			item.category_name = item.category.name;
            //console.log(item);
            res.render(`${folderview}/form`,{pageTitle:pageTitleEdit,item,errors,categoryItems});
        });
    }

        
    
})
//post add, edit
router.post('/save',  (req, res, next) => {
	uploadThumb(req, res, async (errUpload) => {
		req.body = JSON.parse(JSON.stringify(req.body));

		let item = Object.assign(req.body);
		let taskCurrent	= (typeof item !== "undefined" && item.id !== "" ) ? "edit" : "add";

		let errors = validators.validator(req, errUpload, taskCurrent);
		
		if(errors.length > 0) { 
			let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
			if(req.file != undefined) fileHelper.remove('public/uploads/article/', req.file.filename); // xóa tấm hình khi form không hợp lệ
		
			let categoryItems	= [];
			await categoryModel.listItemsInSelectbox().then((items)=> {
				categoryItems = items;
				categoryItems.unshift({_id: 'allvalue', name: 'All Category'});
			});
			
			if (taskCurrent == "edit") item.thumb = item.image_old;
			res.render(`${folderview}form`, { pageTitle, item, errors, categoryItems});
		}else {
			let message = (taskCurrent == "add") ? notify.EDIT_SUCCESS : notify.EDIT_SUCCESS;
			if(req.file == undefined){ // không có upload lại hình
				item.thumb = item.image_old;
			}else{
				item.thumb = req.file.filename;
				if(taskCurrent == "edit") fileHelper.remove('public/uploads/article/', item.image_old);
			}

			articleModel.saveItem(item, {task: taskCurrent}).then((result) => {
				req.flash('success', message, false);
				res.redirect(linkIndex);
			});
		}
	});
});
    


router.get('/sort/:sort_field/:sort_type',(req,res)=>{
    let sort_field= paramsHelpers.getParams(req.params,'sort_field','ordering');
    let sort_type = paramsHelpers.getParams(req.params,'sort_type','asc');
    
    req.session.sort_field = sort_field;
    req.session.sort_type = sort_type;
    res.redirect(linkIndex);
    
});
router.get('/filter-category/:category_id/',(req,res)=>{
    let category_id= paramsHelpers.getParams(req.params,'category_id','');

    
    req.session.category_id = category_id;

    res.redirect(linkIndex);
    
});

module.exports = router;
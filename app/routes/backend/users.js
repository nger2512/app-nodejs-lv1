const express = require('express');
const router = express.Router();
const userModel = require(__path_models+'users');
const groupModel = require(__path_models+'groups');
const utilsHelpers = require(__path_helpers+'utils');
const paramsHelpers = require(__path_helpers+'/params');
const systemConfig = require(__path_configs+'system')
const { response } = require('express');
const res = require('express/lib/response');
const { link } = require('fs');
const { getParams } = require(__path_helpers+'params');
const validators = require(__path_validates+'users');
const notify = require(__path_configs+'notify');
const util = require('util');
const session = require('express-session');
const fileHelper = require(__path_helpers+'file');
const fs = require('fs');

const linkIndex = '/'+systemConfig.prefixAdmin+'/users/';

const pageTitleIndex = 'User Management';
const pageTitleAdd = pageTitleIndex +' - Add';
const pageTitleEdit = pageTitleIndex +' - Edit';

const folderview = __path_views+'pages/users/';

const uploadAvatar = fileHelper.upload(
    'avatar',
    'users',
)

// router.post('/upload',(req,res)=>{
//     let errors =[];
//     uploadAvatar(req, res, function (err) {
//         if (err) {
//           errors.push({param:'avatar',msg :err})
         
//         } 
//         // Everything went fine.
//         res.render(`${folderview}upload`,{pageTitle:pageTitleIndex,errors});
//       })
   
// })

//GET LIST FOLLOW STATUS
router.get('(/status/:status)?', async function(req,res){
    let params ={};
    params.search = paramsHelpers.getParams(req.query,'search',''); // return value of search if it has
    params.currentStatus = paramsHelpers.getParams(req.params,'status','all');// return value of status and default is 'all' status
    let statusFilter =await utilsHelpers.createFilterStatus(params.currentStatus,'users');
    //sắp xếp
    params.sortField = paramsHelpers.getParams(req.session,'sort_field','name');
    params.sortType = paramsHelpers.getParams(req.session,'sort_type','asc');
    // selectbox group
    params.groupID = paramsHelpers.getParams(req.session,'group_id','');

    params.pagination={
		totalItems		 : 1,
		totalItemsPerPage: 5,
		currentPage		 : parseInt(paramsHelpers.getParams(req.query, 'page', 1)),
		pageRanges		 : 3
	};
    let groupItems = [];
    await groupModel.listItemsInSelectbox().then((items)=>{ ///await xong find thì load ra items of group
        groupItems = items;
        groupItems.unshift({_id:'allvalue',name: 'All Groups'});
    });
    //console.log(pagination);
    //let position = (pagination.currentPage-1)*pagination.totalItemsPerPage;
    //if(groupID!=='allvalue') objWhere['group.id'] = groupID; //objWhere = {'group.id' : groupID};
    //if(currentStatus !== 'all') objWhere.status = currentStatus; // lấy trạng thái hiện tại
    //if(search !== '') objWhere.name = {'$regex': search, '$options': 'i'};//tìm kiếm
    await userModel.countItem(params).exec().then(async (data)=>{
        params.pagination.totalItems=data;    
    })
    await userModel.listItems(params).then((items)=>{
        res.render(`${folderview}list`, { 
            pageTitle: pageTitleIndex,
            items,
            statusFilter,
            params,
            groupItems
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
    await userModel.changeStatus(id,currentStatus,{task:'update-one'}).then((doc)=>{
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
    await userModel.changeStatus(req.body.cid,currentStatus,{task:'update-many'}).then((affected,err)=>{ // affected is array
        if(err)  req.flash('warn','error',false);
        req.flash('success',util.format(notify.CHANGE_STATUS_MULTI_SUCCESS,affected.matchedCount),false);
        res.redirect(linkIndex);   
    })
})
//CHANGE ORDERING OF MANY ITEMS
router.post('/change-ordering',async(req,res)=>{
    let cids = req.body.cid; //cid trong mảng
    let orderings = req.body.ordering;
    groupModel.changeOrdering(cids,orderings).then((result)=>{
        req.flash('success',notify.CHANGE_ORDERING_SUCCESS,false);
        res.redirect(linkIndex);  
    })  
})
//DELETE 1 ITEM
router.get('/delete/:id',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    
    userModel.deleteItem(id,{task : 'delete-one'})
    .then(result=>{
        req.flash('success',notify.DELETE_SUCCESS,false);
        res.redirect(linkIndex);
    }).catch(err=>{
        console.log(err);
    })
})

//DELETE STATUS OF MANY ITEMS
router.post('/delete',async(req,res)=>{
    await userModel.deleteItem(req.body.cid,{task:'delete-many'}).then((result)=>{
        //console.log(result);
        req.flash('success',util.format(notify.DELETE_MULTI_SUCCESS,result.deletedCount),false);
        res.redirect(linkIndex);
    })
})



//GET FORM FOLLOW ADD OR EDIT 
router.get('/form(/:id)?',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    let item ={name:'',ordering:0,status:'novalue',group_id : '',group_name :''};
    let errors =null;
    let groupItems = [];
    await groupModel.listItemsInSelectbox().then((items)=>{ ///await xong find thì load ra items of group
        groupItems = items;
        groupItems.unshift({_id:'allvalue',name: 'Choose Group'});
    });
    
    if(id===''){
        res.render(`${folderview}/form`,{pageTitle:pageTitleAdd,item,errors,groupItems});
    }else{
         userModel.getItem(id).then((item)=>{
            item.group_id = item.group.id;
            item.group_name = item.group.name;
            //console.log(item);
            res.render(`${folderview}/form`,{pageTitle:pageTitleEdit,item,errors,groupItems});
        });
    }

        
    
})
//post add, edit
router.post('/save',  (req, res, next) => {
	uploadAvatar(req, res, async (errUpload) => {
		req.body = JSON.parse(JSON.stringify(req.body));

		let item = Object.assign(req.body);
		let taskCurrent	= (typeof item !== "undefined" && item.id !== "" ) ? "edit" : "add";

		let errors = validators.validator(req, errUpload, taskCurrent);
		
		if(errors.length > 0) { 
			let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
			if(req.file != undefined) fileHelper.remove('public/uploads/users/', req.file.filename); // xóa tấm hình khi form không hợp lệ
		
			let groupItems	= [];
			await groupModel.listItemsInSelectbox().then((items)=> {
				groupItems = items;
				groupItems.unshift({_id: 'allvalue', name: 'All group'});
			});
			
			if (taskCurrent == "edit") item.avatar = item.image_old;
			res.render(`${folderview}form`, { pageTitle, item, errors, groupItems});
		}else {
			let message = (taskCurrent == "add") ? notify.EDIT_SUCCESS : notify.EDIT_SUCCESS;
			if(req.file == undefined){ // không có upload lại hình
				item.avatar = item.image_old;
			}else{
				item.avatar = req.file.filename;
				if(taskCurrent == "edit") fileHelper.remove('public/uploads/users/', item.image_old);
			}

			userModel.saveItem(item, {task: taskCurrent}).then((result) => {
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
router.get('/filter-group/:group_id/',(req,res)=>{
    let group_id= paramsHelpers.getParams(req.params,'group_id','');

    
    req.session.group_id = group_id;

    res.redirect(linkIndex);
    
});

module.exports = router;
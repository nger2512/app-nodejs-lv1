const express = require('express');
const router = express.Router();
const itemModel = require(__path_schemas+'items');
const utilsHelpers = require(__path_helpers+'utils');
const paramsHelpers = require(__path_helpers+'/params');
const systemConfig = require(__path_configs+'system')
const { response } = require('express');
const res = require('express/lib/response');
const { getParams } = require(__path_helpers+'params');
const validators = require(__path_validates+'items');
const notify = require(__path_configs+'notify');
const util = require('util');

const linkIndex = '/'+systemConfig.prefixAdmin+'/items/';

const pageTitleIndex = 'Item Management';
const pageTitleAdd = pageTitleIndex +' - Add';
const pageTitleEdit = pageTitleIndex +' - Edit';

const folderview = __path_views+'pages/items/';

//GET LIST FOLLOW STATUS
router.get('(/status/:status)?', async function(req,res){
    let objWhere = {};
    let search = paramsHelpers.getParams(req.query,'search',''); // return value of search if it has
    
    // let currentStatus = 'all'
    // if(req.params.hasOwnProperty('status') && req.params.status!== undefined){
    //     currentStatus = req.params.status;
    // }
    let currentStatus = paramsHelpers.getParams(req.params,'status','all');// return value of status and default is 'all' status
    let statusFilter =await utilsHelpers.createFilterStatus(currentStatus);
    let pagination = {
        totalItems : 1,
        totalItemsPerPage : 2,
        currentPage : parseInt(paramsHelpers.getParams(req.query,'page',1)),
        pageRanges :3
    };

    //console.log(pagination);
    let position = (pagination.currentPage-1)*pagination.totalItemsPerPage;

    // if(currentStatus==='all'){
    //     if(search !== '')
    //     objWhere = {name:{'$regex': search, '$options': 'i'}};
    // }else{
    //     objWhere = {status:currentStatus,name:{'$regex': search, '$options': 'i'}};
    // }
    if(currentStatus !== 'all') objWhere.status = currentStatus;
    if(search !== '') objWhere.name = {'$regex': search, '$options': 'i'};
    await itemModel.count(objWhere).exec().then(async (data)=>{
        pagination.totalItems=data;    
    })
    await itemModel
        .find(objWhere)
        .sort({ordering:'asc'})
        .skip(position)
        .limit(pagination.totalItemsPerPage)
        .exec().then(items=>{
            // console.log({item:item});
            res.render(`${folderview}/list`,{
                pageTitle:pageTitleIndex,
                items:items,
                statusFilter:statusFilter,
                currentStatus:currentStatus,
                search:search,
                pagination:pagination
            })
        }).catch(err=>{
            console.log(err);
        })
    
    
})

//CHANGE STATUS WHEN WE CLICK
router.get('/change-status/:id/:status',async(req,res)=>{
    let currentStatus = paramsHelpers.getParams(req.params,'status','active');
    let id = req.params.id;

    // active <-> inactive
    let status = (currentStatus === 'active')?"inactive":"active";
    await itemModel.findById(id).exec()
    .then(async(itemResult)=>{
        itemResult.status = status;
        await itemResult.save().then(doc=>{
            req.flash('success',notify.CHANGE_STATUS_SUCCESS,false);
            res.redirect(linkIndex);
        }).catch(err=>{
            console.log('update error',err);
        });
    }).catch(err=>{
        console.log(err)
    });
    
})

//DELETE 1 ITEM
router.get('/delete/:id',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    await itemModel.remove({_id:id}).exec()
    .then(result=>{
        req.flash('success',notify.DELETE_SUCCESS,false);
        res.redirect(linkIndex);
    }).catch(err=>{
        console.log(err);
    })
})
//CHANGE STATUS OF MANY ITEMS
router.post('/change-status/:status/',(req,res)=>{
    let currentStatus = paramsHelpers.getParams(req.params,'status','active');
    //console.log(req.body);
    itemModel.updateMany({_id:{$in:req.body.cid}},{status:currentStatus},(err,affected)=>{ // affected is array
        if(err)  req.flash('warn','error',false);
        req.flash('success',util.format(notify.CHANGE_STATUS_MULTI_SUCCESS,affected.matchedCount),false);
        res.redirect(linkIndex);
        
    })
    // in lay tat ca trong mang
})
//DELETE STATUS OF MANY ITEMS
router.post('/delete',(req,res)=>{
    let currentStatus = paramsHelpers.getParams(req.params,'status','active');
    //console.log(req.body);
    itemModel.deleteMany({_id:{$in:req.body.cid}},(err,result)=>{
        req.flash('success',util.format(notify.DELETE_MULTI_SUCCESS,result.matchedCount),false);
        res.redirect(linkIndex);
    })
    // in lay tat ca trong mang
})
//CHANGE ORDERING OF MANY ITEMS
router.post('/change-ordering',(req,res)=>{
    let cids = req.body.cid;
    let orderings = req.body.ordering;
    //Item
    if(Array.isArray(cids)){
        cids.forEach((item,index)=>{
            itemModel.updateOne({_id:item},{ordering:parseInt(orderings[index])},(err,result)=>{       
                
            })    
        })
    }else{
        itemModel.updateOne({_id:cids},{ordering:parseInt(orderings)},(err,result)=>{       
        })
    }
    req.flash('success',util.format(notify.CHANGE_MULTI_ORDERING_SUCCESS,result.matchedCount),false);
    res.redirect(linkIndex);
    //Mutil Item
    
})


//GET FORM FOLLOW ADD OR EDIT 
router.get('/form(/:id)?',async(req,res)=>{
    let id = paramsHelpers.getParams(req.params,'id','');
    let errors =null;
    let item ={name:'',ordering:0,status:'novalue'}
    if(id !=='' &&  id !== undefined){
        itemModel.findById(id,(err,item)=>{
            if(err) console.error(err);
            console.log(item);
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
    let errors = req.validationErrors();
    if(typeof item!==undefined && item.id!==''){ //edit
        if(errors!== false){ //err
            res.render(`${folderview}/form`,{pageTitle:pageTitleEdit,item,errors});
        }else{//no err
            
            itemModel.updateOne({_id: item.id}, {
				ordering: parseInt(item.ordering),
				name: item.name,
				status: item.status
			}, (err, result) => {
				req.flash('success', notify.EDIT_SUCCESS, false);
				res.redirect(linkIndex);
			});
        
        }
    }else{//add
        
        if(errors!== false){ //err
            res.render(`${folderview}/form`,{pageTitle:pageTitleAdd,item,errors});
        }else{//no err
            new itemModel(item).save().then(()=>{
                req.flash('success',notify.ADD_SUCCESS,false);
                res.redirect(linkIndex);
            }).catch(err=>{
                console.log(err);
            })
        }
    }
    
    
    
})

module.exports = router;
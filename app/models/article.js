

const articleModel = require(__path_schemas + 'article');
const fileHelper = require(__path_helpers + 'file');
const fs = require('fs');
const uploadFolder = 'public/uploads/article/';
module.exports = {
    listItems:(params,options =null)=>{
        let objWhere = {};
        let sort  ={};
        if(params.categoryID !== 'allvalue' && params.categoryID !== '') objWhere['category.id'] = params.categoryID; 
        if(params.currentStatus !== 'all') objWhere.status = params.currentStatus;
        if(params.search !== '') objWhere.name = {'$regex': params.search, '$options': 'i'};
        sort[params.sortField] = params.sortType;

        return articleModel.find(objWhere)
            .select('name status thumb category.name ordering created modified')
            .sort(sort)
            .skip((params.pagination.currentPage-1)*params.pagination.totalItemsPerPage)
            .limit(params.pagination.totalItemsPerPage);
    },
    
    getItem:(id,options = null)=>{
        return articleModel.findById(id);
    },
    countItem:(params,options =null)=>{
        return articleModel.count(params.objWhere);
    },
    changeStatus:(id,currentStatus,options =null)=>{
        // active <-> inactive
        let status = (currentStatus === 'active')?"inactive":"active";
        let data ={
            modified:{
                user_id : 0,
                user_name : "admin",
                time : Date.now()
            },
            status:status
        }
        if(options.task == "update-one"){
            
            return articleModel.updateOne({_id:id},data);
        }
        if(options.task == "update-many"){
            data.status =currentStatus;
            return articleModel.updateMany({_id:{$in:id}},data);
        }
        console.log(options.task);
        
    },
    changeOrdering:async(cids,orderings,options =null)=>{
        let data = {
            ordering: parseInt(orderings), 
            modified:{
                user_id: 0,
                user_name: 0,
                time: Date.now()
                }
            };

        if(Array.isArray(cids)) {
            for(let index = 0; index < cids.length; index++) {
                data.ordering = parseInt(orderings[index]);
                await articleModel.updateOne({_id: cids[index]}, data)
            }
            return Promise.resolve("success");
        }else{
            return articleModel.updateOne({_id: cids}, data);
        }
    },
    deleteItem:async(id,options =null)=>{
        if(options.task == "delete-one"){
           
            
            await articleModel.findById(id).then((item)=>{
                fileHelper.remove(uploadFolder,item.avatar);
                
            })
            return articleModel.deleteOne({_id:id});
        }
        if(options.task == "delete-many"){
            if(Array.isArray(id)){

                for (var i = 0 ; i < id.length;i++){
                    await articleModel.findById(id[i]).then((item)=>{
                        fileHelper.remove(uploadFolder,item.avatar);
                    }) 
                }
            }else{
                await articleModel.findById(id).then((item)=>{
                    fileHelper.remove(uploadFolder,item.avatar);
                }) 
            }
            return articleModel.remove({_id:{$in:id}});
        }
       
        
    },
    saveItem :(item,options = null)=>{
        if(options.task =='add'){
            item.created={
                user_id : 0,
                user_name : "admin",
                time : Date.now()
            }
            item.category={
                id:item.category_id,
                name:item.category_name
            }
            return new articleModel(item).save();
        }
        if(options.task == 'edit'){
            
            return articleModel.updateOne({_id:item.id},{
                modified:{
                user_id : 0,
                user_name : "admin",
                time : Date.now()
                },
                status:item.status,
                ordering: parseInt(item.ordering),
                name: item.name,
                content:item.content,
                thumb :item.thumb,
                //group:data
                category:{
                    id: item.category_id,
                    name :item.category_name
                }
            });
        }
        if(options.task == "change-category-name") {
            return articleModel.updateMany({'category.id': item.id}, {
				category: {
                    id: item.id,
					name: item.name,
				},
			});
        }
    },
}


const userModel = require(__path_schemas + 'users');
const fileHelper = require(__path_helpers + 'file');
const fs = require('fs');
module.exports = {
    listItems:(params,options =null)=>{
        let objWhere = {};
        let sort  ={};
        if(params.groupID !== 'allvalue' && params.groupID !== '') objWhere['group.id'] = params.groupID; 
        if(params.currentStatus !== 'all') objWhere.status = params.currentStatus;
        if(params.search !== '') objWhere.name = {'$regex': params.search, '$options': 'i'};
        sort[params.sortField] = params.sortType;

        return userModel.find(objWhere)
            .select('name status avatar group.name ordering created modified')
            .sort(sort)
            .skip((params.pagination.currentPage-1)*params.pagination.totalItemsPerPage)
            .limit(params.pagination.totalItemsPerPage);
    },
    
    getItem:(id,options = null)=>{
        return userModel.findById(id);
    },
    countItem:(params,options =null)=>{
        return userModel.count(params.objWhere);
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
            
            return userModel.updateOne({_id:id},data);
        }
        if(options.task == "update-many"){
            data.status =currentStatus;
            return userModel.updateMany({_id:{$in:id}},data);
        }
        console.log(options.task);
        
    },
    changeOrdering:async(cids,orderings,options =null)=>{
        let data ={
            modified:{
                user_id : 0,
                user_name : "admin",
                time : Date.now()
            },
            ordering:parseInt(orderings)
        };
        if(Array.isArray(cids)){
            for(let index = 0;index < cids ;index++){
                data.ordering = parseInt(orderings[index]);
                await userModel.updateOne({_id:cids[index]},data);
            }
           return Promise.resolve("success");
        }else{
            return userModel.updateOne({_id:cids},data);
        }  
    },
    deleteItem:async(id,options =null)=>{
        if(options.task == "delete-one"){
           
            
            await userModel.findById(id).then((item)=>{
                fileHelper.remove('public/uploads/users/',item.avatar);
                
            })
            return userModel.deleteOne({_id:id});
        }
        if(options.task == "delete-many"){
            if(Array.isArray(id)){

                for (var i = 0 ; i < id.length;i++){
                    await userModel.findById(id[i]).then((item)=>{
                        fileHelper.remove('public/uploads/users/',item.avatar);
                    }) 
                }
            }else{
                await userModel.findById(id).then((item)=>{
                    fileHelper.remove('public/uploads/users/',item.avatar);
                }) 
            }
            return userModel.remove({_id:{$in:id}});
        }
       
        
    },
    saveItem :(item,options = null)=>{
        if(options.task =='add'){
            item.created={
                user_id : 0,
                user_name : "admin",
                time : Date.now()
            }
            item.group={
                id:item.group_id,
                name:item.group_name
            }
            return new userModel(item).save();
        }
        if(options.task == 'edit'){
            let data={
                id:item.group_id,
                name:item.group_name
            }
            return userModel.updateOne({_id:item.id},{
                modified:{
                user_id : 0,
                user_name : "admin",
                time : Date.now()
                },
                status:item.status,
                ordering: parseInt(item.ordering),
                name: item.name,
                content:item.content,
                avatar :item.avatar,
                //group:data
                group:{
                    id: item.group_id,
                    name :item.group_name
                }
            });
        }
        if(options.task == "change-group-name") {
            return userModel.updateMany({'group.id': item.id}, {
				group: {
                    id: item.id,
					name: item.name,
				},
			});
        }
    },
}
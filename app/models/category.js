
const categoryModel = require(__path_schemas + 'category');
const StringHelpers = require(__path_helpers + 'string');
module.exports = {
    listItems:(params,options =null)=>{
        let objWhere = {};
        let sort  ={};
        if(params.currentStatus !== 'all') objWhere.status = params.currentStatus;
        if(params.search !== '') objWhere.name = {'$regex': params.search, '$options': 'i'};
   
        sort[params.sortField] = params.sortType;    
        return categoryModel.find(objWhere)
            .select('name slug status ordering created modified')
            .sort(sort)
            .skip((params.pagination.currentPage-1)*params.pagination.totalItemsPerPage)
            .limit(params.pagination.totalItemsPerPage)
    },
    getItem:(id,options = null)=>{
        return categoryModel.findById(id);

    },
    countItem:(params,options =null)=>{
        return categoryModel.count(params.objWhere);
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
            
            return categoryModel.updateOne({_id:id},data);
        }
        if(options.task == "update-many"){
            data.status =currentStatus;
            return categoryModel.updateMany({_id:{$in:id}},data);
        }
        console.log(options.task);
        
    },
    changeOrdering: async (cids, orderings, options = null) => {
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
                await categoryModel.updateOne({_id: cids[index]}, data)
            }
            return Promise.resolve("Success");
        }else{
            return categoryModel.updateOne({_id: cids}, data);
        }
    },
    deleteItem:(id,options =null)=>{
        // active <-> inactive
        if(options.task == "delete-one"){
            return categoryModel.deleteOne({_id:id});
        }
        if(options.task == "delete-many"){
            return categoryModel.remove({_id:{$in:id}});
        }
       
        
    },
    saveItem :(item,options = null)=>{
        if(options.task =='add'){
            item.created={
                user_id : 0,
                user_name : "admin",
                time : Date.now()
            }
            item.slug = StringHelpers.createAlias(item.slug);
            return new categoryModel(item).save();
        }
        if(options.task == 'edit'){
            return categoryModel.updateOne({_id:item.id},{
                modified:{
                user_id : 0,
                user_name : "admin",
                time : Date.now()
                },
                status:item.status,
                ordering: parseInt(item.ordering),
                name: item.name,
                slug: StringHelpers.createAlias(item.slug),
                content:item.content
            });
        }
    },
}
const itemModel = require(__path_schemas+'items');

let createFilterStatus = async (currentStatus)=>{
    let statusFilter =[
        {name:'ALL',value:'all',count:4,link:'#',class:'default'},
        {name:'ACTIVE',value:'active',count:4,link:'#',class:'default'},
        {name:'INACTIVE',value:'inactive',count:4,link:'#',class:'default'}
    ]
   
    for(let i = 0;i<statusFilter.length;i++){
        let condition = {};
        let item = statusFilter[i];
        if(item.value !== 'all') condition = {status:item.value};
        console.log(item.value);
        if(item.value === currentStatus) statusFilter[i].class='success'
        await itemModel.count(condition).exec().then((data)=>{
            statusFilter[i].count = data;
            console.log(data);
        })
    }

    return statusFilter;
}
module.exports = {
    createFilterStatus:createFilterStatus
}
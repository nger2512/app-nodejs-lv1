const mongoose = require('mongoose');
const databaseConfig = require(__path_configs+'/database');

const itemSchema = new mongoose.Schema({
    name:'String',
    status: 'String',
    ordering:{type:Number,unique:true}
})

module.exports = mongoose.model(databaseConfig.col_items,itemSchema);
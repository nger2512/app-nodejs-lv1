const mongoose = require('mongoose');
const databaseConfig = require(__path_configs+'/database');

const articleModel = new mongoose.Schema({
    name:String,
    category :{
        id:String,
        name:String
    },
    thumb:String,
    status: String,
    
    ordering:Number,
    content:String,
    created:{
        user_id : Number,
        user_name : String,
        time : Date
    },
    modified:{
        user_id : Number,
        user_name : String,
        time : Date
    }
})

module.exports = mongoose.model(databaseConfig.col_articles,articleModel);
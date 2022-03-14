const mongoose = require('mongoose');
const databaseConfig = require(__path_configs+'/database');

const categorySchema = new mongoose.Schema({
    name:{type:'String'},
    slug:String,
    status: 'String',
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
categorySchema.pre("save", function(next) {
    const words = this.name.split(' ')
  this.name = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
  next()
});
module.exports = mongoose.model(databaseConfig.col_categories,categorySchema);
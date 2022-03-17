const multer  = require('multer');
const randomstring = require("randomstring");
const path = require('path');
const notify = require(__path_configs+'notify');
const fs = require('fs');

let uploadFile = (field, folderDes = 'users', fileNameLength = 10, fileSizeMb = 1, fileExtension = 'jpeg|jpg|png|gif') => {
	const storage = multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, __path_upload + folderDes + '/')
		},
		filename: (req, file, cb) =>  {
			cb(null,  randomstring.generate(fileNameLength) + path.extname(file.originalname));
		}
	});

	const upload = multer({ 
		storage: storage,
		limits: {
			fileSize: fileSizeMb * 1024 * 1024,
		},
		fileFilter: (req, file, cb) => {
		
			const filetypes = new RegExp(fileExtension);
			const extname 	= filetypes.test(path.extname(file.originalname).toLowerCase());
			const mimetype  = filetypes.test(file.mimetype);
	
			if(mimetype && extname){
				return cb(null,true);
			}else {
				cb(notify.ERROR_FILE_EXTENSION);
			}			
		}
	}).single(field);

	return upload;
}

let removeFile = (folder, fileName) => {
	if(fileName != "" && fileName != undefined ){
		let path = folder + fileName;
		if (fs.existsSync(path))  fs.unlink(path, (err) => {if (err) throw err;});
	}
}
module.exports = {
    upload : uploadFile,
    remove : removeFile
}
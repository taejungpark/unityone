// model/files.js
var mongoose = require('mongoose');

// 새로운 스키마 정의 (동적 컬렉션용)
var FileSchema = new mongoose.Schema({
    name : {type : Array, required : true},
    id : {type : Array, required : true},
    game_name : {type : String, required : true},
    password : {type : String, required : true},
    content : {type : String},
    uploadAt : {type : Date, default : Date.now}
});

FileSchema.static('findAll', function(callback){
    return this.find({ }, callback);
});

// 동적 모델 생성 함수
function getFileModel(year, semester) {
    const collectionName = `files_${year}_${semester}`;
    
    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName];
    }
    
    return mongoose.model(collectionName, FileSchema, collectionName);
}

// 현재 학기 계산 함수
function getCurrentSemester() {
    const month = new Date().getMonth() + 1;
    return (month >= 3 && month <= 8) ? 1 : 2;
}

module.exports = {
    getFileModel,
    getCurrentSemester,
    FileSchema
};
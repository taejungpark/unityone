// controllers/check.js
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');
var { getFileModel, getCurrentSemester } = require('../model/files');
var config = require('./config');
var semaster = config.semaster;

module.exports.check = function(req, res) {
    var objid = req.params.objid || req.query.objid;
    var game_title;
    //console.log(objid);
    
    // 먼저 새 구조에서 찾기
    var year = req.query.year || new Date().getFullYear();
    var semester = req.query.semester || getCurrentSemester();
    var Filedb = getFileModel(year, semester);
    
    Filedb.findById(objid, function(err, result) {        
        game_title = result.game_name;
        renderCheckPage(res, game_title);
    });
};

function renderCheckPage(res, game_title) {
    res.render('check2', {
        title: 'play game',
        result: game_title,
        pageHeader: {
            title: 'Unity One'
        },
        pageFooter: {
            explain: 'copyright'
        }
    });
}

// delet 함수가 반드시 있어야 함!
module.exports.delet = function(req, res) {
    var objid = req.params.objid || req.query.objid;
    //console.log(objid); 
    //console.log("final check");
    
    var year = req.query.year || new Date().getFullYear();
    var semester = req.query.semester || getCurrentSemester();
    var Filedb = getFileModel(year, semester);
    
    Filedb.findById(objid, function(err, result) {    
        var folderName = result.folderName || result.id[0];
        var dirKey = year + '_' + semester;
        handleDelete(result, dirKey, Filedb, res);
    });
};

function handleDelete(file, dirKey, Filedb, res) {
    var passwd = file.password;
    var folderName = file.folderName || file.id[0] || passwd;
    var path = 'public/fileStorage/' + dirKey + '/' + folderName;
    
    //console.log(path);
    
    if (fs.existsSync(path)) {
        //console.log("find file");
        
        // 폴더 삭제 (Node.js 14+ 버전)
        fs.rmSync(path, { recursive: true, force: true });
        
        //console.log("file deleted");
        
        // DB에서 삭제
        Filedb.deleteOne({ "_id": file._id }, function(err) {
            if (err) {
                console.log('fail to delete data');
                throw err;
            } else {
                //console.log("success");
                res.render('check', {
                    title: 'play game',
                    pageHeader: {
                        title: 'Unity One'
                    },
                    pageFooter: {
                        explain: 'copyright'
                    }
                });
            }
        });
    } else {
        console.log("File not found:", path);
        res.status(404).send('File not found');
    }
}

module.exports.checkDuplicate = function(req, res) {
    
    //console.log('=== checkDuplicate function called ===');
    //console.log('Request body:', req.body);

    var student_id = req.body.student_id;
    var year = req.body.year;
    var semester = req.body.semester;

    var Filedb = getFileModel(year, semester);
    Filedb.findOne({ id: { $in: [student_id] } }, function(err, file) {
        if (err) {
            console.error('Database error:', err);
            return res.json({ 
                exists: false, 
            });
        }
           
        
        if (file) {
            //console.log('Found file by student ID:', file);
            res.json({
                exists: true,
                game_name: result.game_title
            });
        } else {
            //console.log('No file found for student ID:', student_id);
            res.json({
                exists: false
            });
        }
    });    
};
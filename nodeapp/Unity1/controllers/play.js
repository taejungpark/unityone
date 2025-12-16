// controllers/play.js
var mongoose = require('mongoose');
var { getFileModel, getCurrentSemester } = require('../model/files');
var fs = require('fs');
var config = require('./config');
var semaster = config.semaster;

/* GET 'Play' page*/
module.exports.playgame = function(req, res){
    var objectid = req.query.objectid || req.params.objectid;
    if (objectid.startsWith(':')) {
        objectid = objectid.substring(1);
    }

    // URL에서 year와 semester 가져오기 (새 구조용)
    var year = req.query.year;
    var semester = req.query.semester;
    var student_id = req.query.id;

    //console.log('objectid:', objectid);
    //console.log('year:', year, 'semester:', semester, 'student_id:', student_id);
    
    // year와 semester가 있으면 새 구조, 없으면 기존 구조
    if (year && semester) {
        handleNewStructure(objectid, year, semester, student_id, res);
    } 
};

// 새로운 컬렉션 구조 처리
function handleNewStructure(objectid, year, semester, student_id, res) {
    var Filedb = getFileModel(year, semester);
    
    Filedb.findById(objectid, function(err, result) {
        if (err || !result) {
            console.error(err);
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<h2>Game not found</h2>');
            res.end();
            return;
        }
        
        var password = result.password;
        //console.log(" **** found objectid:", objectid, "  password:", password);
        
        
            
        if(result) {
            var output = [];
            var game_name = result.game_name;
            var uploadAt = result.uploadAt;
            var content = result.content;
            var password = result.password;
            var names = result.name;
            var ids = result.id;
            var folderName = result.folderName || ids[0];
            
            // Unity Web 게임 URL
            //var gameUrl = '/gamesubmit/nodeapp/Unity1/public/fileStorage/' + year + '_' + semester + '/' + folderName + '/index.html';
            var gameUrl = '/fileStorage/' + year + '_' + semester + '/' + folderName + '/index.html';
            
            // 팀원 정보 처리
            for (var i = 0; i < names.length; i++) {
                output.push({
                    name: names[i],
                    id: ids[i]
                });
            }
            
           //console.log('Game URL:', gameUrl);
            
            res.render('play', {
                title: 'Play: ' + game_name,
                game_title: game_name,
                content: content,
                result: output,
                gameUrl: gameUrl,
                uploadAt: uploadAt
            });
        } else {
            res.write('game loading failed');
            res.end();
        }
       
    });
}

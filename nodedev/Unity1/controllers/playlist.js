var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');
var { getFileModel, getCurrentSemester } = require('../model/files');

/* GET 'PlayList' page*/
module.exports.playlist = function(req, res){
    //console.log('=== Playlist endpoint hit (module.exports.playlist)===');
    // 쿼리 파라미터 또는 현재 연도/학기 사용
    const currentYear = new Date().getFullYear();
    const currentSemester = getCurrentSemester();
    
    let year = req.query.year ? parseInt(req.query.year) : currentYear;
    let semester = req.query.semester ? parseInt(req.query.semester) : currentSemester;
    
    // 동적 모델 가져오기
    const Filedb = getFileModel(year, semester);
    
    //console.log('Searching in collection: files_' + year + '_' + semester);
    
    Filedb.findAll(function(err, results){
        if (err) {
            console.error('Error:', err.stack);
            res.status(500).render('error', {
                message: 'Database error',
                error: err
            });
            return;
        }
        
        if(results && results.length > 0) {
            //console.log('Found ' + results.length + ' games');
            var output = [];
            
            for(var i = 0; i < results.length; i++){
                var game_name = results[i].game_name;
                var password = results[i].password;
                var objectid = results[i]._id;
                var content = results[i].content || '';
                var names = results[i].name;
                var ids = results[i].id;
                var folderName = results[i].folderName || ids[0];
                
                // 폴더 경로
                var dir = '/gamesubmit/nodedev/Unity1/public/fileStorage/' + year + '_' + semester + '/' + folderName;
                var thumbnail = '';
                
                try {
                    if (fs.existsSync(dir)) {
                        var files = fs.readdirSync(dir);
                        
                        // 루트 디렉토리에서 썸네일 찾기
                        for(var j = 0; j < files.length; j++){
                            var file = files[j];
                            var ext = path.extname(file).toLowerCase();
                            
                            // 썸네일 이미지 찾기
                            if(['.jpg', '.jpeg', '.png', '.gif'].includes(ext)){
                                var filePath = path.join(dir, file);
                                if (fs.statSync(filePath).isFile()) {
                                    thumbnail = file;
                                    break;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log('Directory error:', error);
                }
                /*
                console.log('Game data:', {
                    game_name: game_name,
                    id: ids,
                    folderName: folderName,
                    hasId: ids && ids.length > 0
                });
                */
                output.push({
                    password: password,
                    game_name: game_name,
                    thumbnail: thumbnail,
                    objectid: objectid,
                    year: year,
                    semester: semester,
                    content: content,
                    name: names || [],  // 빈 배열로 기본값 설정
                    id: ids || [],      // 빈 배열로 기본값 설정
                    folderName: folderName || password  // folderName이 없으면 password 사용
                });
            }
            
            res.render('playlist', {
                title: 'Game Playlist',
                result: output,
                currentYear: year,
                currentSemester: semester,
                pageHeader: {
                    title: 'Game List'
                },
                pageFooter: {
                    explain: 'copyright'
                }
            });
        } else {
            res.render('playlist', {
                title: 'Game Playlist',
                result: [],
                currentYear: year,
                currentSemester: semester,
                pageHeader: {
                    title: 'Game List'
                },
                pageFooter: {
                    explain: 'copyright'
                },
                message: 'No games found for this semester'
            });
        }
    });
};
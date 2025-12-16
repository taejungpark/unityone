var mongoose = require('mongoose');
var fs = require('fs');
var { getFileModel, getCurrentSemester } = require('../model/files');

/* GET 'Upload' page*/
module.exports.upload = function(req, res) {
    res.render('upload', {
        title: 'Game Submission',
        pageHeader: {
            title: 'Upload Game'
        },
        pageFooter: {
            explain: 'copyright'
        }
    });
};

/* POST 'Add File' endpoint */
module.exports.addFile = function(req, res){
    //console.log('=== Add File endpoint hit (module.exports.addFile)===');
    // 현재 연도 가져오기
    const year = new Date().getFullYear();
    const semester = parseInt(req.body.semester);
    
    // 동적 모델 가져오기
    const Filedb = getFileModel(year, semester);
    
    // 이름과 ID 배열 처리
    var names = Array.isArray(req.body.name) ? req.body.name : [req.body.name];
    var ids = Array.isArray(req.body.id) ? req.body.id : [req.body.id];
    
    var namesFile = Array.isArray(req.body.name) ? req.body.name : [req.body.name];
    var idsFile = Array.isArray(req.body.id) ? req.body.id : [req.body.id];
    // 대표 학번 선택 (첫 번째 학번 사용)
    var representativeId = idsFile[0];

    console.log('Checking for duplicate submission...');
    console.log('Student IDs:', idsFile);
    
    // 중복 체크: 학번 배열 중 하나라도 이미 존재하는지 확인
    Filedb.findOne({ id: { $in: idsFile } }, function(err, existingFile) {
        if (err) {
            console.error('Database error during duplicate check:', err);
            res.writeHead('200', {'Content-Type':'text/html;charset=utf-8'});
            res.write('<h2>Database error!</h2>');
            res.end();
            return;
        }
        
        if (existingFile) {
            // 이미 제출한 학생이 있음
            console.log('Duplicate submission found for:', existingFile.id);
            
            // 경고 메시지와 함께 upload 페이지로 리다이렉트
            res.writeHead('200', {'Content-Type':'text/html;charset=utf-8'});
            res.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Duplicate Submission</title>
                    <link href="/bootstrap/css/freelancer.min.css" rel="stylesheet">
                </head>
                <body>
                    <div class="container mt-5">
                        <div class="alert alert-danger text-center">
                            <h2>⚠️ Duplicate Submission Detected!</h2>
                            <hr>
                            <p><strong>Student ID(s):</strong> ${existingFile.id.join(', ')}</p>
                            <p><strong>Existing Game:</strong> ${existingFile.game_name}</p>
                            <hr>
                            <p class="lead">이미 제출된 정보가 있습니다.</p>
                            <p>새로 제출하려면 DELETE 메뉴를 이용해서 기존 정보/파일을 삭제한 후에 다시 제출해야 합니다.</p>
                            <br>
                            <a href="/delete" class="btn btn-danger">Go to Delete</a>
                            <a href="/upload" class="btn btn-primary">Back to Upload</a>
                        </div>
                    </div>
                    <script>
                        setTimeout(function() {
                            alert('이미 제출된 정보가 있습니다.\\n새로 제출하려면 DELETE 메뉴를 이용해서 기존 정보/파일을 삭제한 후에 다시 제출해야 합니다.');
                        }, 100);
                    </script>
                </body>
                </html>
            `);
            res.end();
            return;
        }
        
        // 중복이 없으면 기존 로직대로 진행
        //console.log('No duplicate found, proceeding with submission...');
        
        Filedb.create({
            name : namesFile,
            id : idsFile,
            game_name : req.body.game_title,
            password : req.body.passwd,
            content : req.body.content,
            folderName : representativeId
        }, function(err, file){
            if(err){
                console.log(err);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf-8'});
                res.write('<h2>Upload failed!</h2>');
                res.write('<p>' + err.message + '</p>');
                res.end();
                return;
            }else{
                // 폴더 생성 - 연도_학기 형식
                var dirUrl = '/gamesubmit/nodedev/Unity1/public/fileStorage/' + year + '_' + semester;
                
                // 연도_학기 폴더 생성
                if (!fs.existsSync(dirUrl)) {
                    fs.mkdirSync(dirUrl, { recursive: true });
                }
                
                // 학번 폴더 생성
                dirUrl = dirUrl + '/' + representativeId;
                if (!fs.existsSync(dirUrl)) {
                    fs.mkdir(dirUrl, { recursive: true }, function(err){
                        if(err && err.code !== 'EEXIST'){
                            console.error(err);
                        }else{
                            //console.log('Folder created: ' + dirUrl);
                        }
                    });
                }
                
                
                // password와 year, semester를 전달하여 file.js에서 찾을 수 있도록 함 -> id로 변경
                res.redirect('/file/' + req.body.id + '?year=' + year + '&semester=' + semester);
            }
        });
    });
};
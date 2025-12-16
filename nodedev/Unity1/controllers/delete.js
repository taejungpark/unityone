// controllers/delete.js
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');
var { getFileModel, getCurrentSemester } = require('../model/files');
var { logAccess } = require('../middleware/accessLogger');

// dele 함수가 반드시 있어야 함
module.exports.dele = function(req, res) {
    res.render('delete', {
        title: 'Delete Game',
        pageHeader: {
            title: 'Delete Game'
        },
        pageFooter: {
            explain: 'copyright'
        }
    });
};

// verifyGame 함수 - 학번 기준으로 수정
module.exports.verifyGame = function(req, res) {
    //console.log('=== Verify game endpoint hit ===');
    //console.log('Request body:', req.body);

    // Log delete verification attempt
    logAccess(req, 'delete', {
        student_id: req.body.student_id,
        year: req.body.year,
        semester: req.body.semester
    });

    try {

        const { student_id, student_name, password, year, semester } = req.body;

        // 입력값 확인
        //console.log('Received data:', { student_id, student_name, password, year, semester });
        
        if (!student_id || !student_name || !password || !year || !semester) {
            console.log('Missing required fields');
            return res.json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const Filedb = getFileModel(year, semester);
        //console.log('Using collection: files_' + year + '_' + semester);
        
        // 학번으로 게임 찾기 (학번은 배열이므로 $in 사용)
        Filedb.findOne({ id: { $in: [student_id] } }, function(err, file) {
            if (err) {
                console.error('Database error:', err);
                return res.json({ 
                    success: false, 
                    message: 'Database error occurred' 
                });
            }
            
            //console.log('Found file by student ID:', file);
            
            if (!file) {
                console.log('No file found for student ID:', student_id);
                return res.json({ 
                    success: false, 
                    message: 'No game found for this student ID in the selected semester.' 
                });
            }
            
            // 비밀번호 확인
            if (file.password !== req.body.password) {
                console.log('Password mismatch');
                return res.json({ 
                    success: false, 
                    message: 'Incorrect password for this game.' 
                });
            }
            
            // 이름 확인
            const isNameMatch = file.name && file.name.includes(req.body.student_name);
            if (!isNameMatch) {
                console.log('Name mismatch');
                return res.json({ 
                    success: false, 
                    message: 'The name does not match the student ID.' 
                });
            }
            
            //console.log('All verifications passed');
            checkAuthorization(file, student_id, student_name, res);
        });
    } catch (error) {
        console.error('Verify game error:', error);
        res.json({ 
            success: false, 
            message: 'An error occurred while verifying game information' 
        });
    }
};

// checkAuthorization 함수 수정
function checkAuthorization(file, student_id, student_name, res) {
    //console.log('Checking authorization for:', { student_id, student_name });
    //console.log('File data:', { id: file.id, name: file.name });
    
    // 학번과 이름이 모두 일치하는지 확인
    const isAuthorizedById = file.id && file.id.includes(student_id);
    const isAuthorizedByName = file.name && file.name.includes(student_name);
    const isAuthorized = isAuthorizedById && isAuthorizedByName;
    
    //console.log('Authorization result:', { isAuthorizedById, isAuthorizedByName, isAuthorized });
    
    res.json({
        success: true,
        isAuthorized: isAuthorized,
        game: {
            game_name: file.game_name || file.game_title,
            uploadAt: file.uploadAt,
            name: file.name,
            id: file.id
        }
    });
}

// delfile 함수도 학번 기준으로 수정
module.exports.delfile = function(req, res) {
   
    //console.log('=== Delete file endpoint hit ===');
    //console.log('Request method:', req.method);
    //console.log('Request body:', req.body);

    const { student_id, student_name, password, year, semester } = req.body;

    if (!student_id || !student_name || !password || !year || !semester) {
        console.log('Missing required fields in delete request');
        console.log('Received:', { student_id, student_name, password, year, semester });
        res.status(400).send('Missing required fields');
        return;
    }
    
    //console.log('Delete request:', { student_id, student_name, password, year, semester });

    const Filedb = getFileModel(year, semester);
    //console.log('Using collection: files_' + year + '_' + semester);
    
    /*
    // 먼저 모든 문서를 확인해보기
    Filedb.find({}, function(err, allDocs) {
        console.log('All documents in collection:');
        allDocs.forEach(doc => {
            console.log('- Game:', doc.game_name, 'IDs:', doc.id);
        });
    });
    */
    //console.log('Searching for student_id:', student_id);

    // 학번으로 게임 찾기
    Filedb.findOne({ id: { $in: [student_id] } }, function(err, file) {
        if (err || !file) {
            console.error('Game not found:', err);
            res.status(404).send('Game not found for this student ID');
            return;
        }
        
        // 비밀번호 확인
        if (file.password !== password) {
            console.log('Password verification failed');
            res.status(403).send('Incorrect password');
            return;
        }
        
        // 이름 확인
        const isAuthorizedByName = file.name && file.name.includes(student_name);
        if (!isAuthorizedByName) {
            console.log('Name verification failed');
            res.status(403).send('Name does not match student ID');
            return;
        }
        
        const folderName = file.folderName || file.id[0];
        const dirPath = path.join('/gamesubmit/nodeapp/Unity1/public/fileStorage', year + '_' + semester, folderName);
        
        //console.log('Deleting folder:', dirPath);
        
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            //console.log('Folder deleted successfully');
        }
        
        Filedb.deleteOne({ _id: file._id }, function(err) {
            if (err) {
                console.error('Database delete error:', err);
                res.status(500).send('Delete failed');
            } else {
               // console.log('Database record deleted successfully');
                
                // deleteSuccess.jade 렌더링
                res.render('deleteSuccess', {
                    title: 'Delete Success',
                    pageHeader: {
                        title: 'Game Deleted Successfully'
                    },
                    pageFooter: {
                        explain: 'copyright'
                    },
                    deletedGame: file.game_name,
                    student: { 
                        name: student_name, 
                        id: student_id 
                    }
                });
            }
        });
    });
};
// controllers/file.js
var mongoose = require('mongoose');
var { getFileModel, getCurrentSemester } = require('../model/files');
var config = require('./config');
var multer = require('multer');
var fs = require('fs');
var path = require('path');

var dir;
var currentYear;
var currentSemester;

// Multer 설정 - 메모리 저장소 사용
var storage = multer.memoryStorage();

var fileUpload = multer({
    storage: storage,
    limits: {
        fileSize: 4 * 1024 * 1024 * 1024 // 4GB
    }
}).fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'unity_files', maxCount: 1000 }
]);

// GET 'Upload' 페이지
module.exports.uploadpage = function(req, res) {
    //console.log('=== Upload page endpoint hit(module.exports.uploadpage) ===');
    var id = req.params.id;

    // 배열인 경우 첫 번째 요소만 사용하고 문자열로 변환
    currentYear = Array.isArray(req.query.year) ? req.query.year[0] : req.query.year;
    currentYear = currentYear || new Date().getFullYear();
    currentYear = String(currentYear);

    currentSemester = Array.isArray(req.query.semester) ? req.query.semester[0] : req.query.semester;
    currentSemester = currentSemester || getCurrentSemester();
    currentSemester = String(currentSemester);

    try {       
        
        var Filedb = getFileModel(currentYear, currentSemester);
        //console.log('Using collection: files_' + currentYear + '_' + currentSemester);
        Filedb.findOne({ id: id }, function(err, result) {
            if (err) {
                console.error('Database error:', err);
                return res.json({ 
                    success: false, 
                    message: 'Database error occurred.' 
                });
            }
            
            if (!result) {
                console.error('No result found for id:', id);
                return res.json({ 
                    success: false, 
                    message: 'Game not found.' 
                });
            }

            // folderName도 배열일 수 있으므로 문자열로 변환
            var folderName = result.folderName || result.id;
            folderName = Array.isArray(folderName) ? folderName[0] : folderName;
            folderName = String(folderName);
            
            // 절대 경로 사용
            dir = path.join('/gamesubmit/nodeapp/Unity1', 'public', 'fileStorage', currentYear + '_' + currentSemester, folderName);
            //console.log('>>>>  Found game folder:', dir);

            renderUploadPage(res, result.game_name);
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.json({ 
            success: false, 
            message: 'An error occurred while uploading unity files.' 
        });
    }
};
function renderUploadPage(res, gameName) {
    res.render('fileGame', {
        title: 'Upload Game Files',
        gameName: gameName,
        pageHeader: {
            title: 'Upload Unity Web Build'
        },
        pageFooter: {
            explain: 'copyright'
        }
    });
}

// POST 'Upload Game' endpoint
module.exports.uploadGame = function(req, res) {
    //console.log('=== Upload Game endpoint hit (module.exports.uploadGame) ===');
    var id = req.params.id;
    var year = req.query.year;
    var semester = req.query.semester;
    dir = path.join('/gamesubmit/nodeapp/Unity1', 'public', 'fileStorage', year + '_' + semester, id);
    console.log('dir:', dir);
    fileUpload(req, res, async function(err) {
        if (err) {
            console.error('Upload error:', err);
            res.status(400).send('File upload failed: ' + err.message);
            return;
        }

        try {
            

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                //console.log('📁 Created directory:', dir);
            }

            const uploadedFiles = [];

            // 1. Thumbnail 저장
            if (req.files['thumbnail']) {
                const thumbnail = req.files['thumbnail'][0];
                const thumbnailPath = path.join(dir, thumbnail.originalname);
                fs.writeFileSync(thumbnailPath, thumbnail.buffer);
                //console.log('▶ >>> Target upload directory:', dir);
                //console.log('🖼️ Thumbnail saved:', thumbnailPath);
                uploadedFiles.push({
                    type: 'thumbnail',
                    path: thumbnail.originalname
                });
            }

            // 2. Unity 파일들 저장 (폴더 구조 유지)
            if (req.files['unity_files'] && req.body.file_paths) {
                // 경로 정보 파싱
                let pathInfo;
                try {
                    pathInfo = JSON.parse(req.body.file_paths);
                    //console.log('📋 Parsed path info:', pathInfo);
                } catch (e) {
                    console.error('Failed to parse file paths:', e);
                    pathInfo = [];
                }

                const files = req.files['unity_files'];
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    // 해당 파일의 경로 정보 찾기
                    const filePathInfo = pathInfo.find(p => p.index === i);
                    
                    if (!filePathInfo) {
                        console.warn(`⚠️ No path info for file ${i}: ${file.originalname}`);
                        continue;
                    }
                    
                    const relativePath = filePathInfo.relativePath;
                    
                    //console.log(`📄 Processing file ${i}:`);
                    //console.log(`   Original name: ${file.originalname}`);
                    //console.log(`   Relative path: ${relativePath}`);

                    // 보안 검사
                    if (!relativePath || relativePath.includes('..') || path.isAbsolute(relativePath)) {
                        console.warn('⚠️ Unsafe path. Skipping:', relativePath);
                        continue;
                    }

                    // 전체 파일 경로
                    const filePath = path.join(dir, relativePath);
                    const fileDir = path.dirname(filePath);

                    //console.log(`   Full path: ${filePath}`);
                    //console.log(`   Directory: ${fileDir}`);

                    // 하위 디렉토리 생성
                    if (!fs.existsSync(fileDir)) {
                        fs.mkdirSync(fileDir, { recursive: true });
                        //console.log(`   📁 Created directory: ${fileDir}`);
                    }

                    // 파일 저장
                    fs.writeFileSync(filePath, file.buffer);
                    //console.log(`   ✅ File saved: ${filePath}`);

                    uploadedFiles.push({
                        type: 'unity_file',
                        path: relativePath
                    });
                }
            } else {
                console.warn('⚠️ No Unity files or path information received');
            }

            //console.log('✅ Upload complete. Total files:', uploadedFiles.length);

            
            res.redirect('/completeFile');

        } catch (error) {
            console.error('❌ Upload processing error:', error);
            res.status(500).send('Failed to save files: ' + error.message);
        }
    });
};
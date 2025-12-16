// routes/index.js
var express = require('express');
var router = express.Router();
var ctrlmain = require('../controllers/main.js');
var ctrlupload = require('../controllers/upload.js');
var ctrlplaylist = require('../controllers/playlist.js');
var ctrlplay = require('../controllers/play.js');
var ctrluploadFile = require('../controllers/file.js');
var ctrldelete = require('../controllers/delete.js');
var ctrlcheck = require('../controllers/check.js');
var ctrlcompleteFile = require('../controllers/completeFile.js');

// 디버깅: 각 컨트롤러의 함수들이 제대로 로드되었는지 확인
console.log('=== Controller Functions Check ===');
console.log('ctrlmain.show:', typeof ctrlmain.show);
console.log('ctrlplay.playgame:', typeof ctrlplay.playgame);
console.log('ctrlplaylist.playlist:', typeof ctrlplaylist.playlist);
console.log('ctrlupload.upload:', typeof ctrlupload.upload);
console.log('ctrlupload.addFile:', typeof ctrlupload.addFile);
console.log('ctrluploadFile.uploadpage:', typeof ctrluploadFile.uploadpage);
console.log('ctrluploadFile.uploadGame:', typeof ctrluploadFile.uploadGame);
console.log('ctrldelete.dele:', typeof ctrldelete.dele);
console.log('ctrldelete.verifyGame:', typeof ctrldelete.verifyGame);
console.log('ctrldelete.delfile:', typeof ctrldelete.delfile);
console.log('ctrlcheck.check:', typeof ctrlcheck.check);
console.log('ctrlcheck.checkDuplicate:', typeof ctrlcheck.checkDuplicate);
console.log('ctrlcheck.delet:', typeof ctrlcheck.delet);
console.log('ctrlcompleteFile.uploadGame:', typeof ctrlcompleteFile.uploadGame);
console.log('=================================');

/* Main page. */
router.get('/', ctrlmain.show);

/* Play page. */
router.get('/play/:objectid', ctrlplay.playgame);

/* PlayList page. */
router.get('/playlist', ctrlplaylist.playlist);
router.get('/playlist/:year/:semester', ctrlplaylist.playlist);

/* Upload page. */
router.get('/upload', ctrlupload.upload)
router.post('/upload', ctrlupload.addFile)

router.get('/file/:id', ctrluploadFile.uploadpage)
router.post('/file/:id', ctrluploadFile.uploadGame);
 
/*delete page */
router.get('/delete', ctrldelete.dele);
router.get('/delete/', ctrldelete.dele);  // trailing slash 버전 추가
router.post('/delete', ctrldelete.delfile);
router.post('/delete/', ctrldelete.delfile);  // trailing slash 버전 추가
router.post('/delete/verify', ctrldelete.verifyGame);

router.get('/check/:objid', ctrlcheck.check);
router.post('/check/:objid', ctrlcheck.delet);

router.post('/check-duplicate', ctrlcheck.checkDuplicate);

router.get('/completeFile', ctrlcompleteFile.uploadGame)


module.exports = router;
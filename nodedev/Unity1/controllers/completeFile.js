
/* GET 'Upload' page*/
module.exports.uploadGame = function(req, res) {
    res.render('fileComplete', {
        title: 'play game',
        pageHeader: {
            title: 'Unity One'},
        pageFooter: {
            explain: 'copyright'}
    });
};


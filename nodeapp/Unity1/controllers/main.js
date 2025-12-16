/* GET 'Main' page */
module.exports.show = function(req, res) {
    res.render('layout', {
        title: 'Game Submission Main Page',
        pageHeader: {
            title: 'Unity One'},
        pageFooter: {
            explain: 'copylight'}
    });
};


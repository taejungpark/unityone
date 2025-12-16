var mongoose = require('mongoose');
var gracefulShutdown;
var dbHost = process.env.DATABASE_HOST || '127.0.0.1';
var dbURI = 'mongodb://'+dbHost+':27017/gamesubmit_db';
if (process.env.NODE_ENV === 'production') {
    dbURI = process.env.MONGOLAB_URI;
}

mongoose.connect(dbURI, {useUnifiedTopology: true, useNewUrlParser: true }, function(err) {
    if (err){    	
    	throw err;
    }
});
// CONNECTION EVENTS
mongoose.connection.on('connected', function() {
    console.log('MongoDB connected');
    
    // 기존 컬렉션 목록 확인
    mongoose.connection.db.listCollections().toArray(function(err, collections) {
        if (!err) {
            console.log('Existing collections:');
            collections.forEach(function(collection) {
                if (collection.name.startsWith('files_')) {
                    console.log(' - ' + collection.name);
                }
            });
        }
    });
});

mongoose.connection.on('error', function(err) {
    console.log('Mongoose connection Error: ' + err);
});
mongoose.connection.on('disconnected', function() {
    console.log('Mongoose disconnected');
});

// CAPTURE APP TERMINATION / RESTART EVENTS
// To be called when process is restarted or terminated
gracefulShutdown = function(msg, callback) {
    mongoose.connection.close(function() {
        console.log('Mongoose disconnected through ' + msg);
        callback();
    });
};
// For nodemon restarts
process.once('SIGUSR2', function() {
    gracefulShutdown('nodemon restart', function() {
        process.kill(process.pid, 'SIGUSR2');
    });
});
// For app termination
process.on('SIGINT', function() {
    gracefulShutdown('app termination', function() {
        process.exit(0);
    });
});
// For Heroku app termination
process.on('SIGTERM', function() {
    gracefulShutdown('Heroku app termination', function() {
        process.exit(0);
    });
});

// BRING IN YOUR SCHEMAS & MODELS
require('./files');
require('./accessLog');

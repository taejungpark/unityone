var mongoose = require('mongoose');

// Access Log Schema
var accessLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    studentId: {
        type: [String],  // Array to support multiple students
        default: []
    },
    action: {
        type: String,
        required: true,
        enum: ['upload', 'delete', 'file_upload']
    },
    endpoint: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    userAgent: {
        type: String
    },
    gameName: {
        type: String
    },
    objectId: {
        type: String
    },
    statusCode: {
        type: Number
    },
    additionalInfo: {
        type: mongoose.Schema.Types.Mixed
    }
});

// Index for faster queries
accessLogSchema.index({ timestamp: -1 });
accessLogSchema.index({ ip: 1 });
accessLogSchema.index({ studentId: 1 });
accessLogSchema.index({ action: 1 });

mongoose.model('AccessLog', accessLogSchema, 'access_logs');

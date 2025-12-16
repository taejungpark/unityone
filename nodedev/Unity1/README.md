# Game Submission System - Access Logging

## Overview

This system implements comprehensive access logging to track and monitor all upload and delete operations. The logging system helps prevent illegal access and provides audit trails for security monitoring.

## What is Logged

The system automatically records the following information for each upload and delete operation:

### Logged Information
- **IP Address**: Client's IP address (handles proxies and load balancers)
- **Student ID(s)**: Student ID(s) involved in the operation
- **Timestamp**: Exact date and time of the action
- **Action Type**: `upload`, `delete`, or `file_upload`
- **Endpoint**: The URL endpoint that was accessed
- **HTTP Method**: GET, POST, etc.
- **Game Name**: Name of the game (if applicable)
- **User Agent**: Browser and operating system information
- **Additional Info**: Context-specific data (year, semester, etc.)

### Actions Tracked
1. **Upload** - When students submit game information
2. **Delete** - When students attempt to delete their submissions
3. **File Upload** - When game files are uploaded to the server

## Accessing the Logs

### Web Interface

Visit the access logs page:
```
http://your-server-address/access-logs
```

### Features:
- **View Recent Logs**: See the most recent access attempts
- **Filter Logs**: Filter by action type, student ID, or IP address
- **Pagination**: Browse through historical logs
- **Export Data**: Use the JSON API for programmatic access

### Filtering Options

The web interface allows you to filter logs by:
- **Action Type**: Upload, Delete, or File Upload
- **Student ID**: View all actions by a specific student
- **IP Address**: Track activities from a specific IP
- **Date Range**: Filter logs by time period
- **Results per page**: 50, 100, or 200 logs

## API Access

### JSON API Endpoint

For programmatic access or data export:

```
GET /api/access-logs
```

#### Query Parameters:
- `limit` - Number of results (default: 100)
- `page` - Page number for pagination (default: 1)
- `action` - Filter by action type (upload/delete/file_upload)
- `studentId` - Filter by student ID
- `ip` - Filter by IP address

#### Example:
```bash
# Get last 50 upload attempts
curl "http://your-server/api/access-logs?action=upload&limit=50"

# Get all actions by student ID 2013107
curl "http://your-server/api/access-logs?studentId=2013107"

# Get all actions from specific IP
curl "http://your-server/api/access-logs?ip=192.168.1.100"
```

#### Response Format:
```json
{
  "success": true,
  "logs": [
    {
      "timestamp": "2025-12-16T10:30:00.000Z",
      "ip": "192.168.1.100",
      "studentId": ["2013107"],
      "action": "upload",
      "endpoint": "/upload",
      "method": "POST",
      "gameName": "Character Action",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3
}
```

## Security Use Cases

### 1. Detecting Suspicious Activity
Monitor for:
- Multiple failed delete attempts from the same IP
- Upload attempts with unusual patterns
- Access from unexpected IP addresses
- Multiple submissions from the same student

### 2. Investigating Issues
- Track when a student submitted their game
- Verify if a deletion was intentional
- Identify the source of problematic submissions
- Audit trail for disputes

### 3. IP Blocking
If you identify malicious IPs:
1. Note the IP address from the logs
2. Add firewall rules to block the IP
3. Monitor logs to verify blocking is effective

### Example Queries for Security:

**Find all actions from a suspicious IP:**
```
Filter by IP: 192.168.1.100
```

**Find multiple submissions from same student:**
```
Filter by Student ID: 2013107
Action: upload
```

**View all delete attempts:**
```
Filter by Action: delete
```

## Database Structure

Logs are stored in MongoDB collection: `access_logs`

### Schema:
```javascript
{
  timestamp: Date,        // When the action occurred
  ip: String,            // Client IP address
  studentId: [String],   // Array of student IDs
  action: String,        // upload, delete, file_upload
  endpoint: String,      // URL endpoint
  method: String,        // HTTP method
  userAgent: String,     // Browser information
  gameName: String,      // Game name (optional)
  objectId: String,      // MongoDB ObjectId (optional)
  additionalInfo: Object // Context-specific data
}
```

### Indexes:
- `timestamp` (descending) - Fast time-based queries
- `ip` - Quick IP lookups
- `studentId` - Fast student searches
- `action` - Filter by action type

## Console Logging

In addition to database logging, Morgan logger outputs to PM2 logs:

**Format:**
```
IP_ADDRESS - USER [DATE] "METHOD URL HTTP/VERSION" STATUS SIZE "REFERRER" "USER-AGENT"
```

**Example:**
```
192.168.1.100 - - [16/Dec/2025:10:30:00 +0000] "POST /upload HTTP/1.1" 200 1234 "http://server/upload" "Mozilla/5.0..."
```

**View console logs:**
```bash
pm2 logs www
# or
tail -f ~/.pm2/logs/www-out.log
```

## Implementation Details

### Files Modified/Created:

**Models:**
- `model/accessLog.js` - MongoDB schema for access logs
- `model/db.js` - Updated to load access log model

**Middleware:**
- `middleware/accessLogger.js` - Logging utility functions

**Controllers:**
- `controllers/upload.js` - Logs upload attempts
- `controllers/delete.js` - Logs delete attempts
- `controllers/accessLog.js` - View logs interface

**Routes:**
- `routes/index.js` - Added `/access-logs` and `/api/access-logs`

**Views:**
- `views/accessLogs.jade` - Web interface for viewing logs

**Configuration:**
- `app.js` - Updated Morgan logger format

## Maintenance

### Log Retention

Logs are stored indefinitely by default. To manage database size:

**Option 1: Manual cleanup**
```javascript
// Delete logs older than 90 days
db.access_logs.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

**Option 2: TTL Index (automatic cleanup)**
Add to `model/accessLog.js`:
```javascript
// Automatically delete logs after 90 days
accessLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 })
```

### Backup Logs

**Export logs to JSON:**
```bash
mongoexport --db gamesubmit_db --collection access_logs --out access_logs_backup.json
```

**Export logs to CSV:**
```bash
mongoexport --db gamesubmit_db --collection access_logs --type=csv --fields timestamp,ip,studentId,action,gameName --out access_logs.csv
```

## Troubleshooting

### Logs not appearing?
1. Check MongoDB connection: `mongoose.connection.on('connected')`
2. Verify model is loaded: Check console for errors
3. Ensure middleware is called: Add `console.log` in `accessLogger.js`

### IP shows as "unknown"?
- Check if behind a proxy/load balancer
- Update `getClientIP()` function to check appropriate headers
- Common headers: `x-forwarded-for`, `x-real-ip`

### Slow log queries?
- Ensure indexes are created: `db.access_logs.getIndexes()`
- Limit result size with pagination
- Add date range filters to queries

## Privacy Considerations

- IP addresses are considered personal data in some jurisdictions (GDPR)
- Student IDs may be sensitive information
- Implement appropriate access controls to the logs
- Consider anonymizing old logs
- Inform users about logging in privacy policy

## Support

For issues or questions:
1. Check console logs: `pm2 logs www`
2. Check MongoDB logs: `journalctl -u mongod`
3. Verify log collection exists: `db.access_logs.count()`
4. Check system resources: `df -h` and `free -m`

---

**Last Updated:** December 2025
**Version:** 1.0
**System:** Node.js Game Submission Platform

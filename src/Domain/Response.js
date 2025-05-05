class Response {
    constructor(statusCode, httpStatus, message, data) {
        this.statusCode = statusCode;
        this.httpStatus = httpStatus;
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toString();

    }
}
module.exports = Response;
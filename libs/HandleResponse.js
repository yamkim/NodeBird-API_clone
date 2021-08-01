exports.handleResponsePart = function (statusCode, res) {
    let code;
    let message;
    switch(statusCode) {
        case '200':
            code = 200;
            message = '정상적으로 처리되었습니다.';
        case '401':
            code = 401;
            message = '유효하지 않은 (도메인 / 토큰) 값입니다.';
            break;
        case '404':
            code = 404;
            message = '검색 결과가 없습니다.';
            break;
        case '419':
            code = 419;
            message = '토큰이 만료되었습니다.'
        default:
            code = 500;
            message = '서버 에러입니다.';
            break;
    }
    return (res.status(code).json({
        code: code,
        message: message
    }));
}

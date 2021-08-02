exports.handleResponse = (statusCode, res) => {
    let message;
    switch(statusCode) {
        case 200:
            message = '정상적으로 처리되었습니다.';
        case 401:
            message = '유효하지 않은 (도메인 / 토큰) 값입니다.';
            break;
        case 404:
            message = '검색 결과가 없습니다.';
            break;
        case 410:
            message = '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요!';
            break;
        case 419:
            message = '토큰이 만료되었습니다.'
            break;
        case 429:
            message =  '제한된 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요!';
            break;
        default:
            message = '서버 에러입니다.';
            break;
    }
    res.status(statusCode).json({
        code: statusCode,
        message: message
    });
}
# NodeBirdAPI_clone

[NodeBird_clone](https://github.com/yamkim/NodeBird_clone)의 정보를 요청하기 위한 웹 API 서비스 입니다.

해당 API를 사용하는 예시 서비스는 [NodeCat_clone](https://github.com/yamkim/NodeCat_clone)입니다.

## 구동시키기 위해 설정해야할 파일

### 1. `.env` 파일

- PORT=PORT_NUMBER_FOR_LISTENING

- COOKIE_SECRET=COOKIE_SECRET_FOR_COOKIE_PARSER
- JWT_SECRET=JWT_SECRET_FOR_JWT_SIGN

### 2. `/configs/config.json` 파일

``` json
{
  "development": {
    "username": "DB_접속을_위한_username",
    "password": "DB_접속을_위한_user의_password",
    "database": "서비스를_위해_설정할_DB_이름",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "logging": false
  },
  "test": ...,
  "production": ...
}
```

- database 및 table을 서비스와 함께 생성하고 싶다면, 커맨드창에 아래 명령어를 입력합니다.

  ``` bash
  $ npx sequelize db:create
  ```

## 기능

- NodeBird의 계정으로 서비스에 로그인합니다.
- 도메인(ex.localhost:4000)을 등록하여, 클라이언트 비밀키를 발급 받습니다.
- NodeBirdApi를 사용하는 서비스에서, 발급받은 CLIENT_SECRET을 사용하여 axios 요청을 통해 JWT를 발급받습니다.
- NodeBirdApi를 사용하는 서비스에서, JWT와 함께 http://localhost:8002/v1/posts/my에 요청을 보낸다면, 로그인된 id의 유저가 작성한 게시글을 JSON으로 반환합니다.
- NodeBirdApi를 사용하는 서비스에서, JWT와 함께 http://localhost:8002/v1/posts/hashtag/HASHTAG에 요청을 보낸다면, HASHTAG에 기입한 hashtag가 포함된 모든 게시글을 JSON으로 반환합니다.
- 자세한 예시 및 사용방법은  [NodeCat_clone](https://github.com/yamkim/NodeCat_clone)에서 확인 가능합니다.

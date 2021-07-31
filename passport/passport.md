# Passport 미들웨어

- `serializeUser()`: 사용자 인증이 성공적으로 진행되었을 때, 등록된 콜백함수를 호출합니다.
- `deserializeUser()` : 사용자 인증 이후 사용자 요청이 들어올 때마다 호출합니다.

### 로컬인증 방식

```javascript
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  }, async (email, password, done) => {
  try {
  	const exUser = await User.findOne({ where: { email } });
  	if (exUser) {
  	  const result = await bcrypt.compare(password, exUser.password);
  	  if (result) {
  	  	done(null, exUser);
  	  } else {
  	  	done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
  	  }
    } else {
      done(null, false, { message: '가입되지 않은 회원입니다.' });
    }
  } catch (error) {
  	console.error(error);
  	done(error);
  }
}));
```

- done 메서드는 오류가 발생했을 때,  첫 번째 파라미터만 전달하며, 정상적으로 인증되었을 때는 첫번째 파라미터를 null로, 두 번째 파라미터에는 사용자 객체를 전달합니다.
- 로그인이 성공하면, `serializeUser` 메서드를 이용하여 사용자 정보를 Session에 저장할 수 있습니다.
- Node.js의 로그인이 되어있다면, 모든 사용자 페이지를 접근할 경우 `deserializeUser`를 호출합니다.
- `deserializeUser`에서는 session에 저장된 값을 이용해서 사용자 profile을 찾은 후, HTTP request에 return 합니다.
- Session에 사용자 정보를 저장시, 정보가 크다면 메모리가 많이 소모되기 때문에, `serializeUser`에서 사용자 id와 같은 키 정보만 저장하도록 하고, 페이지가 접근 될 때마다 `deserializeUser`가 수행되면 세션에 저장된 사용자 id를 이용하는 방식입니다.
- 따라서, `deserializeUser`에서는 콜백함수의 첫 번째 인자로 id를 받습니다.
- 하지만, 이 방식은 메모리를 아낄 수는 있어도 페이지 접근마다 `deserializeUser` 함수를 통한 DB select가 발생하기 때문에 많은 성능 저하가 옵니다.  10~20개 정도의 필드는 HTTP Session에 저장해도 큰 문제가 없습니다.
  => 추가 학습: redis와 같은 외부 메모리 DB를 이용해서 session 정보를 저장하도록 하는 방법을 사용합니다.

## route 단에서

```javascript
 passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next);
```

- passport.authenticate라는 메서드는 /URL로 들어오는 요청에 대해서 사용자 인증을 처리하도록 passport.authentication을 중간에 미들웨어 형태로 끼워놓은 것입니다.

- 인증에 성공하면 콜백함수로 요청이 연결되고, 실패하면 401 Unathorized HTTP response를 리턴합니다.

- authenticate의 첫 번째 인자로 인증 Strategy를 정의하며, 아래와 같이 인증 성공/실페에 따라 다른 페이지로 리다이렉션 하도록 설정할 수도 있습니다.

  ```javascript
  app.post('/login',
    passport.authenticate('local', { 
    	failureRedirect: '/login_fail', 
    	failureFlash: true 
  	}),
  	function(req, res) {
    	res.redirect('/login_success');
  	});
  ```

- 페이지별로 로그인이 되었는지를 확인하고, 로그인이 되어 있을 경우 HTTP request에서 사용자 정보를 가지고 오는 코드는 다음과 같습니다.

  ```javascript
  app.get('/login_success', ensureAuthenticated, function(req, res){
      res.send(req.user);
     // res.render('users', { user: req.user });
  });
  ```

  이 때, req.user를 통해 deserializeUser에 의해 저장된 사용자 정보를 꺼내볼 수 있습니다.

### 요약

- passport에서 인증은 express router에서 passport.authenticate 메서드를 정의함으로써 인증 메서드를 호출할 수 있습니다. (이 때, 인증 Strategy를 정의합니다.)
- authenticate에서 정의한 인증 Strategy를 passport.use를 이용하여 정의하고 인증 함수를 구현합니다.
- 인증함수에서는 HTML form 필드를 통해 받은 id와 password가 전달되므로, DB 등을 연동하여 이를 증명하며, `done` 정보로 리턴합니다. 
- 인증이 성공한 것으로 리턴되면, 사용자에 대한 정보를 세션에 저장할 수 있도록 `passport.serializeUser`에서는 `done` 정보에 의거하여 세션에 저장할 정보를 HTTP session에 저장합니다.
- 인증이 되어 로그인이 된 사용자는 요청마다 passport.deserializeUser 매서드를 호출하게 되고, serialUser에서 저장한 사용자 id 키를 이용하여 사용자 정보를 DB 등에서 조회하여 HTTP request로 리턴합니다.
- 해당 사용자가 로그인이 되어있는지 확인하기 위해 req.isAuthenticated를 활용하여 로그인 여부를 판단하여 접근제어 관련 함수를 정의합니다.
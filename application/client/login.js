 /*global $, document, window, setTimeout, navigator, console, location*/
 $(document).ready(function () {
    var usernameError = true,
        emailError = true,
        passwordError = true,
        passConfirm = true;

    // Detect browser for css purpose
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        $('.form form label').addClass('fontSwitch');
    }

    // Label effect
    $('input').focus(function () {
        $(this).siblings('label').addClass('active');
    });

    // Form validation
    $('input').blur(function () {
        // User Name
        if ($(this).hasClass('name')) {
            if ($(this).val().length === 0) {
                $(this).siblings('span.error').text('Please type your full name').fadeIn().parent('.form-group').addClass('hasError');
                usernameError = true;
            } else if ($(this).val().length > 1 && $(this).val().length <= 6) {
                $(this).siblings('span.error').text('Please type at least 6 characters').fadeIn().parent('.form-group').addClass('hasError');
                usernameError = true;
            } else {
                $(this).siblings('.error').text('').fadeOut().parent('.form-group').removeClass('hasError');
                usernameError = false;
            }
        }
        // Email
        if ($(this).hasClass('email')) {
            if ($(this).val().length == '') {
                $(this).siblings('span.error').text('Please type your email address').fadeIn().parent('.form-group').addClass('hasError');
                emailError = true;
            } else {
                $(this).siblings('.error').text('').fadeOut().parent('.form-group').removeClass('hasError');
                emailError = false;
            }
        }

        // PassWord
        if ($(this).hasClass('pass')) {
            if ($(this).val().length < 8) {
                $(this).siblings('span.error').text('Please type at least 8 charcters').fadeIn().parent('.form-group').addClass('hasError');
                passwordError = true;
            } else {
                $(this).siblings('.error').text('').fadeOut().parent('.form-group').removeClass('hasError');
                passwordError = false;
            }
        }

        // PassWord confirmation
        if ($('.pass').val() !== $('.passConfirm').val()) {
            $('.passConfirm').siblings('.error').text('Passwords don\'t match').fadeIn().parent('.form-group').addClass('hasError');
            passConfirm = false;
        } else {
            $('.passConfirm').siblings('.error').text('').fadeOut().parent('.form-group').removeClass('hasError');
            passConfirm = false;
        }

        // label effect
        if ($(this).val().length > 0) {
            $(this).siblings('label').addClass('active');
        } else {
            $(this).siblings('label').removeClass('active');
        }
    });

    // form switch
    $('a.switch').click(function (e) {
        $(this).toggleClass('active');
        e.preventDefault();

        if ($('a.switch').hasClass('active')) {
            $(this).parents('.form-peice').addClass('switched').siblings('.form-peice').removeClass('switched');
        } else {
            $(this).parents('.form-peice').removeClass('switched').siblings('.form-peice').addClass('switched');
        }

        // Toggle active class to show/hide forms
        $('.form-peice').toggleClass('active');
    });

    // Form submit
    $('form.signup-form').submit(function (event) {
        event.preventDefault();

        if (usernameError == true || emailError == true || passwordError == true || passConfirm == true) {
            $('.name, .email, .pass, .passConfirm').blur();
        } else {
            $('.signup, .login').addClass('switched');

            setTimeout(function () { $('.signup, .login').hide(); }, 700);
            setTimeout(function () { $('.brand').addClass('active'); }, 300);
            setTimeout(function () { $('.heading').addClass('active'); }, 600);
            setTimeout(function () { $('.success-msg p').addClass('active'); }, 900);
            setTimeout(function () { $('.success-msg a').addClass('active'); }, 1050);
            setTimeout(function () { $('.form').hide(); }, 700);
        }
    });

    // Reload page
    $('a.profile').on('click', function () {
        location.reload(true);
    });
});

var app = angular.module('application', []);

app.controller('AppCtrl', function ($scope, $timeout, appFactory) {
    $("#success_login").hide();
    $("#success_register").hide();

    $scope.loginAB = function() {
        console.log("Login request data:", $scope.login);  // 로그인 요청 데이터 로그 추가
        appFactory.loginAB($scope.login, function(data) {
            if (data.success) {  // 서버 응답을 success 필드로 확인
                console.log('Login successful');  // 추가 로그
                // 로그인 성공 시 mainpage.html로 리디렉션
                window.location.href = `mainpage.html?userId=${$scope.login.userId}`;
            } else {
                console.log('Login failed');  // 추가 로그
                $scope.login_ab = "login failed";
                $("#success_login").show();
            }
        });
    };

    $scope.registerAB = function () {
        console.log("Register request data:", $scope.abstore);  // 회원가입 요청 데이터 로그 추가
        appFactory.registerAB($scope.abstore, function (data) {
            if (data.success) {  // 서버 응답을 success 필드로 확인
                console.log('Register successful');  // 추가 로그
                // 회원가입 성공 시 메시지 표시
                $scope.register_ab = "register success";
                $("#success_register").show();
                // 내부 필드값 초기화
                $timeout(function() {
                    $scope.abstore.name = '';
                    $scope.abstore.id = '';
                    $scope.abstore.phone_number = '';
                    $scope.abstore.pw = '';
                    $scope.abstore.account_number = '';
                    $scope.abstore.account_money = '';
                }, 0);
            } else {
                console.log('Register failed');  // 추가 로그
                $scope.register_ab = "register failed";
                $("#success_register").show();
            }
        });
    };
});

app.factory('appFactory', function ($http) {
    var factory = {};

    factory.loginAB = function (data, callback) {
        console.log("Sending login request to server:", data);  // 서버로 로그인 요청 보내는 데이터 로그 추가
        $http.post('/login', data)  // POST 요청으로 변경
            .then(function (response) {
                console.log("Login response from server:", response.data);  // 서버로부터의 응답 로그 추가
                callback(response.data);
            })
            .catch(function (error) {
                console.error('Error during login:', error);
                callback({ success: false, message: "Login failed" });
            });
    };

    factory.registerAB = function (data, callback) {
        console.log("Sending register request to server:", data);  // 서버로 회원가입 요청 보내는 데이터 로그 추가
        $http.post('/register', data)  // POST 요청으로 변경
            .then(function (response) {
                console.log("Register response from server:", response.data);  // 서버로부터의 응답 로그 추가
                callback(response.data);
            })
            .catch(function (error) {
                console.error('Error during registration:', error);
                callback({ success: false, message: "Register failed" });
            });
    };

    return factory;
});

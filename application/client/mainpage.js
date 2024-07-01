'use strict';

var app = angular.module('mainApp', []);

app.controller('MainCtrl', function($scope, $http) {
    // URL에서 userId 가져오기
    var urlParams = new URLSearchParams(window.location.search);
    var userId = urlParams.get('userId');
    console.log('User ID from URL:', userId);  // 콘솔 로그 추가

    if (userId) {
        $http.get('/query?name=' + userId)  // 'name'을 'userId'로 전달
            .then(function(response) {
                console.log('User data from server:', response.data);  // 서버 응답 데이터 로그
                $scope.user = response.data;
            })
            .catch(function(error) {
                console.error('Error fetching user data:', error);
            });
    } else {
        $scope.user = {
            id: 'Guest',
            point: 0
        };
    }

    $scope.albums = [];

    $http.get('/albums')
        .then(function(response) {
            $scope.albums = response.data;
        })
        .catch(function(error) {
            console.error('Error fetching albums:', error);
        });

    $scope.goToMypage = function() {
        window.location.href = 'mypage.html?userId=' + $scope.user._id;
    };

    $scope.goToRegisterMusic = function() {
        window.location.href = 'music_register.html?userId=' + $scope.user._id;  // userId를 URL 파라미터로 포함
    };

    $scope.tradeSong = function(songName) {
        $http.post('/transfer', {
            senderID: $scope.user._id,
            songName: songName
        })
        .then(function(response) {
            alert('거래가 완료되었습니다.');
        })
        .catch(function(error) {
            alert('거래 중 오류가 발생했습니다: ' + (error.data ? error.data.error : '알 수 없는 오류'));
        });
    };
});

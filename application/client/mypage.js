'use strict';

var app = angular.module('application', []);

app.controller('MypageCtrl', function($scope) {
    // 세션 또는 로컬 저장소에서 유저 정보 불러오기
    $scope.user = JSON.parse(sessionStorage.getItem('user'));
});
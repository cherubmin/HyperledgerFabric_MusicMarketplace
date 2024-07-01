var app = angular.module('application', []);

app.controller('MypageCtrl', function($scope, appFactory){
    var urlParams = new URLSearchParams(window.location.search);
    var userId = urlParams.get('userId');

    // userId로 사용자 정보 로드
    if(userId){
        appFactory.queryAB(userId, function(data){
            console.log('User data:', data); // 로드된 데이터 로그 확인
            $scope.user = data;  // JSON.parse 제거
            $scope.user.profilePicture = 'https://via.placeholder.com/150';
        });
    }

    $scope.goToAddSong = function() {
        window.location.href = './music_register.html?userId=' + $scope.user._id;  // _id를 사용하여 리디렉션
    };

    $scope.charge = function() {
        var chargeAmount = $scope.chargeAmount;

        if (chargeAmount && chargeAmount > 0) {
            appFactory.chargeAB({ userId: $scope.user._id, amount: chargeAmount }, function(response) {  // _id를 사용하여 충전
                if (response.status === 200) {
                    // 성공적으로 충전이 완료되었을 때, 사용자 정보를 다시 로드합니다.
                    appFactory.queryAB($scope.user._id, function(data){
                        $scope.user = JSON.parse(data);
                    });
                    Swal.fire({
                      title: '충전 완료',
                      text: '충전이 완료되었습니다.',
                      icon: 'success',
                    }).then(() => {
                        $('#chargeModal').modal('hide');
                    });
                } else {
                    alert('충전 실패: ' + response.data);
                }
            });
        } else {
            alert('올바른 금액을 입력하세요.');
        }
    };

    $scope.exchange = function() {
        var exchangeAmount = $scope.exchangeAmount;

        if (exchangeAmount && exchangeAmount > 0) {
            appFactory.exchangeAB({ userId: $scope.user._id, amount: exchangeAmount }, function(response) {  // _id를 사용하여 환전
                if (response.status === 200) {
                    // 성공적으로 환전이 완료되었을 때, 사용자 정보를 다시 로드합니다.
                    appFactory.queryAB($scope.user._id, function(data){
                        $scope.user = data;
                    });
                    Swal.fire({
                      title: '환전 완료',
                      text: '환전이 완료되었습니다.',
                      icon: 'success',
                    }).then(() => {
                        $('#exchangeModal').modal('hide');
                    });
                } else {
                    alert('환전 실패: ' + response.data);
                }
            });
        } else {
            alert('올바른 금액을 입력하세요.');
        }
    };
});

app.factory('appFactory', function($http){
    var factory = {};

    factory.queryAB = function(name, callback){
        $http.get('/query?name='+name).success(function(output){
            callback(output);
        });
    };

    factory.chargeAB = function(data, callback) {
        $http.post('/charge', data).then(function(response) {  // POST 요청으로 변경
            callback(response);
        });
    };

    factory.exchangeAB = function(data, callback) {
        $http.post('/exchange', data).then(function(response) {  // POST 요청으로 변경
            callback(response);
        });
    };

    return factory;
});

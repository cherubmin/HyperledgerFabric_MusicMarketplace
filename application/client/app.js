'use strict';

var app = angular.module('application', []);

app.controller('AppCtrl', function($scope, appFactory){
   $("#success_register").hide();
   $("#success_login").hide();
   $("#success_qurey").hide();
   $("#success_delete").hide();
   $("#success_transfer").hide();
   $("#success_searchadmin").hide();

   $scope.registerAB = function(){
       appFactory.registerAB($scope.abstore, function(data){
           if(data == "")
           $scope.register_ab = "success";
           $("#success_register").show();
       });
   };
   $scope.loginAB = function(){
        appFactory.loginAB($scope.login, function(data){
            $scope.login_ab = "login success";
            $("#success_login").show();
        });
    };
   $scope.queryAB = function(){
        appFactory.queryAB($scope.walletid, function(data){
           $scope.query_ab = data;
           $("#success_qurey").show();
       });
   };
   $scope.deleteAB = function(){
        appFactory.deleteAB($scope.abstore, function(data){
            $scope.delete_ab = "delete";
            $("#success_delete").show();
     });
    };
    $scope.transferAB = function(){
        appFactory.transferAB($scope.transfer, function(data){
            $scope.transfer_ab = "transfer successful";
            $("#success_transfer").show();
        });
      };
    $scope.searchAdmin = function() {
        appFactory.queryAB("Admin", function(data){
            $scope.search_admin = data;
            $("#success_searchadmin").show();
        });
    }
    
});

app.factory('appFactory', function($http){
      
    var factory = {};
 
    factory.registerAB = function(data, callback){
        $http.get('/register?name='+data.name+'&id='+data.id+'&pw='+data.pw+'+&phone_number='+data.phone_number+'&account_number='+data.account_number+'&account_money='+data.account_money).success(function(output){
            callback(output)
        });
    }
    factory.loginAB = function(data, callback){
        $http.get('/login?userId='+data.userId+'&userPw='+data.userPw).success(function(output){
            if (output.success) {
                // 유저 정보를 세션 또는 로컬 저장소에 저장
                sessionStorage.setItem('user', JSON.stringify(output.user));
                callback(output);
                // 마이페이지로 이동
                window.location.href = '/mypage.html';
            } else {
                callback(output);
            }
        });
    };
    
    factory.queryAB = function(name, callback){
        $http.get('/query?name='+name).success(function(output){
            callback(output)
        });
    }
    factory.deleteAB = function(data, callback){
        $http.get('/delete?a='+data.a).success(function(output){
            callback(output)
        });
    }

    factory.transferAB = function(data, callback){
        $http.get('/transfer?sender='+data.sender+'&receiver='+data.receiver+'&amount='+data.amount).success(function(output){
            callback(output)
        });
    }

    factory.searchAdmin = function(callback){
        $http.get('/query?name=admin').success(function(output){
            callback(output)
        }); 
    }


    return factory;
 });
 
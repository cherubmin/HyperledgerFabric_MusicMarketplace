document.addEventListener("DOMContentLoaded", function() {
    var urlParams = new URLSearchParams(window.location.search);
    var userId = urlParams.get('userId');
    if (!userId) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html'; // 로그인 페이지로 리디렉션
        return;
    }

    var form = document.getElementById('registerForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // 폼의 기본 제출 동작을 막음

        var formData = new FormData(form);
        formData.append('userID', userId); // 사용자 ID를 추가

        // 폼 데이터를 서버로 전송
        fetch(form.action, {
            method: 'POST',
            body: formData
        }).then(function(response) {
            return response.json();
        }).then(function(data) {
            console.log('등록 성공:', data);
            alert('음원이 성공적으로 등록되었습니다.');
            window.location.href = `mypage.html?userId=${$scope.login.userId}`;

            // 성공 후 원하는 동작 수행 (예: 메인 페이지로 리디렉션)
        }).catch(function(error) {
            console.error('등록 실패:', error);
            alert('음원 등록에 실패했습니다.');
        });
    });
});
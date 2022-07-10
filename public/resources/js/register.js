let register = document.querySelector('.register');
let userName = document.querySelector('.user-name');
let email = document.querySelector('.email');
let password = document.querySelector('.password');


register.addEventListener('submit', (e) => {
    e.preventDefault();

    let body = {
        userName: userName.value,
        email: email.value,
        password: password.value,
        
    };
    console.log(body);
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/register');

    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function() {
      console.log(xhr.responseText);
      if (xhr.responseText == 'success') {
        console.log('user created');
        userName.value = '';
        email.value = '';
        password.value = '';
        window.location = "https://reflect-forum.herokuapp.com/login?";
      } else {
        alert('ERROR');
      }
    };
   
    xhr.send(JSON.stringify(body));

})
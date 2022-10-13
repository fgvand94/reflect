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
        alert(`Account created. You'll recieve an email from portfolliotemp@gmail.com to confirm your account. Check your spam.`)
        window.location = "https://reflect-forum.herokuapp.com/login?";
      } else if (xhr.responseText === 'email in use') {
        alert('email already in use');
      } else {
        alert('ERROR');
      }
    };
   
    xhr.send(JSON.stringify(body));

})

const form = document.querySelector('.form');
const email = document.querySelector('.email');
const password = document.querySelector('.password');


form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let body = {
        email: email.value,
        password: password.value
    }
   
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/login');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function() {       
        email.value = '';
        password.value = '';
        if (this.responseText === 'success') {
            window.location = 'http://localhost:5000/forums';
        };
        return;   
    };
    xhr.send(JSON.stringify(body));
});
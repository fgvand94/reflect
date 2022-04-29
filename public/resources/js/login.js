
const form = document.querySelector('.form');
const email = document.querySelector('.email');
let password = document.querySelector('.password');
let password2 = document.querySelector('.password2');



if (window.location.href === 'http://localhost:5000/confirm-email') {
    password.style.display = 'none';
};

if (window.location.href.slice(0, 36) === 'http://localhost:5000/reset-password') {
    console.log('password reset');
    email.style.display = 'none';
    password2.style.display = 'block';
    let h4 = document.createElement('h4');
    
    document.querySelector('.form-container').appendChild(h4);
    h4.className = 'match';

    password.addEventListener('input', (e) => {
        if (password.value === password2.value) {
            document.querySelector('.match').innerHTML = 'Passwords match';
        } else {
            document.querySelector('.match').innerHTML = "Passwords don't match";
        }
    })

    password2.addEventListener('input', (e) => {
        if (password.value === password2.value) {
            document.querySelector('.match').innerHTML = 'Passwords match';
        } else {
            document.querySelector('.match').innerHTML = "Passwords don't match";
        }
    })
};
console.log(window.location.href)






form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let body = {
        email: email.value,
        password: password.value,
        password2: password2.value
    }

   console.log(body);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', window.location.href);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function() {       
        email.value = '';
        password.value = '';
        if (this.responseText === 'success') {
            window.location = 'http://localhost:5000/forums';
        };

        if (this.responseText === 'Not verified') {
            alert("This account hasn't been verified.");
        }

        if (this.responseText === 'password reset sent') {
            alert("Password reset sent");
        }
        return;   
    };
    xhr.send(JSON.stringify(body));
});
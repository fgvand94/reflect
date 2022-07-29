let form = document.querySelector(".new-thread");

let title = document.getElementById('thread');
let message = document.getElementById("message");


form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const lastSlash = window.location.href.lastIndexOf('/');
    const category = window.location.href.substring(43, lastSlash);
    console.log(category);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', `/forums/${category}/new-thread?thread=${title.value}&message=${message.value.replace(/\n/g, '<br>')}`);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        if (this.responseText === 'success') {
            window.location.href = `/forums/${category}_pg1`;
        }
    }
  
    xhr.send();
    
})


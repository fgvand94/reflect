let form = document.querySelector(".new-thread");

let title = document.getElementById('thread');
let message = document.getElementById("message");
let lastThreadId = 0; //make these non hard coded values later
let userId = 1; //make these non hard coded values later
let threadKey = 'thread2'; //make these non hard coded values later


form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let newThread = {
        key: threadKey,
        threadValues: {
        title: title.value,
        user:'work-on-that-later',
        id: lastThreadId + 1,
        userId: userId,
        },
        post: message.value
    };
    const lastSlash = window.location.href.lastIndexOf('/');
    const category = window.location.href.substring(29, lastSlash);
    console.log(category);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', `/forums/${category}/new-thread?thread=${title.value}&message=${message.value.replace(/\n/g, '<br>')}`);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        if (this.responseText === 'success') {
            window.location.href = `/forums/${category}`;
        }
    }
  
    xhr.send();
    
})


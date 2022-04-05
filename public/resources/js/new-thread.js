let form = document.querySelector(".new-thread");

let title = document.getElementById('thread-title');
let post = document.getElementById("message-input");
let lastThreadId = 0; //make these non hard coded values later
let userId = 1; //make these non hard coded values later
let threadKey = 'thread2'; //make these non hard coded values later


form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('bloop');
    let newThread = {
        key: threadKey,
        threadValues: {
        title: title.value,
        user:'work-on-that-later',
        id: lastThreadId + 1,
        userId: userId,
        },
        post: post.value
    };



    let xhr = new XMLHttpRequest();
    xhr.open('POST', `/linked-pages/reflect/new-thread.html?new-thread=${title.value}&message-input=${post.value}`);
    xhr.setRequestHeader('content-type', 'application/json');

   console.log('jkfda;sd');
    xhr.send(JSON.stringify(newThread));
    console.log('yarp')
})


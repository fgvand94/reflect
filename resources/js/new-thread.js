// const {users, threads, posts} = require("./database.js");
let form = document.querySelector(".new-thread");

let title = document.getElementById('thread-title');
let post = document.getElementById("message-input");
let lastThreadId = 0; //make these non hard coded values later
let userId = 1; //make these non hard coded values later
let threadKey = 'thread2'; //make these non hard coded values later

//I could just update the database in here without ever having to send it to my
//server but because I will eventually need to use the server to communicate
//between my front end and my database I think I'm going to set it up with 
//routes in my server file
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
    // xhr.onload = function() {
    //   console.log(xhr.responseText);
    //   if(xhr.responseText == 'success') {
    //     //I need to rediract back to the threads.html
    //     newThread = {};
    //   } else {
    //     alert('ERROR');
    //   }
    // }
   console.log('jkfda;sd');
    xhr.send(JSON.stringify(newThread));
    console.log('yarp')
})

// const display = () => {
//     console.log(threads);
// }

// window.addEventListener('mouseover', display);
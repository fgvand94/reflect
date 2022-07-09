let form = document.querySelector(".new-post");

let message = document.getElementById("message");
let lastThreadId = 0; //make these non hard coded values later
let userId = 1; //make these non hard coded values later
let threadKey = 'thread2'; //make these non hard coded values later


let navPost = document.querySelector('.thread-name');
let newPost = document.querySelector('.new-post');
const forum = document.querySelector('.forum');
let windowFull = window.location.href;
// let post = windowFull.slice(thread + 1);


// let threadid = post.lastIndexOf('-');



let nav = windowFull.replace("https://reflect-forum.herokuapp.com/forums/", "");
let category1 = nav.substring(0, nav.lastIndexOf('/'));
let category = category1.substring(0, category1.lastIndexOf('/'));
let thread = category1.substring(category1.lastIndexOf('/') + 1);
let categoryUpper = category.charAt(0).toUpperCase() + category.slice(1);

forum.innerHTML = categoryUpper;
forum.href = `/forums/${category}_pg1`;
navPost.innerHTML = thread.slice(0, thread.lastIndexOf('-')).replaceAll('-', ' ');
navPost.href = `/forums/${category}/${thread}`;


console.log(newPost.href);




newPost.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // let newPost = {
    //     key: threadKey,
    //     threadValues: {
    //     user:'work-on-that-later',
    //     id: lastThreadId + 1,
    //     userId: userId,
    //     },
    //     post: message.value
    // };
 
    const lastSlash = windowFull.lastIndexOf('/');
    const lastSlashSlice = window.location.href.slice(0, windowFull.lastIndexOf('/'));
    const nextLastSlash = lastSlashSlice.lastIndexOf('/');
    const category = window.location.href.substring(29, nextLastSlash);
    const thread = windowFull.slice(nextLastSlash + 1, lastSlash);
    const threadId = thread.slice(thread.lastIndexOf('-') + 1, thread.lastIndexOf('_'));
    console.log(thread);
    console.log(threadId);
    // console.log(category);
    let body = {
        threadId: threadId
    }
    console.log(`forums/${category}/${thread}/add-a-post?message=${message.value.replace(/\n/g, '<br>')}`);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', `/forums/${category}/${thread}/add-a-post?message=${message.value.replace(/\n/g, '<br>')}`);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        if (this.responseText === 'success') {
        window.location.href = `/forums/${category}/${thread}`;
        } else {
            alert('post failed');
        }

    }
  
    xhr.send(JSON.stringify(body));
   
    
})


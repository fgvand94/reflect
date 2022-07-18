let form = document.querySelector(".new-post");

let message = document.getElementById("message");

let navPost = document.querySelector('.thread-name');
let newPost = document.querySelector('.new-post');
const forum = document.querySelector('.forum');
let windowFull = window.location.href;


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
     
    const lastSlash = windowFull.lastIndexOf('/');
    const lastSlashSlice = window.location.href.slice(0, windowFull.lastIndexOf('/'));
    const nextLastSlash = lastSlashSlice.lastIndexOf('/');
   
    const threadId = thread.slice(thread.lastIndexOf('-') + 1, thread.lastIndexOf('_'));
    console.log(thread);
    console.log(threadId);
 
    let body = {
        threadId: threadId
    }
    console.log(`forums/${category}/${thread}/add-a-post?message=${message.value.replace(/\n/g, '<br>')}`);
    console.log(`forums/${category}/${thread}/add-a-post?message=${message.value}`);

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


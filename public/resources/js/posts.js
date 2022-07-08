let navPost = document.querySelector('.thread-name');
let newPost = document.querySelector('.new-post');
const forum = document.querySelector('.forum');
let windowFull = window.location.href;
let thread = window.location.href.lastIndexOf('/');
let post = windowFull.slice(thread + 1);
let allPosts = document.querySelector('.column-container');
let currentUser = document.querySelector('.user');
let threadid = post.lastIndexOf('-');
if (post === 'new-thread' || post === 'Introduce-yourself') {
    navPost.innerHTML = post.replaceAll('-', ' ');
} else {
    navPost.innerHTML = post.substring(0, threadid).replaceAll('-', ' ');
}
// navPost.innerHTML = post.substring(0, threadid).replaceAll('-', ' ');
console.log(post);

let nav = windowFull.replace("https://reflect-forum.herokuapp.com/forums/", "");
let category = nav.substring(0, nav.lastIndexOf('/'));
let categoryUpper = category.charAt(0).toUpperCase() + category.slice(1);

forum.innerHTML = categoryUpper;
forum.href = `/forums/${category}_pg1`;

newPost.href = windowFull + '/add-a-post';
console.log(newPost.href);


// for (let i = 0; i < 20; i++) {
//     console.log(i);
//     if (document.querySelector(`.posts${i}`).getAttribute('data-id') === 'false') {
//         if (document.querySelector(`.posts${i}`).innerHTML === currentUser.innerHTML) {
                  
//             document.querySelector(`.update-post${i}`).style.display = 'block';
        
//             document.querySelector(`.update-post${i}`).addEventListener('click', (e) => {
//                 document.querySelector(`.update-form${i}`).style.display = 'block';
                
//             });
        
//         }
    
//     }
// }

allPosts.addEventListener('click', (e) => {

    if (e.target.className.slice(0, 11) === 'update-post') {

        document.querySelector(`.update-post${e.target.className.slice(23)}`).style.display = 'none';
        document.querySelector(`.update-form${e.target.className.slice(23)}`).style.display = 'block'; 

        // document.querySelector(`.update-text${e.target.className.slice(23)}`).addEventListener('keydown', (event) => {
        //     if (event.key == 'Tab') {
        //         event.preventDefault();

        //         var start = event.target.selectionStart;
        //         var end = event.target.selectionEnd;

        //         function getLineNumber() {

        //             return event.target.value.substr(0, event.target.selectionStart) // get the substring of the textarea's value up to the cursor position
        //               .split("\n") // split on explicit line breaks
        //               .map((line) => 1 + Math.floor(line.length / event.target.cols)) // count the number of line wraps for each split and add 1 for the explicit line break
        //               .reduce((a, b) => a + b, 0); // add all of these together
        //           };





              
        //         console.log(start/getLineNumber(), event.target.cols, getLineNumber())

        //         // if (start / getLineNumber() >= event.target.cols) {
        //         //     console.log('if');
        //         //     event.target.selectionStart =
        //         //     event.target.selectionEnd = (50 * (getLineNumber() - 1)) + 1;
        //         // } else {

                  
        //             console.log('else');
        //             event.target.value = event.target.value.substring(0, start) +
        //             '     ' + event.target.value.substring(end);
        //             // event.target.value.substring(50 * (getLineNumber() - 1) + 1, 50 * (getLineNumber() + 1))
        //             // = '     ' + event.target.value.substring(50 * (getLineNumber() - 1) + 1, 50 * (getLineNumber() + 1));
        //             event.target.selectionStart =
        //             event.target.selectionEnd = start + 5;
        //         // }    
        //     }
        // })

        document.querySelector(`.update-text${e.target.className.slice(23)}`).value 
        = document.querySelector(`.content${e.target.className.slice(23)}`).innerText;

        document.querySelector(`.update-cancel${e.target.className.slice(23)}`).addEventListener('click', (event) => {
    
            document.querySelector(`.update-form${e.target.className.slice(23)}`).style.display = 'none';
            document.querySelector(`.update-post${e.target.className.slice(23)}`).style.display = 'block';
        });

        document.querySelector(`.update-button${e.target.className.slice(23)}`).addEventListener('click', (event) => {
            event.preventDefault();

            let content = document.querySelector(`.update-text${e.target.className.slice(23)}`).value;

            let contentBreaks = content.replace(/\n/g, '<br>');
            
            //i forget this (/\s+/g, '-') is for all spaces so that would have helped
            //some of it. maybe I can make it work better now. 
            let obj = {
                category: window.location.href.slice(29, window.location.href.lastIndexOf('/')),
                content: contentBreaks,
                id: document.querySelector(`.update-form${e.target.className.slice(23)}`).getAttribute('data-id')
            }

            let xhr = new XMLHttpRequest();
            xhr.open('PUT', '/update-post');
            xhr.setRequestHeader('content-type', 'application/json');
            xhr.onload = function () {
                if (this.responseText === 'success') {
                    location.reload();
                }
            }

            xhr.send(JSON.stringify(obj));
        })
    }
})


 

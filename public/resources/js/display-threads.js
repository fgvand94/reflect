//  <div class="thread">
// <a href="./posts.html"><h2>Introduce yourself</h2></a>
// <p>username</p>
// </div>  

let threadContainer = document.querySelector('.column-container');
let div = document.createElement("div");
let a = document.createElement("a");
let h2 = document.createElement("h2");
let p = document.createElement("p");


threadContainer.append(div);
div.append(a);
div.append(p);
a.append(h2);
a.href = './posts.html';


let threadDivs = threadContainer.querySelectorAll(':scope > div');

for (let i = 0; i < threadDivs.length; i++) {
    threadDivs[i].className = 'thread';
}




// h2.append(threads[threadType].thread1.title);
// p.append(threads[threadType].thread1.user);
// console.log(threads[threadType]);


const getThreadName = (e) => {
    localStorage.setItem('thread', e.target.innerHTML);
    
}

threadContainer.addEventListener('mouseover', getThreadName); 
let threadType = localStorage.getItem('selected').toLowerCase();

// window.addEventListener('load', (e) => {
//    e.preventDefault();
//     // let body = {
//     //     category: threadType,

//     // }

//     let xhr = new XMLHttpRequest();
//     xhr.open('GET', '/reflect/forums/threads');
   
//     console.log('yada');
   
//     xhr.send();
    

// })








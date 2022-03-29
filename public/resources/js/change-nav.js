// import { forumInfo } from "./choose-forum.js";

let forumNav = document.querySelector('.forumNav');
let selected = localStorage.getItem('selected');
const onLoad = () => {

 forumNav.innerHTML = selected;
 console.log(selected);
    
}


window.addEventListener('load', onLoad);


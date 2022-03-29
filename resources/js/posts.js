let forumNav = document.querySelector('.forum');
let threadName = document.querySelector('.thread-name');

forumNav.innerHTML = localStorage.getItem('selected');
threadName.innerHTML = localStorage.getItem('thread');
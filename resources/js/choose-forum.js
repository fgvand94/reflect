let forum = document.querySelector('.column-container');



let forumName;




const getForumName = (e) => {
    localStorage.setItem('selected', e.target.innerHTML);
}

const removeClick = () => {
    forum.addEventListener('mouseover', getForumName);
    
}


forum.addEventListener('mouseover', getForumName);






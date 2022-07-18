const addPost = document.querySelector('.add-post');
const addButton = document.querySelector('.add-button');
const addText = document.querySelector('.post-text');


addButton.addEventListener('click', (e) => {
    let body = {
        content: addText.value,
        id: window.location.href.slice(window.location.href.lastIndexOf('-')+1, window.location.href.lastIndexOf('_'))
    }

    console.log(body.id);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/conversation-add');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        if (this.responseText === 'success') {
            console.log('reload');
            location.reload();
        }
    }
    xhr.send(JSON.stringify(body));
})



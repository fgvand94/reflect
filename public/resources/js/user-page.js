let bioUpdate = document.querySelector('.update-bio');
let bioForm = document.querySelector('.bio-form');
let bioInput = document.querySelector('.bio-input');
let bioButton = document.querySelector('.bio-button');
let bioText = document.querySelector('.bio-text');
let bioCancel = document.querySelector('.bio-cancel');

let photoUpdate = document.querySelector('.update-picture');
let photoForm = document.querySelector('.photo-form');
let photoInput = document.querySelector('.photo-input');
let photoUpload = document.querySelector('.photo-upload');
let photoCancel = document.querySelector('.photo-cancel');

let image = document.querySelector('.img-container');
let imageEnlarge = document.querySelector(".image-enlarge");
let exit = document.querySelector('.exit');
let enlargedImage = document.querySelector('.enlarged-image');
let setPicture = document.querySelector('.set-picture');

let newConversation = document.querySelector('.submit');
let conversationUser = document.querySelector('.user');
let conversationTitle = document.querySelector('.title');
let conversationContent = document.querySelector('.message');

let aspectRatio = window.innerWidth/window.innerHeight;
let windowPhotoHeight = Math.floor(window.innerHeight * .48);

let setPictureSrc;

const showBioForm = (e) => {
    bioForm.style.display = 'block';
}

bioUpdate.addEventListener('click', showBioForm);


bioCancel.addEventListener('click', () => {
    bioInput.value = '';
    bioForm.style.display = 'none';
    
})


bioButton.addEventListener('click', (e) => {
    let body = {
        bio: bioInput.value
    }
    console.log(body.bio);

    bioForm.style.display = 'none';

    xhr = new XMLHttpRequest();
    xhr.open('POST', `${window.location.href.slice(window.location.href.lastIndexOf('/'))}`);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        console.log(this.responseText)
        if (this.responseText === 'success') {
            location.reload();          
        }
    }
    xhr.send(JSON.stringify(body));
});


photoUpdate.addEventListener('click', () => {
    photoForm.style.display = 'block'
});

photoCancel.addEventListener('click', () => {
    photoForm.style.display = 'none';
})


photoUpload.addEventListener('click', () => {
    
    let body = {
        photos: '',
        height: windowPhotoHeight
    }

    xhr = new XMLHttpRequest();
    xhr.open('POST', `${window.location.href.slice(window.location.href.lastIndexOf('/'))}`);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        console.log(this.responseText);
        if (this.responseText === 'success') {
            location.reload();          
        }
    }
    console.log(photoInput.files[0]);
    const reader = new FileReader();
    reader.readAsDataURL(photoInput.files[0]);
    reader.onload = function() {
        body.photos = reader.result;
        // console.log(body.photos);
        xhr.send(JSON.stringify(body));
    }
   
})

image.addEventListener('click', (e) => {
  
    if (e.target.className === 'photos') {
        let borderWidth = e.target.dataset.width*1.12;
        let borderLeft = (window.innerWidth - borderWidth)/2;
        let imageLeft = (borderWidth - e.target.dataset.width)/2
        imageEnlarge.style.display = 'block';
        imageEnlarge.style.width = `${borderWidth}px`;
        imageEnlarge.style.left = `${borderLeft}px`;
        enlargedImage.src = e.target.dataset.full;
        enlargedImage.style.height = `${windowPhotoHeight}px`;
        enlargedImage.style.width = `${e.target.dataset.width}px`;
        enlargedImage.style.left = `${imageLeft}px`;
        setPictureSrc = e.target.src;
    }
})

exit.addEventListener('click', () => {
    imageEnlarge.style.display = 'none';
})

setPicture.addEventListener('click', () => {
  
    console.log('what');
    let body = {
        data: setPictureSrc,
    }

    setPictureSrc = "";
    let xhr = new XMLHttpRequest();
    xhr.open('PUT', '/updatePhoto');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        if(this.responseText === 'success') {
            location.reload();  
        }
    };
    xhr.send(JSON.stringify(body));
})

newConversation.addEventListener('click', (e) => {
    e.preventDefault();

    body = {
        user: conversationUser.value,
        title: conversationTitle.value,
        message: conversationContent.value
    }
 
    let xhr = new XMLHttpRequest();

    xhr.open('POST', '/new-conversation');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        if (this.responseText === 'success') {
            location.reload();
        }
    }
    xhr.send(JSON.stringify(body));
})

// this is mostly just for testing purposes. I haven't decided if I want the database
// to be relational or document based yet.




let users = {
    user1: {
        name: "forvand",
        email: "vanduren.forrest1@gmail.com",
        password: "whatever",
        userId: 0
    }
}

let threads = {
    camping: {
        thread1: {
            title: "Camping thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },

    hiking: {
        thread1: {
            title: "Hiking thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },

    backpacking: {
        thread1: {
            title: "Backpacking thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },

    fish: {
        thread1: {
            title: "Fish thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },
    
    mammals: {
        thread1: {
            title: "Mammals thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },
    
    reptiles: {
        thread1: {
            title: "Reptiles thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },
    
    trees: {
        thread1: {
            title: "Trees thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },
    
    
    vegitation: {
        thread1: {
            title: "Vegitation thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },
    
    
    flowers: {
        thread1: {
            title: "Flowers thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    },
    
    
    mushrooms: {
        thread1: {
            title: "Mushrooms thread",
            user: "forvand",
            id: 0,
            userId: 0
        }
    }   
    
}


let posts = {

}


// let threadType = localStorage.getItem('selected').toLowerCase();
const addNewThread = (object, keys) => {
    // let threadType = localStorage.getItem('selected').toLowerCase();
    console.log(object);
return threads.camping[object] = keys;
//  console.log(threads.camping[object]);
};
// let whatever = {
//     stuff: 'stuff'
// }
// addNewThread("yada", whatever);



module.exports = {
    threads,
    users,
    posts,
    addNewThread

}

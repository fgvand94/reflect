const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'reflect',
  password: 'password',
  port: 5432,
});

pool.query(`select * from users where category = "camping"`, (err, res) => {
    if (err) {
        console.log(err.message);
    } else {
        console.log(res);
    };
});




// let selected = localStorage.getItem('selected');

const getUsers = (req, res) => {
    if (selected === 'Camping') {

    }
};
module.exports = {
    getCamping
}
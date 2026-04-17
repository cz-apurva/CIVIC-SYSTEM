const mysql = require("mysql2");

const db = mysql.createConnection({
  host:process.env.msql_host ,
  user:process.env.msql_user,
  password:process.env.msql_password,
  database:process.env.msql_database
});

db.connect(err=>{
  if(err) throw err;
  console.log("MySQL Connected");
});

module.exports = db;
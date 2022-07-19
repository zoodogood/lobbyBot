import sql from 'mysql2';

const pool = sql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'vovatop101',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log(pool);

pool.connect(err => {
  if (err)
    console.error(err);
})

pool.query("SHOW TABLES", (...args) => {
  console.log(args);
  console.log("-----");
  console.log(args.length);
});


// INSERT INTO guilds (id, selectLocale) values ("752898200993660959", "ru-ru") ON DUPLICATE KEY UPDATE id = id;
// SELECT * from guilds where id = "752898200993660959" LIMIT 1

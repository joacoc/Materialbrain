const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = 4000;
app.use(cors());

const pg = new Pool({
  host: "localhost",
  port: 6875,
  user: "materialize",
  password: "materialize",
  database: "materialize",
});

app.get("/", (req, res) => {
  const { query } = req;
  const { searchText } = query;

  pg.connect((err, client, done) => {
    if (err) {
      console.error(err);
      done();
      return;
    }

    client
      .query(
        "SELECT * FROM information WHERE title LIKE $1::text ORDER BY created_at DESC;",
        [searchText]
      )
      .then(({ rows }) => {
        res.send(rows);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });

    done();
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

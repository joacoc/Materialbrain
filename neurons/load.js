const { Pool } = require("pg");
const fs = require("fs");

/**
 * Materialize Client
 */
const materializePool = new Pool({
  host: "materialized",
  // host: "localhost",
  port: 6875,
  user: "materialize",
  password: "materialize",
  database: "materialize",
  min: 100,
  max: 200,
});

const poolPromises = [];
const processIssues = async (batchIssues) => {
  batchIssues
    .map((issue) => ({
      title: issue.title,
      text: issue.body,
      from: issue.user.login,
      in: issue.html_url,
      created_at: issue.created_at,
    }))
    .forEach(({ title, text, from, in: _in, created_at }) =>
      poolPromises.push(
        materializePool.query(
          `INSERT INTO github_issues (title, text, from, created_at, in) VALUES ($1, $2, $3, $4, $5);`,
          [title, text, from, created_at, _in]
        )
      )
    );
};

console.log("Reading local Github issues...");
const issues = fs
  .readFileSync(__dirname + "/issues-backup.data", "utf-8")
  .split("\n")
  .map((issue) => {
    if (issue) {
      try {
        return JSON.parse(issue);
      } catch (err) {
        console.error(err);
      }
    }
  })
  .filter((issue) => issue !== undefined);

console.log("Building up the brain in Materialize..");

materializePool.connect(async (err, client, done) => {
  if (err) throw new Error(err);

  /**
   * Set-Up Materialize
   */
  await client.query("DROP VIEW IF EXISTS information;");
  await client.query("DROP TABLE IF EXISTS github_issues;");

  await client.query(`
    CREATE TABLE IF NOT EXISTS github_issues (
      title TEXT,
      text TEXT,
      from TEXT,
      created_at TIMESTAMPTZ,
      in TEXT
    );
  `);

  await client.query(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS information AS
    SELECT * FROM github_issues;
  `);

  const batchIssues = [];
  for (const issue of issues) {
    if (batchIssues.length === 100) {
      processIssues(batchIssues);
      await Promise.all(poolPromises);
      batchIssues.splice(0, batchIssues.length);
      poolPromises.splice(0, poolPromises.length);
    }

    batchIssues.push(issue);
  }

  if (batchIssues.length > 0) {
    await processIssues(batchIssues);
  }

  done();
});

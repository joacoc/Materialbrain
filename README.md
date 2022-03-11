# Materialbrain
https://user-images.githubusercontent.com/11491779/157948747-86cf5333-e6e8-484d-bd0c-688cd28c4d66.mp4

## Using Materialize as a search engine

Code to run

```bash
docker-compose up
```

Go to `localhost:3000` in the browser and give it a try.


How does it look inside?

```sql
    -- Create a table with all the Github issues available
    CREATE TABLE IF NOT EXISTS github_issues (
      title TEXT,
      text TEXT,
      from TEXT,
      created_at TIMESTAMPTZ,
      in TEXT
    );
    
    -- Create a Materialized View on top
    CREATE MATERIALIZED VIEW IF NOT EXISTS information AS
    SELECT * FROM github_issues;
```

The front lobe will send the search term to the occipital lobe and it will query the Materialized view like this:
```javascript
  SELECT * FROM information WHERE title LIKE $1::text ORDER BY created_at DESC;
```

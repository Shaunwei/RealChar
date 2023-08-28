## Setting Postgresql

[Offical Postgresql Documentation](https://www.postgresql.org/download/macosx/)

- **Step 1**. Install via Brew
    ```sh
    brew install postgresql@15
    ```
    - You may need to add postgresql to your ~/.zhsrc file.
    ```
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
    ```
- **Step 2**. Start the Postgresql DB
    ```sh
    brew services start postgresql@15
    ```
- **Step 3**. Login to the default created DB.
    ```
    psql postgresql
    ```
- **Step 4**. Create a new `Temo` database.
    ```
    CREATE DATABASE temo;
    ```
- **Step 5**. Exit the DB and replace the environment variable `DATABASE_URL` in the .env with the Postgresql connector string.
    ```
    DATABASE_URL=postgresql://daryl.tan@localhost:5432/temo
    ```
- **Step 6**. Run the Alembic script provided with RealChar to update the DB schema.
    ```
    alembic upgrade head
    ```
- **Step 7**. Check that the RealChar required tables are created.
    ```
    psql postgresql://daryl.tan@localhost:5432/temo
    ```
    ```
    \dt

    ##             List of relations
    ## Schema |      Name       | Type  |   Owner   
    ## --------+-----------------+-------+-----------
    ## public | alembic_version | table | daryl.tan
    ## public | characters      | table | daryl.tan
    ## public | feedbacks       | table | daryl.tan
    ## public | interactions    | table | daryl.tan
    ## public | quivr_info      | table | daryl.tan
    ## public | users           | table | daryl.tan
    ## (6 rows)
    ```
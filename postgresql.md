## Setting Postgresql

[Offical Postgresql Documentation](https://www.postgresql.org/download/macosx/)

- **Step 5**. Exit the DB and replace the environment variable `DATABASE_URL` in the .env with the Postgresql connector string.
    ```
    DATABASE_URL=postgresql://admin:Password1!@db:5432/temo
    ```

# Render.com Deployment Guide
We have heard from you about difficulties in deploying RealChar in certain environments. We have experimented with Render (https://render.com/), which has a quick and easy way to deploy a repo directly. We hoep this helps you deploy RealChar quickly, without needing to set up the infra.

# Steps

## 1. Register account
Register account on [Render](https://render.com/).

## 2. Create a new web service
Click the "New+" in the top panel.

<img width="587" alt="Screen Shot 2023-09-02 at 14 30 40" src="https://github.com/Shaunwei/RealChar/assets/6148473/c4fa6db4-59a0-4ace-a176-0313a5584585">

## 3. Connect a repository
If you are using your own private forked version of RealChar, you need to grant access to Render to connect to your private repo. Otherwise, you can just use the public repo link in the "Public Git repository" section.

## 4. Setup the backend web service
You can follow the instructions on Render. Note Render detects we are using Docker so it automatically chooses the Docker setup.

Root directory can be left empty (as we are using the repo root).

## 5. Instance type
For backend service, we recommend using a tier higher or equal than "Starter" to ensure reliability. The "Free" tier can still be used, however given the limitation of Render, it will go into inactivity after 15 minutes of idling. Resuming the instance from inactivity takes for a while for the backend service, so this can be bad for user experience. Any paid tier instance is running indefinitelty, which works better. 

## 6. Advanced setting
Click the "Advanced" button to open the advanced settings. You would need to set up the environment variables. This can be the same environment variables you use for the `.env` file.

<img width="277" alt="Screen Shot 2023-09-02 at 14 37 03" src="https://github.com/Shaunwei/RealChar/assets/6148473/dac222db-c6d3-4ffe-8c84-6a8c8f35d544">

You would also need to set an environment variable `PORT` with the port exposed from the Docker image (by default, we use 8000).

If you want to support Firebase authentication and Google Cloud operations (e.g. uploading avatar and character background data), you can optionally upload the secret files in the advanced settings. Note you need to point the secret location envrionment variables to the location of Render's choice: `/etc/secrets/<filename>`.

That's it! After ~10 minutes, you web service should be live, and can be accessed through Render's https endpoint URL. You can verify the home page and API endpoints (e.g. `/characters`) are working.

## 7. Frontend web service
You don't necessarily need to have a frontend web server - you can change the backend Docker setup to run the `web-build` process to generate a static version of the RealChar frontend, which can be served by the backend web service directly. However, for the completeness of features and the reliability, we suggest you deploy a separate frontend service. This is also how we deploy the product RealChar site. 

The process to create Frontend web service on Render is very similar to above. The only changes are

a. Specify the `Dockerfile Path` in advanced settings to `client/web/Dockerfile`.

b. In environment variable, set the `REACT_APP_API_HOST` to the url of the backend service, e.g. `realchar-xxx.onrender.com`. Note `https` prefix should not be added. This tells the frontend where to call the backend web service, since they are separated.

## 8. Frontend instance type
For Frontend web service, a "Free" tier instance is good enough. Of course if you want to have a more reliable/long-running service, you can pick a paid tier. 

## 9. Done!
This is it! You should be able a complete RealChar service via your Render web service.

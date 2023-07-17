This directory includes code samples for deployment on popular cloud services.

Feel free to contribute new samples or make edits! (We would love if you can contribute Vercel integration, for example).

# Currently Supported Platform

## Kubernetes
This applies to Google Kubernets Engine (GKE), AWS Elastic Kubernetes Service (EKS), Azure Kubernetes Service (AKS).

1. Build an image locally and push to a public image registry (Docker Hub, Google Cloud Registry, etc)
2. Replace \<PLACEHOLDER\> fields in the `deployment.yaml` file.
3. Deploy the yaml in the Kubernetes cluster, e.g. 
```kubectl apply -f deployment.yaml```
4. You should be able to see a deployment brought up in the cluster soon! You can check by `kubectl get pod`. There is also a service launched, which can be checked by `kubectl get svc`. Use the `EXTERNAL IP` to access your RealChar deployment, and you are good to go!

Note microphone only works if you have SSL certificate set up.


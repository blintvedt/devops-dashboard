## Dependencies

Requires data in NRDB for the app to be able to pull data using NerdGraph and NRQL.

## Getting started

Make sure you have the NR1 CLI installed and that you've added and selected the appropriate account profile in the CLI.
More information can be found [here](https://developer.newrelic.com/build-apps/set-up-dev-env)

Run the following scripts:

```
nr1 nerdpack:clone -r $repo_url

cd devops-dashboard

nr1 nerdpack:uuid -gf

npm install

nr1 nerdpack:serve
```

Visit [https://one.newrelic.com/?nerdpacks=local](https://one.newrelic.com/?nerdpacks=local) and :sparkles:

## Deploying and Publishing

Open a command prompt in the nerdpack's directory and run the following commands.

```bash
# To create a new uuid for the nerdpack so that you can deploy it to your account:
# nr1 nerdpack:uuid -g [--profile=your_profile_name]

# To see a list of APIkeys / profiles available in your development environment:
# nr1 profiles:list

nr1 nerdpack:publish [--profile=your_profile_name]
nr1 nerdpack:deploy [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
nr1 nerdpack:subscribe [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
```

Visit [https://developer.newrelic.com/build-apps/publish-deploy](https://developer.newrelic.com/build-apps/publish-deploy) for additional information on how to deploy to your environment.

## Support

This application was developed by Kinect Consulting. For more information please contact us at [dpm@kinect-consulting.com](dpm@kinect-consulting.com).

## Dependencies

Requires data in NRDB for the app to be able to pull data using NerdGraph and NRQL.

## Editing Queries

Navigate to the `components/tabs` folder of the project. Each tab in the app has its own component. All chart queries are located in the render method of a tab component and are passed into the charts as props. If the chart output needs to be changed, simply edit that chart's query, save, and redeploy the app. Don't forget to bump the version number in `package.json` as well or the CLI will complain.

Example:

```javascript
/* type Filter {
    name: string, refers to attribute name in NRDB (appName, etc)
    values: any[]
}
addFilterToNRQL(filters: Filter[], nrql: string): string */

<BillboardChart
  fullWidth
  accountId={this.props.accountId}
  query={addFilterToNRQL(
    [
      { name: "teamName", values: this.props.selectedTeams },
      {
        name: "productName",
        values: this.props.selectedProducts,
      },
    ],
    `select round(average(cycle),.009) or 0 as 'Days' 
	 from (SELECT (filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))-filter(earliest(timeOpen), where issueStatusName in ('In Progress','In Development')))/24 as cycle 
	 from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
	 and issueType in ('Story','Task','Enhancement','Bug','Defect') and productName is not null 
	 and teamName is not null facet issueKey, productName, teamName limit max ) since 12 months ago where cycle is not null`
  )}
/>
```

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

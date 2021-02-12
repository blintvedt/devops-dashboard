import React, { Component, Fragment } from "react";
import {
  NrqlQuery,
  TableChart,
  LineChart,
  ChartGroup,
  BillboardChart,
  Spinner,
} from "nr1";
import Widget from "../Widget";
import Grid from "../Grid";
import GridItem from "../GridItem";
import CustomBillboard from "../CustomBillboard";
import Filter, { addFilterToNRQL } from "../Filter";
import { arrayEquals, convertToTimestamp } from "../../util";
import PropTypes from "prop-types";
import HelpModal from "../HelpModal";

class Overview extends Component {
  static propTypes = {
    accountId: PropTypes.number.isRequired,
    products: PropTypes.arrayOf(String).isRequired,
    teams: PropTypes.arrayOf(String).isRequired,
    selectedProducts: PropTypes.arrayOf(String).isRequired,
    selectedTeams: PropTypes.arrayOf(String).isRequired,
    setFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
  };

  state = {
    cycleTimeDataLineChart: [],
    cycleTimeDataTableChart: [],
    cycleTimeDataLoading: true,
    uptimeSeverityData: [],
    uptimeSeverityDataLoading: true,
  };

  pullCycleTimeData = async () => {
    this.setState({ cycleTimeDataLoading: true });
    const ONE_WEEK = 604800000;
    const { accountId } = this.props;

    const metadata = {
      id: "series-1",
      name: "Avg Cycle Time",
      viz: "main",
      color: "green",
      units_data: { x: "TIMESTAMP", y: "UNKNOWN" },
    };

    const query = addFilterToNRQL(
      [
        { name: "teamName", values: this.props.selectedTeams },
        {
          name: "productName",
          values: this.props.selectedProducts,
        },
      ],
      `select round(average(cycle),.009) or 0 as 'Days' 
      from (SELECT (filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))-filter(earliest(timeOpen), where issueStatusName in ('In Progress','In Development')))/24 as cycle,
      filter(earliest(timestamp), where issueStatusName in ('In Prod','Prod Deploy')) as timestamp2
      from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
      and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null 
      and teamName is not null facet issueKey, productName, teamName, weekOf(timestamp2) limit max ) 
      since 12 months ago limit max where cycle is not null facet weekOf(timestamp2) as week`
    );
    try {
      const res = await NrqlQuery.query({
        query,
        accountId,
        formatType: NrqlQuery.FORMAT_TYPE.RAW,
      });
      const cycleTimeData = res.data.raw.facets.map((item) => {
        return {
          x: convertToTimestamp(item.name),
          y: item.results[0].result,
        };
      });
      //must sort so that data is plotted properly
      const sortedCycleTimeData = cycleTimeData.sort((a, b) => {
        if (a.x < b.x) {
          return -1;
        }
        if (a.x > b.x) {
          return 1;
        }
        return 0;
      });
      //use below if filledChartData creates issues
      //const cycleTimeDataLineChart = [{ metadata, data: sortedCycleTimeData }];

      let currentDay = sortedCycleTimeData[0].x;
      let filledChartData = [];
      for (let i = 0; i < 52 - sortedCycleTimeData.length; i++) {
        currentDay = currentDay - ONE_WEEK;
        filledChartData.unshift({ x: currentDay, y: 0 });
      }
      const filledCycleTimeDataLineChart = [
        { metadata, data: [...filledChartData, ...sortedCycleTimeData] },
      ];
      const cycleTimeDataTableChart = [
        {
          metadata: { ...metadata, columns: ["Week", "Avg Cycle Time"] },
          data: res.data.raw.facets.map((item) => {
            return {
              Week: item.name,
              "Avg Cycle Time": item.results[0].result,
            };
          }),
        },
      ];

      this.setState({
        cycleTimeDataLineChart: filledCycleTimeDataLineChart,
        cycleTimeDataTableChart,
        cycleTimeDataLoading: false,
      });
    } catch (e) {
      this.setState({
        cycleTimeDataLoading: false,
        cycleTimeDataLineChart: [],
        cycleTimeDataTableChart: [],
      });
    }
  };

  roundToNDecimalPlaces = (num, decimalPlaces) => {
    return Number(Math.round(num + "e" + decimalPlaces) + "e-" + decimalPlaces);
  };

  pullUptimeSeverityData = async () => {
    this.setState({ uptimeSeverityDataLoading: true });
    const { accountId } = this.props;
    const query = addFilterToNRQL(
      [
        { name: "teamName", values: this.props.selectedTeams },
        {
          name: "productName",
          values: this.props.selectedProducts,
        },
      ],
      `select round(average(Percent),.009) as 'Percent'
       from (select latest(priority) as Priority, (latest(minutesFromFirstOfYear) - earliest(timeFromOpenMinutes) )/latest(minutesFromFirstOfYear) * 100 as 'Percent',
       latest(severity) as sev from JIRAEvent where issueStatusName in ('Resolved') and severity in (1,2) and issue_event_type_name = 'issue_resolved' 
       and displayName != 'Jira Internal' facet productName, teamName, issueKey limit max) where Priority = 'World Problem' 
       facet cases (where sev = 1 as 'Severity 1', where sev = 2 as 'Severity 2') since 12 months ago limit max`
    );
    try {
      const res = await NrqlQuery.query({
        query,
        accountId,
        formatType: NrqlQuery.FORMAT_TYPE.RAW,
      });
      const uptimeSeverityData = res.data.raw.facets.map((item) => {
        return {
          name: item.name,
          value: this.roundToNDecimalPlaces(item.results[0].result, 3),
        };
      });
      this.setState({ uptimeSeverityData, uptimeSeverityDataLoading: false });
    } catch (e) {
      this.setState({ uptimeSeverityDataLoading: false });
    }
  };

  componentDidMount() {
    this.pullUptimeSeverityData();
    this.pullCycleTimeData();
  }

  componentDidUpdate(prevProps, _) {
    const { selectedProducts, selectedTeams } = this.props;
    const {
      selectedProducts: prevSelectedProducts,
      selectedTeams: prevSelectedTeams,
    } = prevProps;
    if (
      arrayEquals(selectedProducts, prevSelectedProducts) &&
      arrayEquals(selectedTeams, prevSelectedTeams)
    )
      return;

    this.pullUptimeSeverityData();
    this.pullCycleTimeData();
  }

  render() {
    return (
      <Fragment>
        <Filter
          title="Filter by Product"
          data={this.props.products}
          setFilter={this.props.setFilter("selectedProducts")}
          selectedFilters={this.props.selectedProducts}
          removeFilter={this.props.removeFilter("selectedProducts")}
        />
        <Filter
          title="Filter by Team"
          data={this.props.teams}
          setFilter={this.props.setFilter("selectedTeams")}
          selectedFilters={this.props.selectedTeams}
          removeFilter={this.props.removeFilter("selectedTeams")}
        />
        <HelpModal />
        <Grid
          gridTemplateColumns="repeat(12, minmax(0, 1fr))"
          gridTemplateRows="repeat(9, 7rem)"
        >
          <GridItem startCol={1} endCol={3} startRow={1} endRow={4}>
            <Widget title="[Cycle Time] : Time spent in Development until Prod Deploy">
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
                   and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null 
                   facet issueKey, productName, teamName limit max ) since 12 months ago where cycle is not null`
                )}
              />
            </Widget>
          </GridItem>
          <ChartGroup>
            <GridItem startCol={3} endCol={7} startRow={1} endRow={4}>
              <Widget
                title="[Cycle Time]: Over Time"
                headerStyle={{ padding: "20px 20px 20px 0px" }}
              >
                {this.state.cycleTimeDataLoading ? (
                  <Spinner style={{ height: "60%" }} />
                ) : (
                  <LineChart
                    accountId={this.props.accountId}
                    style={{ height: "80%" }}
                    fullWidth
                    data={this.state.cycleTimeDataLineChart}
                  />
                )}
              </Widget>
            </GridItem>
            <GridItem startCol={3} endCol={7} startRow={4} endRow={7}>
              <Widget title="[Lead Time]: Over Time">
                <LineChart
                  accountId={this.props.accountId}
                  style={{ height: "80%" }}
                  fullWidth
                  query={addFilterToNRQL(
                    [
                      { name: "teamName", values: this.props.selectedTeams },
                      {
                        name: "productName",
                        values: this.props.selectedProducts,
                      },
                    ],
                    `select round(average(lead),.09) or 0 as 'Avg Lead Time' from (SELECT filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))/24 as lead, filter(earliest(timestamp), where issueStatusName in ('In Prod','Prod Deploy')) as timestamp2 from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null facet issueKey, productName, teamName limit max timeseries) since 12 months ago limit 52 where lead is not null timeseries week`
                  )}
                />
              </Widget>
            </GridItem>
            <GridItem startCol={3} endCol={7} startRow={7} endRow={10}>
              <Widget title="[Deployments]: Over Time">
                <LineChart
                  accountId={this.props.accountId}
                  style={{ height: "80%" }}
                  fullWidth
                  query={addFilterToNRQL(
                    [
                      { name: "teamName", values: this.props.selectedTeams },
                      {
                        name: "productName",
                        values: this.props.selectedProducts,
                      },
                    ],
                    `select (uniqueCount(INDGDeploys)) or 0 as 'Deployments' from ( SELECT filter(latest(comment_body), where issue_event_type_name = 'issue_commented' and comment_body like '%release%production%' and comment_body not like '%internal production%' and issueStatusName in ('In Prod', 'Done', 'Prod Deploy')) as INDGDeploys from JIRAEvent facet productName, teamName, issueKey where issueType in ('Enhancement','Story','Bug','Defect') limit max timeseries week) since 12 months ago timeseries week limit 52 where INDGDeploys is not null`
                  )}
                />
              </Widget>
            </GridItem>
          </ChartGroup>
          <GridItem startCol={7} endCol={10} startRow={1} endRow={4}>
            <Widget title="[Cycle Time]: Weekly">
              {this.state.cycleTimeDataLoading ? (
                <Spinner style={{ height: "60%" }} />
              ) : (
                <TableChart
                  accountId={this.props.accountId}
                  style={{ height: "80%" }}
                  fullWidth
                  data={this.state.cycleTimeDataTableChart}
                />
              )}
            </Widget>
          </GridItem>
          <GridItem startCol={1} endCol={3} startRow={4} endRow={7}>
            <Widget title="[Lead Time]: Time Spent From Issue Creation Until Prod Deploy">
              <BillboardChart
                fullWidth
                style={{ height: "75%" }}
                accountId={this.props.accountId}
                query={addFilterToNRQL(
                  [
                    { name: "teamName", values: this.props.selectedTeams },
                    {
                      name: "productName",
                      values: this.props.selectedProducts,
                    },
                  ],
                  `select round(average(lead),.009) or 0 as 'Days' from (SELECT filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))/24 as lead from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null facet issueKey, productName, teamName limit max) since 12 months ago where lead is not null`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={7} endCol={10} startRow={4} endRow={7}>
            <Widget title="[Lead Time]: Weekly">
              <TableChart
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                fullWidth
                query={addFilterToNRQL(
                  [
                    { name: "teamName", values: this.props.selectedTeams },
                    {
                      name: "productName",
                      values: this.props.selectedProducts,
                    },
                  ],
                  `select round(average(lead),.009) or 0 as 'Avg Lead Time' from (SELECT filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))/24 as lead, filter(earliest(timestamp), where issueStatusName in ('In Prod','Prod Deploy')) as timestamp2 from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null facet issueKey, productName, teamName limit max timeseries) since 12 months ago limit 52 where lead is not null facet weekOf(timestamp) as week`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={1} endCol={3} startRow={7} endRow={10}>
            <Widget title="[Deployments]: Last 12 Months">
              <BillboardChart
                fullWidth
                style={{ height: "75%" }}
                accountId={this.props.accountId}
                query={addFilterToNRQL(
                  [
                    { name: "teamName", values: this.props.selectedTeams },
                    {
                      name: "productName",
                      values: this.props.selectedProducts,
                    },
                  ],
                  `select (uniqueCount(INDGDeploys)) or 0 as 'Deployments' from ( SELECT filter(latest(comment_body), where issue_event_type_name = 'issue_commented' and comment_body like '%release%production%' and comment_body not like '%internal production%' and issueStatusName in ('In Prod', 'Done', 'Prod Deploy')) as INDGDeploys from JIRAEvent facet productName, teamName, issueKey limit max where issueType in ('Enhancement','Story','Bug','Defect') ) since 12 months ago where INDGDeploys is not null`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={7} endCol={10} startRow={7} endRow={10}>
            <Widget title="[Deployments] Weekly">
              <TableChart
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                fullWidth
                query={addFilterToNRQL(
                  [
                    { name: "teamName", values: this.props.selectedTeams },
                    {
                      name: "productName",
                      values: this.props.selectedProducts,
                    },
                  ],
                  `select (uniqueCount(INDGDeploys)) or 0 as 'Deployments' from ( SELECT filter(latest(comment_body), where issue_event_type_name = 'issue_commented' and comment_body like '%release%production%' and comment_body not like '%internal production%' and issueStatusName in ('In Prod', 'Done', 'Prod Deploy')) as INDGDeploys from JIRAEvent facet productName, teamName, issueKey where issueType in ('Enhancement','Story','Bug','Defect') limit max timeseries week) since 12 months ago facet weekOf(timestamp) as week limit 52 where INDGDeploys is not null`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={10} endCol={13} startRow={4} endRow={6}>
            <Widget title="[Uptime] Severity 1 & 2">
              {this.state.uptimeSeverityDataLoading ? (
                <Spinner style={{ height: "60%" }} />
              ) : (
                <CustomBillboard
                  data={this.state.uptimeSeverityData}
                  criticalThreshold={99.9}
                  warningThreshold={99.95}
                />
              )}
            </Widget>
          </GridItem>
          <GridItem startCol={10} endCol={13} startRow={6} endRow={8}>
            <Widget title="[World Problems & MTTR]">
              <BillboardChart
                fullWidth
                style={{ height: "75%" }}
                accountId={this.props.accountId}
                query={addFilterToNRQL(
                  [
                    { name: "teamName", values: this.props.selectedTeams },
                    {
                      name: "productName",
                      values: this.props.selectedProducts,
                    },
                  ],
                  `select uniqueCount(issueKey) as 'World Problems', average(mttr) as 'MTTR in Minutes' from (SELECT filter(earliest(timeFromOpenMinutes), where issueStatusName in ('Resolved')) as mttr, latest(teamName) as 'teamName', latest(productName) as 'productName', latest(priority) as priority from JIRAEvent where timeOpen is not null and issueType='Support Request' and projectKey='SD' facet productName, teamName, issueKey limit max) where priority = 'World Problem' since 12 months ago limit max`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={10} endCol={13} startRow={8} endRow={10}>
            <Widget title="[Change Failed Issues & Change Issue Failure Rate]">
              <BillboardChart
                fullWidth
                style={{ height: "65%" }}
                accountId={this.props.accountId}
                query={addFilterToNRQL(
                  [
                    { name: "teamName", values: this.props.selectedTeams },
                    {
                      name: "productName",
                      values: this.props.selectedProducts,
                    },
                  ],
                  `select latest(FailedIssues) as 'Change Failed Issues', latest(IssueRate) as 'Change Issue %' from (select filter(uniqueCount(issueKey), where comment_body like '%BLAW%release%production%rolled%back%') as 'FailedIssues', (filter(uniqueCount(issueKey), where comment_body like '%BLAW%release%production%rolled%back%')/ uniqueCount(issueKey))*100 as 'IssueRate', latest(teamName) as 'teamName', latest(productName) as 'productName' from JIRAEvent where issueType in ('Story', 'Task') and issueStatus in ('In Development', 'Done')limit max) since 12 months ago limit max`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={10} endCol={13} startRow={1} endRow={4}>
            <Widget>
              <img
                style={{ marginLeft: "15px" }}
                src="https://blog.avarteq.com/wp-content/uploads/2016/06/Lead_and_cycle_time.png"
                width="500"
                height="250"
              />
            </Widget>
          </GridItem>
        </Grid>
      </Fragment>
    );
  }
}

export default Overview;

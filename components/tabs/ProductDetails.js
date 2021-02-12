import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import {
  NrqlQuery,
  TableChart,
  LineChart,
  BillboardChart,
  BarChart,
  Spinner,
} from "nr1";
import Widget from "../Widget";
import Grid from "../Grid";
import GridItem from "../GridItem";
import Filter, { addFilterToNRQL } from "../Filter";
import { arrayEquals, convertToTimestamp } from "../../util";
import HelpModal from "../HelpModal";

export default class ProductDetails extends Component {
  static propTypes = {
    productName: PropTypes.string.isRequired,
    accountId: PropTypes.number,
    teams: PropTypes.arrayOf(String).isRequired,
    selectedTeams: PropTypes.arrayOf(String).isRequired,
    setFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
  };

  state = {
    cycleTimeDataLineChart: [],
    cycleTimeDataTableChart: [],
    cycleTimeDataLoading: true,
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
      [{ name: "teamName", values: this.props.selectedTeams }],
      `select round(average(cycle),.009) or 0 as 'Avg Cycle Time' 
       from (SELECT (filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))-filter(earliest(timeOpen), where issueStatusName in ('In Progress','In Development')))/24 as cycle, 
       filter(earliest(timestamp), where issueStatusName in ('In Prod','Prod Deploy')) as timestamp2 
       from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
       and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null 
       and teamName is not null facet issueKey, productName, teamName limit max ) since 12 months ago limit 52 
       where cycle is not null facet weekOf(timestamp2) as week where productName = '${this.props.productName}'`
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

  componentDidMount() {
    this.pullCycleTimeData();
  }

  componentDidUpdate(prevProps, _) {
    const { selectedTeams } = this.props;
    const { selectedTeams: prevSelectedTeams } = prevProps;
    if (arrayEquals(selectedTeams, prevSelectedTeams)) return;

    this.pullCycleTimeData();
  }

  render() {
    return (
      <Fragment>
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
          gridTemplateRows="21rem 27rem 21rem 27rem 21rem 27rem"
        >
          <GridItem startCol={1} endCol={3} startRow={1} endRow={2}>
            <Widget title={`[Cycle Time] - ${this.props.productName}`}>
              <BillboardChart
                fullWidth
                accountId={this.props.accountId}
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select round(average(cycle),.009) or 0 as 'Days' 
                   from (SELECT (filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))-filter(earliest(timeOpen), where issueStatusName in ('In Progress','In Development')))/24 as cycle 
                   from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
                   and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null 
                   facet issueKey, productName, teamName limit max ) since 12 months ago 
                   where cycle is not null and productName = '${this.props.productName}'`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={3} endCol={6} startRow={1} endRow={2}>
            <Widget
              title={`[Cycle Time] : ${this.props.productName} - Team Breakdown`}
            >
              <BarChart
                fullWidth
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select round(average(cycle),.009) or 0 as 'Days' 
                   from (SELECT (filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))-filter(earliest(timeOpen), where issueStatusName in ('In Progress','In Development')))/24 as cycle 
                   from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
                   and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null 
                   facet issueKey, productName, teamName limit max ) since 12 months ago 
                   limit 20 where cycle is not null and productName = '${this.props.productName}' facet teamName`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={6} endCol={9} startRow={1} endRow={2}>
            <Widget title={`[Cycle Time] : ${this.props.productName} - Weekly`}>
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
          <GridItem startCol={9} endCol={13} startRow={1} endRow={2}>
            <Widget
              title={`[Cycle Time] : ${this.props.productName} - Over Time`}
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
          <GridItem startCol={1} endCol={13} startRow={2} endRow={3}>
            <Widget
              title={`[Cycle Time] : ${this.props.productName} - Issue Keys`}
            >
              <TableChart
                accountId={this.props.accountId}
                style={{ height: "85%" }}
                fullWidth
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select round(average(cycle),.009) or 0 as 'Avg Cycle Time',
                   latest(timestamp2) as 'In Prod Timestamp', latest(summary), latest(url) as 'Issue URL'
                   from (SELECT (filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))-filter(earliest(timeOpen), where issueStatusName in ('In Progress','In Development')))/24 as cycle, 
                   filter(earliest(timestamp), where issueStatusName in ('In Prod','Prod Deploy')) as timestamp2, latest(issueSummary) as summary, latest(issueUrl) as url 
                   from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
                   and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null 
                   facet issueKey, productName, teamName limit max ) since 12 months ago limit 100 
                   where cycle is not null and productName = '${this.props.productName}' facet teamName, issueKey`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={1} endCol={3} startRow={3} endRow={4}>
            <Widget title={`[Lead Time] : ${this.props.productName}`}>
              <BillboardChart
                fullWidth
                accountId={this.props.accountId}
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select round(average(lead),.009) or 0 as 'Days' 
                   from (SELECT filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))/24 as lead 
                   from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
                   and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null 
                   facet issueKey, productName, teamName limit max) since 12 months ago where lead is not null and productName = '${this.props.productName}'`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={3} endCol={6} startRow={3} endRow={4}>
            <Widget
              title={`[Lead Time] : ${this.props.productName} - Team Breakdown`}
            >
              <BarChart
                fullWidth
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select round(average(lead),.009) or 0 as 'Days' 
                   from (SELECT filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))/24 as lead 
                   from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
                   and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null 
                   facet issueKey, productName, teamName limit max) since 12 months ago limit 20 
                   where lead is not null and productName = '${this.props.productName}' facet teamName`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={6} endCol={9} startRow={3} endRow={4}>
            <Widget title={`[Lead Time] : ${this.props.productName} - Weekly`}>
              <TableChart
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                fullWidth
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select round(average(lead),.009) or 0 as 'Avg Lead Time' 
                  from (SELECT filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))/24 as lead, 
                  filter(earliest(timestamp), where issueStatusName in ('In Prod','Prod Deploy')) as timestamp2 from JIRAEvent 
                  where issueStatus in ('In Progress','Done') and timeOpen is not null 
                  and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null 
                  facet issueKey, productName, teamName limit max timeseries week) since 12 months ago limit 52 where lead is not null 
                  facet weekOf(timestamp) as week where productName = '${this.props.productName}'`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={9} endCol={13} startRow={3} endRow={4}>
            <Widget
              title={`[Lead Time] : ${this.props.productName} - Over Time`}
            >
              <LineChart
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                fullWidth
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select round(average(lead),.09) as 'Avg Lead Time' 
                   from (SELECT filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))/24 as lead, 
                   filter(earliest(timestamp), where issueStatusName in ('In Prod','Prod Deploy')) as timestamp2 
                   from JIRAEvent where issueStatus in ('In Progress','Done') and timeOpen is not null 
                   and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null and teamName is not null 
                   facet issueKey, productName, teamName limit max timeseries week) since 12 months ago limit 52 
                   where lead is not null timeseries week where productName = '${this.props.productName}'`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={1} endCol={13} startRow={4} endRow={5}>
            <Widget
              title={`[Lead Time] : ${this.props.productName} - Issue Keys`}
            >
              <TableChart
                accountId={this.props.accountId}
                style={{ height: "85%" }}
                fullWidth
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select round(average(lead),.009) or 0 as 'Avg Lead Time', 
                   latest(timestamp2) as 'In Prod Timestamp', latest(summary), latest(url) as 'Issue URL' 
                   from (SELECT filter(earliest(timeOpen), where issueStatusName in ('In Prod','Prod Deploy'))/24 as lead, 
                   filter(earliest(timestamp), where issueStatusName in ('In Prod','Prod Deploy')) as timestamp2, 
                   latest(issueSummary) as summary, latest(issueUrl) as url from JIRAEvent where issueStatus in ('In Progress','Done') 
                   and timeOpen is not null and issueType in ('Story', 'Task', 'Enhancement','Bug','Defect') and productName is not null 
                   and teamName is not null facet issueKey, productName, teamName limit max) since 12 months ago limit 100 
                   where lead is not null and productName = '${this.props.productName}' facet teamName, issueKey`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={1} endCol={3} startRow={5} endRow={6}>
            <Widget title={`[Deployments] : ${this.props.productName}`}>
              <BillboardChart
                fullWidth
                accountId={this.props.accountId}
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select (uniqueCount(INDGDeploys)) or 0 as 'Deployments' 
                   from ( SELECT filter(latest(comment_body), where issue_event_type_name = 'issue_commented' and comment_body like '%release%production%' 
                   and comment_body not like '%internal production%' and issueStatusName in ('In Prod', 'Done', 'Prod Deploy')) as INDGDeploys 
                   from JIRAEvent facet productName, teamName, issueKey limit max where issueType in ('Enhancement','Story','Bug','Defect') ) 
                   since 12 months ago where productName = '${this.props.productName}'`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={3} endCol={6} startRow={5} endRow={6}>
            <Widget
              title={`[Deployments] : ${this.props.productName} - Team Breakdown`}
            >
              <BarChart
                fullWidth
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select uniqueCount(comment) from (SELECT latest(comment_body) aS comment, latest(updated) as updatedDate 
                   from JIRAEvent where issueType in ('Enhancement','Story','Bug','Defect') and issue_event_type_name = 'issue_commented' 
                   and comment_body like '%release%production%' and comment_body not like '%internal production%' 
                   and issueStatusName in ('In Prod', 'Done', 'Prod Deploy') facet productName, teamName, issueKey limit max) 
                   since 12 months ago limit max facet teamName where productName = '${this.props.productName}'`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={6} endCol={9} startRow={5} endRow={6}>
            <Widget
              title={`[Deployments] : ${this.props.productName} - Weekly`}
            >
              <TableChart
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                fullWidth
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select uniqueCount(comment) from (SELECT latest(comment_body) aS comment, latest(timestamp) as updatedDate 
                   from JIRAEvent where issueType in ('Enhancement','Story','Bug','Defect') and issue_event_type_name = 'issue_commented' 
                   and comment_body like '%release%production%' and comment_body not like '%internal production%' 
                   and issueStatusName in ('In Prod', 'Done', 'Prod Deploy') facet productName, teamName, issueKey limit max timeseries week) 
                   since 12 months ago limit max where productName = '${this.props.productName}' where comment is not null facet weekOf(updatedDate)`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={9} endCol={13} startRow={5} endRow={6}>
            <Widget
              title={`[Deployments] : ${this.props.productName} - Over Time`}
            >
              <LineChart
                accountId={this.props.accountId}
                style={{ height: "80%" }}
                fullWidth
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select (uniqueCount(INDGDeploys)) or 0 as 'Deployments' 
                  from ( SELECT filter(latest(comment_body), where issue_event_type_name = 'issue_commented' and comment_body like '%release%production%' 
                  and comment_body not like '%internal production%' and issueStatusName in ('In Prod', 'Done', 'Prod Deploy')) as INDGDeploys 
                  from JIRAEvent facet productName, teamName, issueKey where issueType in ('Enhancement','Story','Bug','Defect') 
                  limit max timeseries week) since 12 months ago timeseries week limit 52 where INDGDeploys is not null 
                  where productName = '${this.props.productName}'`
                )}
              />
            </Widget>
          </GridItem>
          <GridItem startCol={1} endCol={13} startRow={6} endRow={7}>
            <Widget
              title={`[Deployments] : ${this.props.productName} - Issue Keys`}
            >
              <TableChart
                accountId={this.props.accountId}
                style={{ height: "85%" }}
                fullWidth
                query={addFilterToNRQL(
                  [{ name: "teamName", values: this.props.selectedTeams }],
                  `select latest(INDGDeploys), latest(url)
                   from ( SELECT filter(latest(comment_body), where issue_event_type_name = 'issue_commented' and comment_body like '%release%production%' 
                   and comment_body not like '%internal production%' and issueStatusName in ('In Prod', 'Done', 'Prod Deploy')) as INDGDeploys, 
                   filter(latest(timestamp), where issue_event_type_name = 'issue_commented' and comment_body like '%release%production%' 
                   and comment_body not like '%internal production%' and issueStatusName in ('In Prod', 'Done', 'Prod Deploy')) as timestamp2, 
                   latest(issueUrl) as url from JIRAEvent facet productName, teamName, issueKey limit max 
                   where issueType in ('Enhancement','Story','Bug','Defect') ) since 12 months ago 
                   where productName = '${this.props.productName}' facet teamName, issueKey limit 100 where INDGDeploys is not null`
                )}
              />
            </Widget>
          </GridItem>
        </Grid>
      </Fragment>
    );
  }
}

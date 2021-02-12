import React, { Component } from "react";
import { Tabs, TabsItem, NrqlQuery, nerdlet } from "nr1";
import Overview from "../../components/tabs/Overview";
import { addFilterToNRQL } from "../../components/Filter";
import { arrayEquals } from "../../util";
import ProductDetails from "../../components/tabs/ProductDetails";

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class DevopsDashboard extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      accountId: 29005,
      products: [],
      teams: [],
      selectedProducts: [],
      selectedTeams: [],
    };
    nerdlet.setConfig({
      timePicker: false,
    });
    //removes weird black bar that shows up if you scroll all the way to the bottom
    document.getElementsByClassName("wf-opensans-n4-active")[0].style.height =
      "auto";
  }

  pullInitialData = async () => {
    const { accountId } = this.state;
    const queries = {
      products: `select latest(timestamp) as 'Last Update' from JIRAEvent 
                 where productName is not null facet productName since 1 month ago limit max`,
      teams: addFilterToNRQL(
        [
          {
            name: "productName",
            values: this.state.selectedProducts,
          },
        ],
        `select latest(timestamp) as 'Last Update' from JIRAEvent 
         where teamName is not null and teamName != 'issue.get("Project").getName()' facet teamName since 1 month ago limit max`
      ),
    };
    Object.entries(queries).forEach(async (entry) => {
      const [key, query] = entry;
      try {
        const res = await NrqlQuery.query({
          query,
          accountId,
          formatType: NrqlQuery.FORMAT_TYPE.RAW,
        });
        const data = res.data.raw.facets.map((item) => item.name);
        this.setState({ [key]: data.sort() });
      } catch (e) {
        console.log(e);
      }
    });
  };

  componentDidMount() {
    this.pullInitialData();
  }

  componentDidUpdate(_, prevState) {
    const { selectedProducts, selectedTeams } = this.state;
    const {
      selectedProducts: prevSelectedProducts,
      selectedTeams: prevSelectedTeams,
    } = prevState;
    if (
      arrayEquals(selectedProducts, prevSelectedProducts) &&
      arrayEquals(selectedTeams, prevSelectedTeams)
    )
      return;

    this.pullInitialData();
  }

  setFilter = (key) => (e) => {
    const { [key]: currentFilters } = this.state;
    this.setState({
      [key]: [e.currentTarget.textContent, ...currentFilters],
    });
  };

  removeFilter = (key) => (e) => {
    const { [key]: currentFilters } = this.state;
    this.setState({
      [key]: currentFilters.filter((f) => f !== e.currentTarget.textContent),
    });
  };

  render() {
    return (
      <Tabs defaultValue="tab-1">
        <TabsItem label="Overview" value="tab-1">
          <Overview
            accountId={this.state.accountId}
            products={this.state.products}
            teams={this.state.teams}
            setFilter={this.setFilter}
            removeFilter={this.removeFilter}
            selectedProducts={this.state.selectedProducts}
            selectedTeams={this.state.selectedTeams}
          />
        </TabsItem>
        {this.state.products.map((product, idx) => {
          return (
            <TabsItem label={product} value={idx + 2} key={idx}>
              <ProductDetails
                productName={product}
                accountId={this.state.accountId}
                teams={this.state.teams}
                setFilter={this.setFilter}
                removeFilter={this.removeFilter}
                selectedTeams={this.state.selectedTeams}
              />
            </TabsItem>
          );
        })}
      </Tabs>
    );
  }
}

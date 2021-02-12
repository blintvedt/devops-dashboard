import React, { Component, Fragment } from "react";
import { Dropdown, DropdownItem } from "nr1";
import PropTypes from "prop-types";

export const addFilterToNRQL = (filters, baseNRQL) => {
  let finalQuery = baseNRQL;
  filters.forEach((filter) => {
    finalQuery =
      filter.values.length > 0
        ? finalQuery +
          ` WHERE ${filter.name} in (${filter.values
            .map((f) => `'${f}'`)
            .join(",")}) `
        : finalQuery;
  });
  return finalQuery;
};

export default class Filter extends Component {
  static propTypes = {
    data: PropTypes.arrayOf(Object).isRequired,
    setFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    selectedFilters: PropTypes.arrayOf(String),
  };

  state = { search: "", hovered: null };

  handleSearch = (e) => this.setState({ search: e.target.value });

  renderDropdownItems = () => {
    const { data, setFilter } = this.props;
    const { search } = this.state;
    return search
      ? data
          .filter((item) => item.toLowerCase().includes(search.toLowerCase()))
          .map((item, idx) => (
            <DropdownItem onClick={setFilter} key={idx}>
              {item}
            </DropdownItem>
          ))
      : data.map((item, idx) => (
          <DropdownItem onClick={setFilter} key={idx}>
            {item}
          </DropdownItem>
        ));
  };

  handleMouseEnter = (filter) => {
    return (_) => this.setState({ hovered: filter });
  };

  handleMouseLeave = () => {
    this.setState({ hovered: null });
  };

  renderSelectedFilters = () =>
    this.props.selectedFilters.map((filter, idx) => (
      <span
        key={idx}
        style={{
          opacity: 1,
          width: "auto",
          backgroundColor:
            this.state.hovered === filter
              ? "rgb(91 158 173)"
              : "rgb(201 245 255)",
          borderRadius: "4px",
          marginLeft: "10px",
          padding: "2px",
          cursor: "pointer",
        }}
        onClick={this.props.removeFilter}
        onMouseEnter={this.handleMouseEnter(filter)}
        onMouseLeave={this.handleMouseLeave}
      >
        <span style={{ padding: ".5rem" }}>{filter}</span>
        <span style={{ paddingRight: ".5rem" }}>
          <span style={{ paddingBottom: "2px", fontSize: "8px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 8 8"
              focusable="false"
            >
              <path d="M4 4.707l-2.5 2.5L.793 6.5l2.5-2.5-2.5-2.5L1.5.793l2.5 2.5 2.5-2.5.707.707-2.5 2.5 2.5 2.5-.707.707z"></path>
            </svg>
          </span>
        </span>
      </span>
    ));

  render() {
    return (
      <Fragment>
        <Dropdown
          style={{ padding: "10px 0px 10px 10px" }}
          title={this.props.title}
          iconType={Dropdown.ICON_TYPE.INTERFACE__OPERATIONS__FILTER}
          search={this.state.search}
          onSearch={this.handleSearch}
        >
          {this.renderDropdownItems()}
        </Dropdown>
        <div
          style={{
            display: !this.props.selectedFilters ? "none" : "inline-block",
          }}
        >
          {this.props.selectedFilters && this.renderSelectedFilters()}
        </div>
      </Fragment>
    );
  }
}

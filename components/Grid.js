import React from "react";
import PropTypes from "prop-types";

const Grid = ({ gridTemplateColumns, gridTemplateRows, children }) => {
  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        backgroundColor: "rgb(244, 245, 245)",
        gridTemplateColumns: gridTemplateColumns
          ? gridTemplateColumns
          : "repeat(6, minmax(0, 1fr)",
        gridTemplateRows: gridTemplateRows
          ? gridTemplateRows
          : "repeat(3, minmax(0, 20rem)",
        justifyContent: "space-around",
      }}
    >
      {children}
    </div>
  );
};

Grid.propTypes = {
  gridTemplateColumns: PropTypes.string,
  gridTemplateRows: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
    PropTypes.element,
  ]),
};

export default Grid;

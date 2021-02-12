import React from "react";
import PropTypes from "prop-types";

const GridItem = ({ startCol, endCol, startRow, endRow, children }) => {
  return (
    <div
      style={{
        margin: "3px",
        gridColumn: `${startCol} / ${endCol}`,
        gridRow: `${startRow} / ${endRow}`,
      }}
    >
      {children}
    </div>
  );
};

GridItem.propTypes = {
  startCol: PropTypes.number.isRequired,
  endCol: PropTypes.number.isRequired,
  startRow: PropTypes.number.isRequired,
  endRow: PropTypes.number.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
    PropTypes.element,
  ]),
};

export default GridItem;

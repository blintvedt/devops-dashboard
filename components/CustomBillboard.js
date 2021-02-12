import React from "react";
import PropTypes from "prop-types";

const CustomBillboard = ({ data, criticalThreshold, warningThreshold }) => {
  return data.length === 0 ? (
    <span
      style={{
        display: "inline-block",
        fontSize: "3em",
      }}
    >
      {" "}
      No Value{" "}
    </span>
  ) : (
    <div>
      {data.map((item, idx) => {
        return (
          <div key={idx} style={{ paddingTop: "6px", paddingBottom: "6px" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "3em",
                color:
                  item.value < criticalThreshold
                    ? "#bd071f"
                    : item.value < warningThreshold
                    ? "#fdc238"
                    : "white",
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                display: "block",
                color: "#8e9494",
                fontSize: "1.2em",
              }}
            >
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

CustomBillboard.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
  criticalThreshold: PropTypes.number.isRequired,
  warningThreshold: PropTypes.number.isRequired,
};

export default CustomBillboard;

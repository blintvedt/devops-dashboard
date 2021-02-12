import { Card } from "nr1";
import { PropTypes } from "prop-types";

const Widget = ({ title, cardStyle, headerStyle, children }) => {
  return (
    <Card
      style={
        cardStyle
          ? cardStyle
          : { height: "100%", paddingLeft: "15px", paddingRight: "15px" }
      }
    >
      <header
        style={headerStyle ? headerStyle : { padding: "15px 15px 15px 0px" }}
      >
        <h4
          style={{
            color: "#2a3434",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: ".25px",
          }}
        >
          {title}
        </h4>
      </header>
      {children}
    </Card>
  );
};

Widget.propTypes = {
  title: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
    PropTypes.element,
  ]).isRequired,
  cardStyle: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  headerStyle: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
};

export default Widget;

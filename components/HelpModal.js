import React, { Component, Fragment } from "react";
import { Button, Modal, HeadingText, BlockText } from "nr1";

class HelpModal extends Component {
  state = {
    hidden: true,
    mounted: false,
  };

  handleClick = () => {
    this.setState({
      hidden: false,
      mounted: true,
    });
  };
  handleClose = () => {
    this.setState({ hidden: true });
  };
  handleHideEnd = () => {
    this.setState({ mounted: false });
  };
  render() {
    return (
      <Fragment>
        <Button
          onClick={this.handleClick}
          style={{ marginTop: "10px" }}
          sizeType={Button.SIZE_TYPE.SMALL}
          spacingType={[
            Button.SPACING_TYPE.OMIT,
            Button.SPACING_TYPE.OMIT,
            Button.SPACING_TYPE.OMIT,
            Button.SPACING_TYPE.LARGE,
          ]}
        >
          Help
        </Button>
        {this.state.mounted && (
          <Modal
            hidden={this.state.hidden}
            onClose={this.handleClose}
            onHideEnd={this.handleHideEnd}
          >
            <HeadingText type={HeadingText.TYPE.HEADING_1}>Help</HeadingText>
            <BlockText
              type={BlockText.TYPE.PARAGRAPH}
              style={{ padding: "10px 0px 15px 0px" }}
            >
              Use Product and Team dropdowns to filter the data. For Team and
              Issue Keys breakdown, select a Product tab.
            </BlockText>
            <hr />
            <BlockText
              type={BlockText.TYPE.PARAGRAPH}
              style={{ paddingBottom: "20px", paddingTop: "20px" }}
            >
              <ul style={{ padding: "15px 0px 15px 2rem" }}>
                <li>
                  <b>[Cycle Time]</b> : Time spent Developing until Prod Deploy
                </li>
                <li>
                  <b>[Lead Time]</b> : Time spent since Issue Creation until
                  Done
                </li>
                <li>
                  <b>[MTTR]</b> : Time spent to resolve World Problems
                </li>
              </ul>
            </BlockText>
            <hr />

            <HeadingText
              style={{ paddingTop: "20px" }}
              type={HeadingText.TYPE.HEADING_4}
            >
              Additional Info
            </HeadingText>
            <BlockText
              type={BlockText.TYPE.PARAGRAPH}
              style={{ padding: "15px 0px 15px 0px" }}
            >
              All Products Dashboard -{" "}
              <a target="_blank" href="https://one.nr/0X8woa57Wjx">
                link
              </a>
            </BlockText>
            <BlockText
              type={BlockText.TYPE.PARAGRAPH}
              style={{ paddingBottom: "10px" }}
            >
              For more information, contact:
              <ul style={{ padding: "15px 0px 15px 1.75rem" }}>
                <li>Michelle Lee {"<mlee2@bloombergindustry.com>"}</li>
                <li>Brian Lintvedt {"<blintvedt@bloombergindustry.com>"}</li>
              </ul>
            </BlockText>

            <hr />
            <BlockText
              type={BlockText.TYPE.PARAGRAPH}
              style={{ padding: "15px 0px 15px 0px" }}
            >
              Consideration:{" "}
              <i>
                World Problems tracking in New Relic started on September 2020
              </i>
            </BlockText>
            <Button onClick={this.handleClose}>Close</Button>
          </Modal>
        )}
      </Fragment>
    );
  }
}

export default HelpModal;

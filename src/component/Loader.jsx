import React from "react";
import {
  Dimmer,
  Loader as SemanticLoader,
  Image,
  Segment,
} from "semantic-ui-react";

export default function Loader() {
  return (
    <Segment>
      <Dimmer active>
        <SemanticLoader />
      </Dimmer>

      <Image src="https://react.semantic-ui.com/images/wireframe/short-paragraph.png" />
    </Segment>
  );
}

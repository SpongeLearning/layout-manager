import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { RootState } from "../reducer";
import { selectById } from "../reducer/nodes";

const Panel = (props: { nodeId: string }) => {
    const { nodeId } = props;
    const nodes = useSelector((state: RootState) => state.nodes);
    const node = useMemo(() => selectById(nodes, nodeId), [nodeId, nodes]);
    return (
        <div style={{ height: "100%", width: "100%", overflow: "hidden" }}>
            {node?.Page ? <node.Page /> : null}
        </div>
    );
};

export default Panel;

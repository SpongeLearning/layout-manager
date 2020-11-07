import interact from "interactjs";
import React, {
    Fragment,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from "react";

import { remove, selectById, updateOne } from "../reducer/nodes";
import CustomTab from "./CustomTab";
import { context } from "./Provider";

const Tab = (props: {
    nodeId: string;
    selected: string;
    onSelect: (nodeId: string) => void;
}) => {
    const { nodeId, selected, onSelect } = props;
    const ref = useRef(null);

    const [nodes, dispatch] = useContext(context)!;
    const node = useMemo(() => selectById(nodes, nodeId), [nodeId, nodes]);

    const onClick = useCallback(() => {
        onSelect(nodeId);
    }, [nodeId, onSelect]);

    useEffect(() => {
        interact(ref.current!).draggable({
            cursorChecker: () => {
                return "default";
            },
        });
    }, [onClick]);

    useEffect(() => {
        if (nodeId === selected) {
            dispatch(updateOne({ id: nodeId, changes: { selected: true } }));
        } else {
            dispatch(updateOne({ id: nodeId, changes: { selected: false } }));
        }
    }, [dispatch, nodeId, selected]);

    const closeTab = useCallback(() => {
        console.log("test test ");
        dispatch(
            remove({
                nodeId,
            })
        );
    }, [dispatch, nodeId]);

    return (
        <Fragment>
            {node?.Tab ? (
                <node.Tab
                    nodeId={nodeId}
                    nodeTitle={nodeId}
                    ref={ref}
                    onSelect={onClick}
                    onClose={closeTab}
                />
            ) : (
                <CustomTab
                    nodeId={nodeId}
                    nodeTitle={nodeId}
                    ref={ref}
                    onSelect={onClick}
                    onClose={closeTab}
                />
            )}
        </Fragment>
    );
};

export default Tab;
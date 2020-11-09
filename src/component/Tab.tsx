import interact from "interactjs";
import React, {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import { removeNode, shakeTree } from "../lib";
import { RootState } from "../reducer";
import { selectAll, selectById, updateOne, upsertMany } from "../reducer/nodes";
import CustomTab from "./CustomTab";

const Tab = (props: {
    nodeId: string;
    selected: string;
    onSelect: (nodeId: string) => void;
}) => {
    const { nodeId, selected, onSelect } = props;
    const ref = useRef(null);

    const nodes = useSelector((state: RootState) => state.nodes);
    const dispatch = useDispatch();
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
        let nextState = removeNode(nodes, nodeId);
        nextState = shakeTree(nextState, "root");
        dispatch(upsertMany(selectAll(nextState)));
    }, [dispatch, nodeId, nodes]);

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

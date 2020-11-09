import interact from "interactjs";
import React, { CSSProperties, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { moveNode, shakeTree } from "../lib";
import useStateContainer from "../lib/useStateContainer";
import { RootState } from "../reducer";
import {
    DIRECTION,
    selectAll,
    selectById,
    updateOne,
    upsertMany,
} from "../reducer/nodes";
import Panel from "./Panel";
import Titlebar from "./Titlebar";

export enum MASK_PART {
    TOP = "top",
    LEFT = "left",
    BOTTOM = "bottom",
    RIGHT = "right",
    CENTER = "center",
}

const top: CSSProperties = {
    zIndex: 1,
    pointerEvents: "none",
    border: "2px dashed",
    position: "absolute",
    width: "calc(100% - 4px)",
    height: "50%",
    top: 0,
    left: 0,
};
const left: CSSProperties = {
    zIndex: 1,
    pointerEvents: "none",
    border: "2px dashed",
    position: "absolute",
    width: "50%",
    height: "calc(100% - 4px)",
    top: 0,
    left: 0,
};
const bottom: CSSProperties = {
    zIndex: 1,
    pointerEvents: "none",
    border: "2px dashed",
    position: "absolute",
    width: "calc(100% - 4px)",
    height: "50%",
    right: 0,
    bottom: 0,
};
const right: CSSProperties = {
    zIndex: 1,
    pointerEvents: "none",
    border: "2px dashed",
    position: "absolute",
    width: "50%",
    height: "calc(100% - 4px)",
    bottom: 0,
    right: 0,
};
const center: CSSProperties = {
    zIndex: 1,
    pointerEvents: "none",
    border: "2px dashed",
    position: "absolute",
    width: "calc(100% - 4px)",
    height: "calc(100% - 4px)",
    bottom: 0,
    right: 0,
};
const hide: CSSProperties = {
    display: "none",
};

const Widget = (props: { nodeId: string }) => {
    const { nodeId } = props;
    const ref = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);
    const [
        maskPartContainer,
        maskPart,
        setMaskPart,
    ] = useStateContainer<MASK_PART | null>(null);

    const nodes = useSelector((state: RootState) => state.nodes);
    const dispatch = useDispatch();

    const node = useMemo(() => selectById(nodes, nodeId), [nodeId, nodes]);
    const selectedNodeId = useMemo(() => {
        return node?.children
            ?.map((childId) => selectById(nodes, childId))
            .find((child) => child?.selected === true)?.id;
    }, [node, nodes]);

    const parent = useMemo(() => {
        if (node?.parentId) {
            return selectById(nodes, node?.parentId);
        }
    }, [node?.parentId, nodes]);

    const widgetStyle = useMemo(() => {
        const parentDirection = parent?.direction;
        const length = parent?.children?.length;
        const offset = node?.offset;
        const size = length || 1;
        const splitterOffset = (10 * (size - 1)) / size;
        const width =
            length != null &&
            (parentDirection === DIRECTION.ROW ||
                parentDirection === DIRECTION.ROWREV)
                ? `calc(${100 / length}% - ${splitterOffset}px + ${
                      offset || 0
                  }px)`
                : "100%";

        const height =
            length != null &&
            (parentDirection === DIRECTION.COLUMN ||
                parentDirection === DIRECTION.COLUMNREV)
                ? `calc(${100 / length}% - ${splitterOffset}px + ${
                      offset || 0
                  }px)`
                : "100%";

        return {
            width,
            height,
        };
    }, [node, parent]);
    const maskPartStyle = useMemo(() => {
        switch (maskPart) {
            case MASK_PART.BOTTOM:
                return bottom;
            case MASK_PART.CENTER:
                return center;
            case MASK_PART.LEFT:
                return left;
            case MASK_PART.RIGHT:
                return right;
            case MASK_PART.TOP:
                return top;
            default:
                return hide;
        }
    }, [maskPart]);

    useEffect(() => {
        const interactable = interact(widgetRef.current!)
            .dropzone({
                accept: ".Tab",
            })
            .on("drop", (event) => {
                setMaskPart(null);
                let nextState = moveNode(
                    nodes,
                    nodeId,
                    event.dragEvent.target.id,
                    maskPartContainer.current
                );
                nextState = shakeTree(nextState, "root");
                dispatch(upsertMany(selectAll(nextState)));
            })
            .on("dropmove", (event) => {
                const rect = widgetRef.current?.getBoundingClientRect();
                if (rect) {
                    if (
                        event.dragEvent.client.x > rect.x + rect.width / 4 &&
                        event.dragEvent.client.x <
                            rect.x + (rect.width / 4) * 3 &&
                        event.dragEvent.client.y > rect.y + rect.height / 4 &&
                        event.dragEvent.client.y <
                            rect.y + (rect.height / 4) * 3
                    ) {
                        setMaskPart(MASK_PART.CENTER);
                        return;
                    }
                    if (
                        event.dragEvent.client.x > rect.x &&
                        event.dragEvent.client.x < rect.x + rect.width / 4
                    ) {
                        setMaskPart(MASK_PART.LEFT);
                        return;
                    }

                    if (
                        event.dragEvent.client.x >
                            rect.x + (rect.width / 4) * 3 &&
                        event.dragEvent.client.x < rect.x + rect.width
                    ) {
                        setMaskPart(MASK_PART.RIGHT);
                        return;
                    }

                    if (
                        event.dragEvent.client.y > rect.y &&
                        event.dragEvent.client.y < rect.y + rect.height / 4
                    ) {
                        setMaskPart(MASK_PART.TOP);
                        return;
                    }

                    if (
                        event.dragEvent.client.y >
                            rect.y + (rect.height / 4) * 3 &&
                        event.dragEvent.client.y < rect.y + rect.height
                    ) {
                        setMaskPart(MASK_PART.BOTTOM);
                        return;
                    }
                }
            })
            .on("dragleave", () => {
                setMaskPart(null);
            });
        return () => {
            interactable.unset();
        };
    }, [dispatch, maskPartContainer, node, nodeId, nodes, setMaskPart]);

    useEffect(() => {
        if (
            node?.width !== ref.current?.getBoundingClientRect().width ||
            node?.height !== ref.current?.getBoundingClientRect().height
        ) {
            dispatch(
                updateOne({
                    id: nodeId,
                    changes: {
                        width: ref.current?.getBoundingClientRect().width,
                        height: ref.current?.getBoundingClientRect().height,
                    },
                })
            );
        }
    });

    return (
        <div ref={ref} id={nodeId} style={widgetStyle}>
            {node?.children ? <Titlebar nodeIds={node?.children} /> : null}
            <div
                ref={widgetRef}
                style={{ position: "relative", height: "calc(100% - 25px)" }}
            >
                <div style={maskPartStyle} />
                {selectedNodeId ? <Panel nodeId={selectedNodeId} /> : null}
            </div>
        </div>
    );
};

export default Widget;

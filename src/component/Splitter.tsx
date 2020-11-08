import interact from "interactjs";
import lodash from "lodash";
import React, {
    CSSProperties,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../reducer";
import { DIRECTION, selectById, updateMany } from "../reducer/nodes";

const Splitter = (props: {
    parentId: string;
    primaryId: string;
    secondaryId: string;
}) => {
    const { parentId, primaryId, secondaryId } = props;
    const nodes = useSelector((state: RootState) => state.nodes);
    const dispatch = useDispatch();

    const [movingOffset, setMovingOffset] = useState(0);
    const [dragging, setDragging] = useState(false);

    const ref = useRef<HTMLDivElement>(null);
    const shadowRef = useRef<HTMLDivElement>(null);

    const parent = useMemo(() => selectById(nodes, parentId), [
        nodes,
        parentId,
    ]);

    const primary = useMemo(() => selectById(nodes, primaryId), [
        nodes,
        primaryId,
    ]);

    const secondary = useMemo(() => selectById(nodes, secondaryId), [
        nodes,
        secondaryId,
    ]);

    const primaryOffsetRef = useRef(0);

    const secondaryOffsetRef = useRef(0);

    useEffect(() => {
        if (primary?.offset != null) {
            primaryOffsetRef.current = primary?.offset;
        }
    }, [primary?.offset]);

    useEffect(() => {
        if (secondary?.offset != null) {
            secondaryOffsetRef.current = secondary?.offset;
        }
    }, [secondary?.offset]);

    const splitterStyle = useMemo(() => {
        const parentDirection = parent?.direction;
        const hoverBackgroundColor = "#00000085";
        return {
            width:
                parentDirection === DIRECTION.ROW ||
                parentDirection === DIRECTION.ROWREV
                    ? 10
                    : "100%",
            height:
                parentDirection === DIRECTION.ROW ||
                parentDirection === DIRECTION.ROWREV
                    ? "100%"
                    : 10,
            backgroundColor: dragging ? hoverBackgroundColor : "#00000065",
            touchAction: "none",
        };
    }, [dragging, parent]);

    const shadowStyle = useMemo(() => {
        const parentDirection = parent?.direction;

        let x =
            parentDirection === DIRECTION.ROW ||
            parentDirection === DIRECTION.ROWREV
                ? movingOffset
                : 0;
        let y =
            parentDirection === DIRECTION.ROW ||
            parentDirection === DIRECTION.ROWREV
                ? 0
                : movingOffset;
        const transform = `translate(${x}px, ${y}px)`;
        return {
            display: dragging ? undefined : "none",
            position: "relative",
            zIndex: 1,
            transform,
            width: "100%",
            height: "100%",
            backgroundColor: "#00000065",
        } as CSSProperties;
    }, [dragging, movingOffset, parent]);

    useEffect(() => {
        let offset = 0;
        const interactable = interact(ref.current!).draggable({
            onstart: () => {
                setDragging(true);
            },
            onmove: lodash.throttle((event) => {
                offset =
                    parent?.direction === DIRECTION.ROW ||
                    parent?.direction === DIRECTION.ROWREV
                        ? event.client.x - event.clientX0
                        : event.client.y - event.clientY0;
                if (
                    ref.current != null &&
                    shadowRef.current != null &&
                    primary?.width != null &&
                    primary.height != null &&
                    secondary?.width != null &&
                    secondary?.height != null
                ) {
                    let velocity = 0;
                    let primaryValue = 0;
                    let secondaryValue = 0;
                    if (
                        parent?.direction === DIRECTION.ROW ||
                        parent?.direction === DIRECTION.ROWREV
                    ) {
                        primaryValue = primary.width;
                        secondaryValue = secondary.width;
                        velocity = event.velocityX;
                    } else {
                        primaryValue = primary.height;
                        secondaryValue = secondary.height;
                        velocity = event.velocityY;
                    }

                    if (velocity >= 0 && secondaryValue - offset < 100) {
                        offset = secondaryValue - 100;
                    }

                    if (velocity <= 0 && primaryValue + offset < 100) {
                        offset = -(primaryValue - 100);
                    }

                    if (velocity >= 0 && primaryValue + offset < 100) {
                        offset = -(primaryValue - 100);
                    }

                    if (velocity <= 0 && secondaryValue - offset < 100) {
                        offset = secondaryValue - 100;
                    }
                    setMovingOffset(offset);
                }
            }, 16),
            onend: () => {
                setDragging(false);
                setMovingOffset(0);
                dispatch(
                    updateMany([
                        {
                            id: primaryId,
                            changes: {
                                offset: primaryOffsetRef.current + offset,
                            },
                        },
                        {
                            id: secondaryId,
                            changes: {
                                offset: secondaryOffsetRef.current - offset,
                            },
                        },
                    ])
                );
            },
            cursorChecker: () => {
                return parent?.direction === DIRECTION.ROW ||
                    parent?.direction === DIRECTION.ROWREV
                    ? "ew-resize"
                    : "ns-resize";
            },
            lockAxis:
                parent?.direction === DIRECTION.ROW ||
                parent?.direction === DIRECTION.ROWREV
                    ? "x"
                    : "y",
        });
        return () => {
            interactable.unset();
        };
    }, [primary, parent, secondary, dispatch, primaryId, secondaryId]);

    return (
        <div ref={ref} style={splitterStyle}>
            <div ref={shadowRef} style={shadowStyle}></div>
        </div>
    );
};

export default Splitter;

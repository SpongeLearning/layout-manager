import { combineReducers } from "@reduxjs/toolkit";

import nodes from "./nodes";

const rootReducer = combineReducers({
    nodes,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;

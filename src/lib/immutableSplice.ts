const immutableSplice = <T>(array: T[], index: number, insert: T[] | T) => {
    return array.slice(0, index).concat(insert).concat(array.slice(index));
};

export default immutableSplice;

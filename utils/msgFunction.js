const msgFunction = (errorBit, msg, data) => {
    if (!errorBit) return { success: errorBit, message: msg };
    else return { success: errorBit, message: msg, data };
};

module.exports = { msgFunction };
function makeLogger(serviceName) {
  return {
    info(message, meta) {
      console.log(`[${serviceName}] ${message}`, meta || "");
    },
    warn(message, meta) {
      console.warn(`[${serviceName}] ${message}`, meta || "");
    },
    error(message, meta) {
      console.error(`[${serviceName}] ${message}`, meta || "");
    }
  };
}

module.exports = { makeLogger };

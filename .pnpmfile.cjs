module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === "drizzle-orm") {
        const mysqlVersion = pkg.peerDependencies?.mysql2;
        const mysqlMeta = pkg.peerDependenciesMeta?.mysql2;
        pkg.peerDependencies = mysqlVersion ? { mysql2: mysqlVersion } : {};
        pkg.peerDependenciesMeta = mysqlMeta ? { mysql2: mysqlMeta } : {};
      }
      return pkg;
    },
  },
};

const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/webflow-components/JobsPage/JobsPage.webflow.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "webflow-bundle.js",
    library: {
      type: "umd",
      name: "JobsPage",
    },
    globalObject: "this",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/devlink": path.resolve(__dirname, "devlink"),
      "@/devlink/*": path.resolve(__dirname, "devlink/*"),
      // Add specific aliases for the _Builtin components to handle missing extensions
      "./Basic": path.resolve(__dirname, "devlink/_Builtin/Basic.jsx"),
      "./Tabs": path.resolve(__dirname, "devlink/_Builtin/Tabs.jsx"),
      "./Dropdown": path.resolve(__dirname, "devlink/_Builtin/Dropdown.jsx"),
      "./Navbar": path.resolve(__dirname, "devlink/_Builtin/Navbar.jsx"),
      "./Facebook": path.resolve(__dirname, "devlink/_Builtin/Facebook.jsx"),
      "./Typography": path.resolve(
        __dirname,
        "devlink/_Builtin/Typography.jsx"
      ),
      "./Twitter": path.resolve(__dirname, "devlink/_Builtin/Twitter.jsx"),
      "./Form": path.resolve(__dirname, "devlink/_Builtin/Form.jsx"),
      "./Map": path.resolve(__dirname, "devlink/_Builtin/Map.jsx"),
      "./Slider": path.resolve(__dirname, "devlink/_Builtin/Slider.jsx"),
      "./Video": path.resolve(__dirname, "devlink/_Builtin/Video.jsx"),
      "./YouTubeVideo": path.resolve(
        __dirname,
        "devlink/_Builtin/YouTubeVideo.jsx"
      ),
      "./BackgroundVideo": path.resolve(
        __dirname,
        "devlink/_Builtin/BackgroundVideo.jsx"
      ),
    },
    fullySpecified: false,
  },
  module: {
    // Override the existing rules to modify CSS processing
    rules: (currentRules) => {
      const updatedRules = currentRules.map((rule) => {
        // Find the rule that handles CSS files
        if (
          rule.test instanceof RegExp &&
          rule.test.test("test.css") &&
          Array.isArray(rule.use)
        ) {
          for (const [index, loader] of rule.use.entries()) {
            // Find the css-loader
            if (typeof loader === "object" && loader?.ident === "css-loader") {
              // Preserve existing options and add a custom configuration
              const options =
                typeof loader.options === "object" ? loader.options : {};
              rule.use[index] = {
                ...loader,
                options: {
                  ...options,
                  modules: {
                    exportLocalsConvention: "as-is", // Use original class names
                    namedExport: false, // ⚠️ Allow dot notation access
                  },
                },
              };
            }
          }
        }
        return rule;
      });

      // Add a rule to handle devlink JSX files with ES module imports
      updatedRules.push({
        test: /\.jsx$/,
        include: path.resolve(__dirname, "devlink"),
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: [
              "@babel/plugin-transform-class-properties",
              [
                "@babel/plugin-transform-runtime",
                {
                  regenerator: true,
                  helpers: true,
                  useESModules: false,
                },
              ],
            ],
          },
        },
      });

      return updatedRules;
    },
  },
  externals: {
    react: {
      commonjs: "react",
      commonjs2: "react",
      amd: "react",
      root: "React",
    },
    "react-dom": {
      commonjs: "react-dom",
      commonjs2: "react-dom",
      amd: "react-dom",
      root: "ReactDOM",
    },
  },
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false,
  },
  devtool: false,
};

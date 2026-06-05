import { globalIgnores } from "eslint/config";
import { config } from "@repo/eslint-config/react-app";

export default [...config, globalIgnores([".dist/**"])];

import next from "eslint-config-next";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "design/**", "next-env.d.ts"],
  },
  ...next,
];

export default config;

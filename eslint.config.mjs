import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/app/api/**",
      "src/app/dashboard/**",
      "src/app/forgot-password/**",
      "src/app/reset-password/**",
      "src/app/verify-email/**",
      "src/app/login/**",
      "src/app/signup/**",
      "src/app/invite/**",
      "src/components/**",
      "src/lib/email.ts",
      "src/types/auth.ts",
      "src/utils/supabase/middleware.ts",
      "src/app/api/auth/session/route.ts"
    ],
  },
];

export default eslintConfig;

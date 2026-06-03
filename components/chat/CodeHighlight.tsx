"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  Highlight,
  type Language,
  type PrismTheme,
  themes,
} from "prism-react-renderer";
import { cn } from "@/lib/utils";

function withTransparentBackground(theme: PrismTheme): PrismTheme {
  return {
    ...theme,
    plain: { ...theme.plain, backgroundColor: "transparent" },
  };
}

export function useCodeHighlightTheme(): PrismTheme {
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    const base = resolvedTheme === "dark" ? themes.vsDark : themes.github;
    return withTransparentBackground(base);
  }, [resolvedTheme]);
}

interface CodeHighlightProps {
  code: string;
  language: Language;
  className?: string;
}

export function CodeHighlight({
  code,
  language,
  className,
}: CodeHighlightProps) {
  const theme = useCodeHighlightTheme();

  return (
    <Highlight theme={theme} code={code} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <div className={cn("overflow-x-auto", className)}>
          {tokens.map((line, lineIndex) => {
            const lineProps = getLineProps({ line, key: lineIndex });
            const {
              key: lineKey,
              className: lineClassName,
              ...restLineProps
            } = lineProps as {
              key?: React.Key;
              className?: string;
            };

            return (
              <div
                key={lineKey ?? lineIndex}
                {...restLineProps}
                className={cn(lineClassName, "whitespace-pre")}
              >
                {line.map((token, tokenIndex) => {
                  const tokenProps = getTokenProps({ token, key: tokenIndex });
                  const { key: tokenKey, ...restTokenProps } = tokenProps as {
                    key?: React.Key;
                  };
                  return (
                    <span key={tokenKey ?? tokenIndex} {...restTokenProps} />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </Highlight>
  );
}

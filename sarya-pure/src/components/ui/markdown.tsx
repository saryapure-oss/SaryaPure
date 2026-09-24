import ReactMarkdown from "react-markdown";

/** Safe markdown: raw HTML is NOT rendered (react-markdown default), links are sanitised. */
export function Markdown({ children, className = "prose-sarya" }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        skipHtml
        urlTransform={(url) => (/^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : "")}
        components={{
          a: ({ href, children }) => (
            <a href={href} {...(href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {children}
            </a>
          ),
          h1: ({ children }) => <h2>{children}</h2>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

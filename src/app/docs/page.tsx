import { Metadata } from "next";
import { services, buildToc } from "@/lib/docs-data";
import { DocSidebar } from "@/components/docs/DocSidebar";
import { DocSection, DocSubSection } from "@/components/docs/DocSection";
import { EndpointCard } from "@/components/docs/EndpointCard";
import { WsProtocolCard } from "@/components/docs/WsProtocolCard";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "Complete REST API and WebSocket protocol documentation for Nostr Archives — endpoints, parameters, and examples.",
};

export default function DocsPage() {
  const toc = buildToc();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="mt-1 text-sm text-white/40">
          REST API, WebSocket feeds, and Nostr relay protocols for building on
          Nostr Archives.
        </p>
      </div>

      {/* Mobile TOC */}
      <div className="lg:hidden">
        <DocSidebar toc={toc} />
      </div>

      {/* Frame layout: fixed sidebar + scrollable content */}
      <div className="hidden lg:flex lg:h-[calc(100vh-10rem)] lg:gap-10">
        {/* Sidebar — fixed, scrolls independently */}
        <div className="w-64 shrink-0 overflow-y-auto pr-2">
          <DocSidebar toc={toc} />
        </div>

        {/* Content — scrolls independently */}
        <div className="min-w-0 flex-1 overflow-y-auto pr-2" id="docs-scroll-container">
          <div className="space-y-16 pb-16">
            <DocsContent />
          </div>
        </div>
      </div>

      {/* Mobile: normal flow */}
      <div className="lg:hidden space-y-16">
        <DocsContent />
      </div>
    </div>
  );
}

function DocsContent() {
  return (
    <>
      {/* Overview */}
      <div className="rounded-2xl border border-white/[0.06] bg-card/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold">Base URLs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-widest text-white/30">
                <th className="pb-2 pr-4 font-medium">Service</th>
                <th className="pb-2 pr-4 font-medium">URL</th>
                <th className="pb-2 font-medium">Protocol</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                ["REST API", "https://api.nostrarchives.com", "HTTP JSON", "neon-blue"],
                ["Live Metrics", "wss://api.nostrarchives.com", "WebSocket", "neon-purple"],
                ["Search Relay", "wss://search.nostrarchives.com", "Nostr NIP-50", "neon-purple"],
                ["Feed Relay", "wss://feeds.nostrarchives.com", "Nostr NIP-01", "neon-purple"],
                ["Scheduler Relay", "wss://scheduler.nostrarchives.com", "Nostr NIP-42", "neon-purple"],
                ["Indexer Relay", "wss://indexer.nostrarchives.com", "Nostr NIP-01", "neon-purple"],
              ].map(([name, url, proto, color], i) => (
                <tr key={i} className="border-b border-white/[0.03] last:border-0">
                  <td className="py-2 pr-4 text-white/60">{name}</td>
                  <td className={`py-2 pr-4 font-mono text-xs text-${color}`}>{url}</td>
                  <td className="py-2 text-white/40">{proto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render each service */}
      {services.map((service) => (
        <DocSection
          key={service.id}
          id={service.id}
          title={service.title}
          description={`${service.baseUrl}${service.rateLimit ? ` \u2014 Rate limit: ${service.rateLimit}` : ""}`}
        >
          <p className="text-sm text-white/50">{service.description}</p>

          {service.categories?.map((category) => (
            <DocSubSection
              key={category.id}
              id={category.id}
              title={category.title}
              description={category.description}
            >
              {category.endpoints.map((endpoint) => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </DocSubSection>
          ))}

          {service.wsEndpoints && service.wsEndpoints.length > 0 && (
            <div
              id={service.id === "rest-api" ? "rest-websockets" : undefined}
              className={service.id === "rest-api" ? "scroll-mt-24" : undefined}
            >
              {service.id === "rest-api" && (
                <h3 className="mb-3 text-sm font-semibold text-white/70">
                  Live WebSockets
                </h3>
              )}
              <div className="space-y-4">
                {service.wsEndpoints.map((ws) => (
                  <WsProtocolCard key={ws.id} endpoint={ws} />
                ))}
              </div>
            </div>
          )}
        </DocSection>
      ))}
    </>
  );
}

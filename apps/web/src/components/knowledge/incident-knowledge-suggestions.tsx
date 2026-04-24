"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Lightbulb, History as HistoryIcon, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Button, LoadingSpinner } from "@/components/ui";
import { KnowledgeSuggestionResponse } from "@/types/api";

interface IncidentKnowledgeSuggestionsProps {
  title: string;
  description: string;
  incidentId?: string;
  limit?: number;
}

export function IncidentKnowledgeSuggestions({
  title,
  description,
  incidentId,
  limit = 5
}: IncidentKnowledgeSuggestionsProps) {
  const [payload, setPayload] = useState<KnowledgeSuggestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [localFeedback, setLocalFeedback] = useState<Record<string, "yes" | "no">>({});

  const queryReady = useMemo(() => `${title} ${description}`.trim().length >= 8, [title, description]);

  useEffect(() => {
    let isActive = true;
    const timer = window.setTimeout(async () => {
      if (!queryReady) {
        setPayload(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const url = incidentId
          ? `/incidents/${incidentId}/knowledge-suggestions`
          : "/incidents/knowledge-suggestions";
        const params = incidentId ? { limit } : { title, description, limit };
        const data = await apiClient.get<KnowledgeSuggestionResponse>(url, params);

        if (isActive) {
          setPayload(data);
        }
      } catch (err) {
        if (isActive) {
          setError(getApiErrorMessage(err, "Failed to load knowledge suggestions"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [title, description, incidentId, limit, queryReady]);

  const feedbackItems = payload?.solutions || [];
  const similarIncidents = payload?.similarIncidents || [];
  const hasSuggestions = feedbackItems.length > 0 || similarIncidents.length > 0;

  const submitFeedback = async (sourceType: "incident" | "problem", sourceId: string, helpful: boolean) => {
    if (!incidentId) {
      return;
    }

    const key = `${sourceType}:${sourceId}`;
    try {
      setSubmittingKey(key);
      setError(null);
      await apiClient.post(`/incidents/${incidentId}/knowledge-feedback`, {
        sourceType,
        sourceId,
        helpful
      });
      setLocalFeedback((previous) => ({
        ...previous,
        [key]: helpful ? "yes" : "no"
      }));
      const refreshed = await apiClient.get<KnowledgeSuggestionResponse>(`/incidents/${incidentId}/knowledge-suggestions`, {
        limit
      });
      setPayload(refreshed);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save feedback"));
    } finally {
      setSubmittingKey(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-card p-4 kpi-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Knowledge Suggestions</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ranked by text similarity, past feedback, and recency.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {!queryReady ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          Add a title and description to generate suggestions.
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <LoadingSpinner />
          Searching similar incidents and solutions...
        </div>
      ) : !payload || !hasSuggestions ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          No strong matches yet. Try adding more detail or keywords.
        </div>
      ) : (
        <div className="space-y-4">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lightbulb className="h-4 w-4 text-accent" />
              Suggested Solutions
            </div>

            {feedbackItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No solution matches found.</p>
            ) : (
              <div className="space-y-3">
                {feedbackItems.map((item) => {
                  const key = `${item.sourceType}:${item.sourceId}`;
                  const feedbackChoice = localFeedback[key];
                  const isSubmitting = submittingKey === key;

                  return (
                    <div key={key} className="rounded-lg border border-border/50 bg-background p-3 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <span className="text-[10px] rounded-full border border-border px-2 py-0.5 uppercase text-muted-foreground">
                              {item.score}% match
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                        </div>
                        <div className="text-right text-[11px] text-muted-foreground">
                          <div>{item.helpfulCount} helpful</div>
                          <div>{Math.round(item.helpfulRate * 100)}% helpful rate</div>
                        </div>
                      </div>

                      <p className="text-sm text-foreground">{item.solution}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] rounded border border-border bg-muted px-2 py-0.5 uppercase text-muted-foreground">
                          {item.sourceType}
                        </span>
                        {item.sourceType === "incident" ? (
                          <Link
                            href={`/incidents/${item.sourceId}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Open related incident
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">From problem knowledge base</span>
                        )}
                      </div>

                      {incidentId && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Was this solution helpful?</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            isLoading={isSubmitting}
                            onClick={() => void submitFeedback(item.sourceType as "incident" | "problem", item.sourceId, true)}
                          >
                            <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Yes
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            isLoading={isSubmitting}
                            onClick={() => void submitFeedback(item.sourceType as "incident" | "problem", item.sourceId, false)}
                          >
                            <ThumbsDown className="mr-1 h-3.5 w-3.5" /> No
                          </Button>
                          {feedbackChoice && (
                            <span className="text-xs text-accent">
                              Thanks for the feedback: {feedbackChoice === "yes" ? "helpful" : "not helpful"}.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <HistoryIcon className="h-4 w-4 text-primary" />
              Similar Incidents
            </div>

            {similarIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No similar incidents found.</p>
            ) : (
              <div className="space-y-3">
                {similarIncidents.map((item) => (
                  <div key={item.sourceId} className="rounded-lg border border-border/50 bg-background p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <span className="text-[10px] rounded-full border border-border px-2 py-0.5 uppercase text-muted-foreground">
                            {item.score}% match
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                      <span className="text-[10px] rounded border border-border bg-muted px-2 py-0.5 uppercase text-muted-foreground">
                        {String(item.status || "unknown")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Priority {String(item.priority || "n/a").toLowerCase()}</span>
                      <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>{item.helpfulCount} helpful votes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
